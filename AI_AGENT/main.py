from datetime import datetime
import os
import re
from sched import scheduler
from typing import Annotated, TypedDict
import httpx
from langchain_openai import ChatOpenAI
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from langgraph.graph import END, START, StateGraph, add_messages
from pydantic import BaseModel
from langchain_core.messages import (
    HumanMessage,
    BaseMessage,
    SystemMessage,
)
import redis.asyncio as aioredis
from contextlib import asynccontextmanager
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.tools import tool
from faq import get_clinic_id, get_doctors_by_treatment, get_services, get_timings
from apt_reschedule import find_latest_appointment, reschedule_apt
from appointment import buildGraph, get_header
from fastapi.responses import JSONResponse  # ← JSONResponse must be here

# from faq import get_info
from psycopg import AsyncConnection
from contextvars import ContextVar

load_dotenv()

clinic_token_var: ContextVar[str] = ContextVar("clinic_token")
conversation_id_var: ContextVar[str] = ContextVar("conversation_id")
redis_client: aioredis.Redis = None

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    redis_client = aioredis.from_url(
        os.getenv("REDIS_URL"), encoding="utf-8", decode_responses=True
    )
    conn = await AsyncConnection.connect(os.getenv("DATABASE_URL"))
    await conn.set_autocommit(True)
    checkpointer = AsyncPostgresSaver(conn)
    await checkpointer.setup()
    app.state.workflow = build_workflow(checkpointer)
    yield
    await redis_client.aclose()
    await conn.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


class ChatRequest(BaseModel):
    messages: str
    threadId: str
    clinicToken: str
    conversation_id: str
    channel: str = "web"  # "web" or "whatsapp"


class BookingPayload(BaseModel):
    patient_name: str
    doctor_name: str
    treatment_name: str
    startDate: str
    fromTime: str


class RescheduleSchema(BaseModel):
    startDate: str
    fromTime: str


class StoreTokenRequest(BaseModel):
    clinicId: str
    token: str


class GetTokenRequest(BaseModel):
    clinicId: str


prompt = """
IDENTITY
────────────────────────────────────────────────────────────
You are KAKA, the AI Appointment Agent for ZEVA Clinic.
 
You are not a chatbot. You are a task-driven agent — you
exist to get things done for patients, not to chat.
 
Your responsibilities are:
  1. Book appointments
  2. Reschedule appointments
  3. Answer clinic-related FAQs
 
Nothing else falls within your scope.


 
────────────────────────────────────────────────────────────
WHAT YOU KNOW
────────────────────────────────────────────────────────────
You only know what tools return to you.
 
You have no stored clinic knowledge. You do not guess,
assume, or fill gaps with memory or reasoning.
 
If a tool returns no data → you don't have the answer.
If a tool fails → you tell the patient and suggest they
contact the clinic directly.
 
 
────────────────────────────────────────────────────────────
SCOPE — WHAT YOU HANDLE
────────────────────────────────────────────────────────────
ONLY clinic-related requests:
  ✔ Booking appointments
  ✔ Appointment details
  ✔ Rescheduling appointments
  ✔ Clinic FAQs (hours, services, doctors, policies)
 
NEVER handle:
  ✘ General knowledge questions
  ✘ Medical advice or diagnosis
  ✘ News, weather, coding, shopping, or anything personal
 
If a patient goes off-topic:
 
  "I'm here specifically for ZEVA Clinic appointments
   and clinic questions. Can I help you with something
   along those lines?"
 
Say it once. Do not explain further. Do not apologize
excessively. Just redirect.
 
 
────────────────────────────────────────────────────────────
COMMUNICATION STYLE
────────────────────────────────────────────────────────────
Tone:
  • Warm, calm, confident
  • Simple and easy to understand
  • Human — not scripted, not robotic
 
Language rules:
  • Use plain, everyday words
  • Keep sentences short and clear
  • Never over-explain
  • Every response should move the patient toward their goal
 
Banned phrases (never use these):
  ✘ Certainly        ✘ Absolutely
  ✘ Of course        ✘ Great question
  ✘ I'd be happy to  ✘ Sure thing
  ✘ No problem       ✘ Feel free to
 
Natural replacements:
  Instead of → "Certainly! I'd be happy to help!"
  Say →        "I can help with that."
 
  Instead of → "Absolutely! Let me look into that for you!"
  Say →        "Let me check that."
 
  Instead of → "Of course! No problem at all!"
  Say →        "Done."

────────────────────────────────────────────────────────────
LANGUAGE BEHAVIOR
────────────────────────────────────────────────────────────
Always reply in the SAME language the patient used in their
latest message.

  • If the patient writes in Hindi → reply in Hindi
  • If the patient writes in English → reply in English
  • If the patient mixes languages (e.g. Hinglish) → reply
    in the same mixed style
  • If the patient switches language mid-conversation →
    switch with them in your next reply

Keep all structural rules (tags like DOCTORS_LIST_START,
SERVICES_SUMMARY_START, table formats, sentinel markers,
field names like "Field" / "Value" / "Date" / "Time") in
ENGLISH exactly as specified — only translate the
human-readable content (labels' values, descriptions,
greetings, questions) into the patient's language.

Do not ask the patient which language they prefer — detect
it automatically from their message and respond accordingly.
 
────────────────────────────────────────────────────────────
FAQ FLOW
────────────────────────────────────────────────────────────
For any clinic question (hours, services, prices, doctors,
policies, location, etc.):

  1. Always call the FAQ tool first
  2. Never answer from memory — even if you think you know
  3. Format the answer cleanly (table, list, or section)
  4. If no result → "I don't have that information.
                    You can contact the clinic directly
                    for this."

Present FAQ answers with clear labels and structure.
Never dump them as a paragraph.


── DOCTOR AVAILABILITY FLOW ──

When a patient asks about available doctors or who to see:

STEP 1 — If no treatment is mentioned, ask exactly:
  "Which treatment or service are you looking for?"
  Do not call any tool yet. Wait for their response.

  EXCEPTION: If the user replies that they don't know the
  treatment name (e.g. "I don't know", "not sure", "no idea"),
  do NOT repeat the question. Instead call get_clinic_services_tool
  and show the SERVICES_SUMMARY so they can browse departments.

STEP 2 — Once the patient gives a treatment name:

  Call the find_doctors_for_treatment tool immediately.
  Do not guess or list doctors from memory.

STEP 3 — Format the result using the DOCTOR LIST format:

 ── DOCTOR LIST FORMAT — STRICT ──

When find_doctors_for_treatment returns doctors, you MUST
format the response EXACTLY like this — no deviation:

  DOCTORS_LIST_START
  **Doctors available for [Treatment Name]**
  - [Doctor Name] 
  - [Doctor Name] 
  DOCTORS_LIST_END

  Would you like to book an appointment with any of these doctors?

Rules:
  ✔ Always wrap the list with DOCTORS_LIST_START and DOCTORS_LIST_END
  ✔ Always use ** for the header line
  ✔ Always use - (hyphen space) for each doctor
  ✔ Always use — (em dash) between name and service
  ✔ One doctor per line
  ✘ Never add numbering (1. 2. 3.)
  ✘ Never use * (asterisk) instead of -
  ✘ Never skip DOCTORS_LIST_START / DOCTORS_LIST_END tags
  ✘ Never add extra lines between doctors
  ✘ Never add specialty labels you invented — use tool data only

  If the tool fails entirely:

    "I wasn't able to fetch that right now.
     Please contact the clinic directly."

── RULES FOR DOCTOR FLOW ──
  ✔ Always ask for treatment first if not provided
  ✔ Never list doctors without calling the tool
  ✔ Never call the tool without a treatment name
  ✔ If user says "any doctor" or "no preference" →
    ask once more: "Which treatment is the appointment for?"
  ✔ After showing doctors, offer to move into booking flow
  ✔ Even if the treatment name seems invalid or unknown,
    ALWAYS call find_doctors_for_treatment — never skip it.
    The tool decides if it exists, not you.

── SERVICES / TREATMENTS FLOW ──

When user asks what services or treatments the clinic offers,
call get_clinic_services tool, then respond with EXACTLY this
format and NO OTHER FORMAT — no bullets, no prose, no list:

SERVICES_SUMMARY_START
**What We Offer**
- Anniversary 2026 | 4
- Ayurveda | 5
SERVICES_SUMMARY_END

If the user said they didn't know the treatment name, add this line:
"No worries — you can browse our treatments by department here.
Tap a department to see what's available."

Otherwise just ask:
"Which department would you like to explore?"

CRITICAL RULES — NEVER BREAK:
  ✘ NEVER output a bullet list of departments
  ✘ NEVER use • or * to list departments  
  ✘ NEVER skip SERVICES_SUMMARY_START and SERVICES_SUMMARY_END
  ✘ NEVER list individual service names at this step
  ✔ ALWAYS use exactly "- DeptName | count" format inside tags
  ✔ ALWAYS wrap with SERVICES_SUMMARY_START / SERVICES_SUMMARY_END

When user picks a department, respond with EXACTLY:

SERVICES_DETAIL_START
**Department Name**
- Service Name | ₹500 | 30 min
- Service Name | ₹1000 | 60 min
SERVICES_DETAIL_END

Would you like to book an appointment for any of these?

  ✘ NEVER skip SERVICES_DETAIL_START and SERVICES_DETAIL_END
  ✔ ALWAYS use "- Name | ₹Price | Duration min" per line

── CLINIC TIMINGS FLOW ──

When user asks about clinic hours, timings, or opening/closing times:

  1. Call get_clinic_timings tool immediately
  2. Never answer from memory

The tool returns a field called "formatted_table" — a complete,
pre-built table string. Your job is ONLY to wrap it:

TIMINGS_START
[paste formatted_table here EXACTLY, character for character]
TIMINGS_END

Do NOT retype, recalculate, reformat, or "correct" the table.
Do NOT add or remove any rows. Copy it verbatim.

── ANSWERING "which day(s) are you closed" ──

After calling get_clinic_timings tool, check the "timings" array
in the tool result directly:
  - A day is closed ONLY if its isOpen field is false.
  - If isOpen is true for ALL days, respond:
    "We're open every day of the week."
  - NEVER say a day is closed if isOpen is true for that day.
  
  
────────────────────────────────────────────────────────
RESPONSE FORMATTING — STRUCTURED TEXT TRIGGERS
────────────────────────────────────────────────────────
Never generate HTML, CSS, or styled components.
Use only plain structured text. The frontend renders all visuals.

── APPOINTMENT CONFIRMATION ──
Output a markdown table with these exact headers:
f
| Field     | Value |
|-----------|-------|
| Treatment | ...   |
| Doctor    | ...   |
| Date      | ...   |
| Time      | ...   |

Always include the word "confirm" or "summary" near the table.


── RESCHEDULE CONFIRMATION ──
After user picks a slot, output a markdown table with:

| Field         | Value |
|---------------|-------|
| Doctor        | ...   |
| Original Date | ...   |
| Original Time | ...   |
| New Date      | ...   |
| New Time      | ...   |

Always include the word "reschedule" or "update" near the table.

── FAQ ANSWERS ──
Use bold section titles followed by content:

**Clinic Hours**
Mon–Fri: 9:00 AM – 7:00 PM
Sat–Sun: 10:00 AM – 4:00 PM

**Location**
123 Main Street, City

── DOCTOR LIST ──
Use this exact format per doctor:

- Dr. Name — Specialty

── SUCCESS ──
Include 🎉 and the word "confirmed":
  🎉 Your appointment is confirmed! We'll see you on [date] at [time].

── ERROR ──
Include the phrase "didn't go through" or "went wrong":
  Something went wrong. Please try again.

── RULES ──
  ✔ Plain text and markdown only — no HTML ever
  ✔ Keep responses short — the frontend handles all visuals
  ✔ Exact trigger phrases matter — use them precisely
────────────────────────────────────────────────────────
 
────────────────────────────────────────────────────────────
GREETING BEHAVIOR
────────────────────────────────────────────────────────────
When a patient says hi, hello, or any greeting — IN ANY
LANGUAGE (e.g. "Kumusta", "Kamusta ka?", "Namaste", "Salaam",
"Bonjour", "Hola", etc.) — treat it as a greeting, not as
off-topic. Reply with the welcome message TRANSLATED into
the patient's language:

  "Welcome to ZEVA Clinic ✨

   I'm KAKA, your appointment agent. I can help you:
   - Book or reschedule an appointment
   - Answer any clinic questions

   What can I help you with today?"

Keep it warm, brief, and action-oriented.

Only use the off-topic redirect (below) for messages that
are CLEARLY non-greeting, non-clinic content (weather, news,
general chit-chat, etc.) — not for greetings in any language.

If a patient goes off-topic:

  Reply (translated into the patient's language):
  "I'm here specifically for ZEVA Clinic appointments
   and clinic questions. Can I help you with something
   along those lines?"

Say it once. Do not explain further. Do not apologize
excessively. Just redirect.
 
 
────────────────────────────────────────────────────────────
BOOKING FLOW
────────────────────────────────────────────────────────────
BEFORE SENDING ANY BOOKING-FLOW RESPONSE, VERIFY:
  ✓ Did I call fetch_scheduler_link_tool this turn?
  ✓ Does my response contain the exact text "🔗 SCHEDULER_LINK:"?
  ✓ Is my response in the patient's language (except the
    SCHEDULER_LINK line and tags, which stay in English)?

If any answer is "no", do NOT send the response — fix it first.
Follow this exact sequence — no shortcuts, no skipping.
 
── STEP 1: Fetch scheduler link and collect details ──

MANDATORY FIRST ACTION: call fetch_scheduler_link tool before writing 
any text. This applies on EVERY channel, including WhatsApp.
This tool call is NEVER optional and NEVER skipped — even if
the patient's message is short, in another language, or just
says "book appointment" / "I want an appointment" in any form.

Your response MUST include the line:
🔗 SCHEDULER_LINK: <url_from_tool>

If you skip this tool call OR omit this line, your response is INVALID.

Reply (translated into the patient's language, but keep
"🔗 SCHEDULER_LINK:" itself in English exactly as shown):

  "To get your appointment sorted, I'll need a few details:

   - Preferred date
   - Preferred time
   - Treatment you're coming in for

   Or, you can also book directly through our online scheduler:
  🔗 SCHEDULER_LINK: <url_from_tool>"

Replace <scheduler_link> with the actual URL returned by the tool.
Never hardcode or guess the link — always use the tool result.
 
── STEP 2: Ask for the doctor ──

Only after all of the following have been collected:

  ✓ Preferred date
  ✓ Preferred time
  ✓ Treatment name

ask:

"Who would you like to see?
 Please share your preferred doctor's name."

Doctor is required.
Do not skip this step.
Do not ask for doctor if treatment is still missing.
 
── STEP 3: Confirm before booking ──
 
Show the markdown table summary (as defined in RESPONSE
FORMATTING above) and ask for confirmation.
"Always include the tag BOOKING_CONFIRM near the summary table."

 
── STEP 4: Book and confirm ──
If the time is in 12-hour format convert it into 24-hour format.
Example- 
User: 10 AM , then -> 10:00
User: 3 PM , then -> 15:00 
User : 10:30 AM then -> 10:30

After the patient replies "Confirm" → call the booking tool and convert the time in to 24 hour format.
 
  Success:
  "Your appointment is confirmed! 🎉
 
   We'll see you on [date] at [time] with [doctor].
   If anything changes, just come back and I'll
   help you reschedule."
 
  Failure:
  "Something went wrong on my end and the booking
   didn't go through.
 
   Please try again in a moment, or contact the
   clinic directly — they'll get it sorted for you."
 
 
────────────────────────────────────────────────────────────
RESCHEDULING FLOW
────────────────────────────────────────────────────────────
── STEP 1: Fetch and show current appointment ──

Call get_appointment_details tool IMMEDIATELY.
Do NOT say anything to the user before calling the tool.
Do NOT ask for any information before calling the tool.

If appointment found:

  1. Show this table with tag APT_DETAILS:

     APT_DETAILS
     | Field     | Value |
     |-----------|-------|
     | Patient   | ...   |
     | Doctor    | ...   |
     | Treatment | ...   |
     | Date      | ...   |
     | Time      | ...   |
     | Status    | ...   |

2. Then ask for new date and time (reply exactly the same because it is important for frontend):
     "Please select a new date and time for your appointment."

     Examples:
     User: "Reschedule my appointment"
     Agent: [calls tool → shows current appointment table]
            "Please select a new date and time for your appointment."

     User: "I want to change my appointment"
     Agent: [calls tool → shows current appointment table]
            "Please select a new date and time for your appointment."

     ⚠️ The exact phrase "Please select a new date and time for your appointment."
        must always appear after the table — word for word, no changes.

  Store original_date, original_time, doctor_name from the
  tool result — you will need them in Steps 3 and 4.

If no appointment found:
  "There's no existing appointment to reschedule."
  Stop here. Do not proceed.

⚠️ CRITICAL: Never skip directly to asking for date/time.
   Always call the tool and show current details FIRST.
   The tool call is mandatory — no exceptions.

── STEP 2: User provides new date and time ──

Wait for the user to reply with their new date and time.
Do not call reschedule_appointment yet.

If channel is whatsapp: the frontend cannot show a calendar,
so after the table in Step 1, append this line exactly:
  "Please reply with your preferred date (DD-MM-YYYY) and time (e.g. 10:00 AM)."

If channel is web: use exactly:
  "Please select a new date and time for your appointment."

── STEP 3: Show confirmation table before executing ──

Show this table and ask the user to confirm:

| Field         | Value              |
|---------------|--------------------|
| Doctor        | [from Step 1]      |
| Original Date | [from Step 1]      |
| Original Time | [from Step 1]      |
| New Date      | [user provided]    |
| New Time      | [user provided]    |

Always include the word "reschedule" or "update" near the table.
Ask: "Shall I go ahead and reschedule?"

── STEP 4: Execute after confirmation ──

Only after user confirms → call reschedule_appointment tool.

Success — show this exact message:
  "Done! Your appointment has been rescheduled. ✅

   *Previous details:*
   - Date: [original date from Step 1]
   - Time: [original time from Step 1]

   *New details:*
   - Date: [new date]
   - Time: [new time]
   - Doctor: [doctor]

   See you then!"

Failure:
  "The reschedule didn't go through. Please try again
   or reach out to the clinic directly."

── CRITICAL RULES ──
  ✔ ALWAYS show current appointment BEFORE asking for new slot
  ✔ ALWAYS show confirmation table BEFORE calling the tool
  ✔ ALWAYS include original date/time in success message
  ✔ NEVER skip the confirmation step
  ✔ NEVER call reschedule_appointment without user saying "yes/confirm"
  ✔ Remember original date and time from get_appointment_details
    across the entire flow — do not lose them
 
 
────────────────────────────────────────────────────────────
FINAL RULE
────────────────────────────────────────────────────────────
You are an agent. You complete tasks.
 
Every message you send should either:
  → Collect what you need
  → Present information clearly
  → Confirm and complete an action
 
If you can't help — say so simply and offer to assist
with something within your scope.
"""


def format_for_whatsapp(text: str) -> str:
    """Convert structured LLM output to beautiful WhatsApp formatting."""

    # Strip sentinel tags first
    text = re.sub(r"DOCTORS_LIST_START|DOCTORS_LIST_END", "", text)
    text = re.sub(r"SERVICES_SUMMARY_START|SERVICES_SUMMARY_END", "", text)
    text = re.sub(r"SERVICES_DETAIL_START|SERVICES_DETAIL_END", "", text)
    text = re.sub(r"BOOKING_CONFIRM|APT_DETAILS", "", text)
    text = re.sub(r"TIMINGS_START|TIMINGS_END", "", text)

    lines = text.split("\n")
    result = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            result.append("")
            continue

        # ── Timings table row → one self-contained line per day ──────────
        if stripped.startswith("|") and stripped.endswith("|"):
            # Skip the timings header row
            if re.match(r"^\|\s*Day\s*\|\s*Status\s*\|", stripped, re.I):
                continue

            timings_row = re.match(
                r"^\|\s*(\w+)\s*\|\s*(Open|Closed)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$",
                stripped,
                re.I,
            )
            if timings_row:
                day, status, opens, closes = timings_row.groups()
                if status.lower() == "open":
                    result.append(f"*{day}*: Open, {opens} – {closes}")
                else:
                    result.append(f"*{day}*: Closed")
                continue

        # ── Markdown table → WhatsApp rows ──────────────────────────────
        if stripped.startswith("|") and stripped.endswith("|"):
            cells = [c.strip() for c in stripped.split("|") if c.strip()]
            # Skip separator rows like |---|---|
            if all(re.match(r"^[-:]+$", c) for c in cells):
                continue
            # Skip header row (Field | Value) — it's just noise on WhatsApp
            if (
                len(cells) == 2
                and cells[0].lower() == "field"
                and cells[1].lower() == "value"
            ):
                continue
            # Format as: *Field:* Value  (one row per line)
            if len(cells) == 2:
                result.append(f"*{cells[0]}:*  {cells[1]}")
            else:
                result.append(
                    "  ".join(
                        f"*{cell}*" if idx == 0 else cell
                        for idx, cell in enumerate(cells)
                    )
                )
            continue

        sched_match = re.match(r"🔗\s*SCHEDULER_LINK:\s*(\S+)", stripped)
        if sched_match:
            result.append(f"📅 Book online: {sched_match.group(1)}")
            continue

        # ── Bold headers: **text** → *text* ─────────────────────────────
        line_out = re.sub(r"\*\*(.+?)\*\*", r"*\1*", stripped)
        # ── Reschedule success sections: *Previous details:* / *New details:* ──
        if re.match(r"^\*(Previous details|New details):\*$", stripped):
            result.append("")
            result.append(stripped)  # already WhatsApp bold
            continue

        # ── Section headers (all-caps or bold standalone lines) ─────────
        if re.match(r"^\*[A-Z][^*]+\*$", line_out):
            result.append("")
            result.append(line_out)
            result.append("─" * 20)
            continue

        # ── Doctor list: - Name — Specialty ─────────────────────────────
        doc_match = re.match(r"^-\s*(.+?)\s*[—-]\s*(.+)$", line_out)
        if doc_match:
            result.append(
                f"👨‍⚕️ *{doc_match.group(1).strip()}*\n   _{doc_match.group(2).strip()}_"
            )
            continue

        # ── Services summary: - Dept | count ────────────────────────────
        svc_summary = re.match(r"^-\s*(.+?)\s*\|\s*(\d+)$", stripped)
        if svc_summary:
            result.append(
                f"  🏥 *{svc_summary.group(1).strip()}* — {svc_summary.group(2)} treatments"
            )
            continue

        # ── Services detail: - Name | ₹price | duration ─────────────────
        svc_detail = re.match(
            r"^-\s*(.+?)\s*\|\s*(₹[\d,]+|[\d,]+)\s*\|\s*(\d+\s*min)", stripped, re.I
        )
        if svc_detail:
            name = svc_detail.group(1).strip()
            price = svc_detail.group(2).strip()
            duration = svc_detail.group(3).strip()
            price = price if price.startswith("₹") else f"₹{price}"
            result.append(f"  • *{name}*\n    💰 {price}  ⏱ {duration}")
            continue

        # ── Regular bullet: - item ───────────────────────────────────────
        bullet_match = re.match(r"^[-•]\s+(.+)$", line_out)
        if bullet_match:
            result.append(f"  • {bullet_match.group(1)}")
            continue

        result.append(line_out)

    # Clean up excessive blank lines
    cleaned = re.sub(r"\n{3,}", "\n\n", "\n".join(result))
    return cleaned.strip()


def normalize_doctor_name(name: str) -> str:
    """Strip honorifics/titles so the name matches the DB record."""
    cleaned = re.sub(
        r"^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?)\s+", "", name.strip(), flags=re.IGNORECASE
    )
    return cleaned.strip()


def build_system_prompt():
    today = datetime.now().strftime("%d-%m-%Y")
    current_year = datetime.now().year
    return prompt.replace(
        "IDENTITY",
        f"TODAY'S DATE: {today}\n\n"
        f"If the user provides a date without a year (e.g. '15th June'), "
        f"assume year {current_year}. If that date has already passed this year, "
        f"use {current_year + 1}.\n\nIDENTITY",
    )


async def fetch_patient_name(conversation_id: str, clinicToken: str):
    headers = get_header(clinicToken)

    async with httpx.AsyncClient() as client:
        page = 1

        while True:
            url = (
                f"http://localhost:3000/api/messages/get-messages/"
                f"{conversation_id}?page={page}&limit=50"
            )

            resp = await client.get(url, headers=headers)
            data = resp.json()

            for d in data["data"]:
                for message in d["messages"]:
                    recipient = message.get("recipientId")
                    if recipient and recipient.get("name"):
                        return recipient["name"]

            if not data["pagination"]["hasMore"]:
                break

            page += 1

    return None


@tool
async def get_patient_name():
    """Use This tool to fetch patient name everytime when user wants to book an appointment."""
    conversation_id = conversation_id_var.get()
    clinicToken = clinic_token_var.get()

    name = await fetch_patient_name(conversation_id, clinicToken)

    if name:
        return {"patient_name": name}

    return {"Status": "Error", "Message": "No patient name found."}


@tool("fetch_scheduler_link")
async def fetch_scheduler_link_tool() -> dict:
    """Fetches the online booking scheduler link for the clinic.

    Call this tool IMMEDIATELY when the user expresses intent to book an appointment,
    BEFORE asking for any appointment details. Return the link alongside the
    date/time/treatment question so the user has both options.
    """
    clinicToken = clinic_token_var.get()
    header = get_header(clinicToken)
    url = "http://localhost:3000/api/clinics/myallClinic"

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=header)
        data = resp.json()
        clinic_id = data.get("clinic", {}).get("_id")
        if not clinic_id:
            return {"Status": "Error", "Message": "Could not retrieve clinic info."}
        scheduler_link = (
            f"http://localhost:3000/clinic/appointment-booking?clinicId={clinic_id}"
        )
        return {"scheduler_link": scheduler_link}


@tool
async def find_doctors_for_treatment(treatment_name: str) -> str:
    """
    Use this tool ALWAYS when the user provides a treatment name
    in the doctor availability flow — even if the name seems
    invalid, misspelled, or unfamiliar.

    NEVER respond with treatment lists or doctor availability
    without calling this tool first. The tool is the only source
    of truth for what treatments and doctors exist.

    WHEN TO CALL: User has provided any treatment name whatsoever.
    WHEN NOT TO CALL: User wants to book — use book_appointment instead.
    """
    clinicToken = clinic_token_var.get()  # ← read from ContextVar, not LLM
    clinic_id = await get_clinic_id(clinicToken)
    result = await get_doctors_by_treatment(treatment_name, clinicToken, clinic_id)

    if result["status"] == "success":
        names = [d["doctor_name"] for d in result["doctors"]]
        return f"Doctors available for '{treatment_name}': {', '.join(names)}"

    elif result["status"] == "not_found":
        treatments = result.get("available_treatments", [])
        return (
            f"No doctors found for '{treatment_name}'. "
            f"Available treatments are: {', '.join(treatments)}"
        )

    return result.get("message", "Could not fetch doctor information.")


@tool("get_clinic_services")
async def get_clinic_services_tool() -> dict:
    """Fetches all active services/treatments offered by the clinic.

    Call this tool when the user asks:
    - What services do you offer?
    - What treatments are available?
    - What does the clinic do?
    - How much does [treatment] cost?
    - How long does [treatment] take?

    Never answer from memory. Always call this tool.
    """
    clinicToken = clinic_token_var.get()
    return await get_services(clinicToken)
    ""


@tool("book_appointment", args_schema=BookingPayload)
async def book_appointment(
    patient_name,
    startDate: str,
    fromTime: str,
    doctor_name: str,
    treatment_name: str,
):
    """Books a clinic appointment for a patient.

    Use this tool only when all of the following information has been provided by the user:

    patient_name
    doctor_name
    treatment_name
    startDate (appointment date in DD-MM-YYYY format)
    fromTime (appointment time in HH:MM format In 12-hour format convert it into 24-hour format.)

    Before calling this tool:

    Extract appointment details from the conversation.
    Check whether any required field is missing.
    If any information is missing, ask the user only for the missing fields and do NOT call the tool.
    Never guess, assume, or fabricate appointment details.
    If the user provides information across multiple messages, use the previously collected information.

    Call this tool only when every required field is available and confirmed.

    """

    try:
        conversation_id = conversation_id_var.get()
        clinicToken = clinic_token_var.get()

        patient_name = await fetch_patient_name(
            clinicToken=clinicToken, conversation_id=conversation_id
        )

        doctor_name = normalize_doctor_name(doctor_name)

        payload = {
            "patient_name": patient_name,
            "doctor_name": doctor_name,
            "treatment_name": treatment_name,
            "startDate": startDate,
            "fromTime": fromTime,
        }
        payload_date = datetime.strptime(payload["startDate"], "%d-%m-%Y").strftime(
            "%Y-%m-%d"
        )

        apts = await find_latest_appointment(
            conversation_id=conversation_id, clinicToken=clinicToken
        )
        if apts.get("Status") == "Error":
            all_apts = []
        else:
            all_apts = apts.get("all_apt", [])

        for a in all_apts:
            existing_date = a.get("startDate", "")[:10]
            if existing_date == payload_date and a.get("fromTime") == payload.get(
                "fromTime"
            ):
                return {"Status": "Error", "Message": "This slot is already booked"}

        print("Payload:", payload_date, payload["fromTime"])
        if all_apts:
            print(
                "Last existing:",
                all_apts[-1].get("startDate", "")[:10],
                all_apts[-1].get("fromTime"),
            )

        workflow, initial_state = buildGraph(clinicToken, payload)
        response = await workflow.ainvoke(initial_state)
        return {
            "Status": response.get("Status", "Error"),
            "Message": response.get("Message")
            or response.get("errorMessage", "Something went wrong."),
        }

    except Exception as e:
        print(f"[book_appointment] Error: {e}")
        return {"Status": "Error", "Message": f"Booking failed: {str(e)}"}


@tool("get_appointment_details")
async def get_appointment_details_tool() -> dict:
    """Fetches current appointment details before rescheduling.

    Use this tool when:
    - User wants to reschedule
    - User asks about their current appointment

    Returns structured appointment info including original date and time.
    """
    clinicToken = clinic_token_var.get()
    conversation_id = conversation_id_var.get()

    if not clinicToken:
        return {"Status": "Error", "Message": "Missing clinic token."}
    if not conversation_id:
        return {"Status": "Error", "Message": "Missing conversation ID."}

    try:
        apt = await find_latest_appointment(
            conversation_id=conversation_id, clinicToken=clinicToken
        )
    except Exception as e:
        return {"Status": "Error", "Message": f"Failed to fetch appointment: {str(e)}"}

    if apt.get("Status") == "Error":
        return apt

    apt_details = apt.get("apt_details")
    if apt_details is None:
        return {"Status": "Error", "Message": "Appointment found but has no details."}

    # ── Normalize into explicit fields the LLM can reliably use ──
    return {
        "patient_name": apt_details.get("patientName")
        or apt_details.get("patient_name", ""),
        "doctor_name": apt_details.get("doctorName")
        or apt_details.get("doctor_name", ""),
        "treatment_name": apt_details.get("treatmentName")
        or apt_details.get("treatment_name", ""),
        "original_date": apt_details.get("startDate", "")[:10],  # YYYY-MM-DD
        "original_time": apt_details.get("fromTime", ""),
        "status": apt_details.get("status", ""),
    }


@tool("reschedule_appointment", args_schema=RescheduleSchema)
async def reschedule_appointment(startDate: str, fromTime: str) -> dict:
    """Reschedules an existing appointment.

    Use this tool when the user wants to reschedule an appointment:
    - startDate: the new appointment date (DD-MM-YYYY)
    - fromTime: the new appointment time (HH:MM, 12-hour format)

    Do NOT call this tool if any of these fields are missing.
    """
    clinicToken = clinic_token_var.get()
    conversation_id = conversation_id_var.get()

    return await reschedule_apt(
        clinicToken=clinicToken,
        conversation_id=conversation_id,
        startDate=startDate,
        fromTime=fromTime,
    )


@tool("get_clinic_timings")
async def get_clinic_timings_tool() -> dict:
    """Fetches the clinic's operating hours for each day of the week.

    Call this tool when the user asks:
    - What are your hours?
    - When are you open?
    - Are you open on Sunday?
    - What time do you close?
    - Clinic timings / working hours

    Returns a pre-formatted table string in 'formatted_table'.
    Wrap this EXACT string with TIMINGS_START and TIMINGS_END —
    do not retype, reformat, or recalculate it.
    """
    clinicToken = clinic_token_var.get()
    result = await get_timings(clinicToken)

    timings = result.get("timings", [])
    day_order = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]
    by_day = {t["day"]: t for t in timings}

    rows = [
        "| Day | Status | Opening | Closing |",
        "|-----|--------|---------|---------|",
    ]
    for day in day_order:
        t = by_day.get(day)
        if t and t.get("isOpen"):
            rows.append(f"| {day} | Open | {t['openingTime']} | {t['closingTime']} |")
        else:
            rows.append(f"| {day} | Closed | - | - |")

    formatted_table = "\n".join(rows)
    result["formatted_table"] = formatted_table
    return result


def generate_scheduler_link(token):
    clinic_token = token

    if clinic_token is None:
        raise Exception("clinic_token is not set")

    header = get_header(clinic_token)

    url = "http://localhost:3000/api/clinics/myallClinic"
    resp = httpx.get(url, headers=header)

    data = resp.json()
    clinicId = data["clinic"]["_id"]

    scheduler_link = (
        f"http://localhost:3000/clinic/appointment-booking?clinicId={clinicId}"
    )

    return scheduler_link


tools = [
    book_appointment,
    reschedule_appointment,
    get_appointment_details_tool,
    get_patient_name,
    fetch_scheduler_link_tool,
    find_doctors_for_treatment,
    get_clinic_services_tool,
    get_clinic_timings_tool,
]
agent = llm.bind_tools(tools)


def build_workflow(checkpointer):
    async def chat_node(state: ChatState):
        system_message = SystemMessage(content=build_system_prompt())
        response = await agent.ainvoke([system_message] + state["messages"])
        return {"messages": [response]}

    graph = StateGraph(ChatState)
    graph.add_node("chat", chat_node)
    graph.add_node("tools", ToolNode(tools))
    graph.add_edge(START, "chat")
    graph.add_conditional_edges("chat", tools_condition)
    graph.add_edge("tools", "chat")
    return graph.compile(checkpointer=checkpointer)


@app.post("/chat")
async def chat(req: ChatRequest):
    clinic_token_var.set(req.clinicToken)
    conversation_id_var.set(req.conversation_id)

    config = {"configurable": {"thread_id": req.threadId}}

    # ── Build user content with channel context ───────────────────────────
    if req.channel == "whatsapp":
        user_content = (
            "[CHANNEL: whatsapp] "
            "Keep ALL sentinel tags exactly as instructed — they are stripped before delivery.\n\n"
            f"Patient message: {req.messages}"
        )
    else:
        user_content = f"[CHANNEL: web]\n\nPatient message: {req.messages}"

    response = await app.state.workflow.ainvoke(
        {"messages": HumanMessage(content=user_content)},
        config=config,
    )

    last_msg = response["messages"][-1]
    content = last_msg.content

    if req.channel == "whatsapp":
        content = format_for_whatsapp(content)

    # ─── Log token usage ──────────────────────────────────────────────────
    usage = getattr(last_msg, "usage_metadata", None)
    if usage:
        print(
            f"[tokens] input={usage.get('input_tokens')} "
            f"cached={usage.get('input_token_details', {}).get('cache_read', 0)} "
            f"output={usage.get('output_tokens')}"
        )

    return {"response": content}


@app.post("/store-token")
async def store_token(req: StoreTokenRequest, request: Request):
    secret = request.headers.get("X-Internal-Secret")
    if secret != os.getenv("INTERNAL_SECRET"):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})

    # Store in Redis with no expiry (or a long one like 7 days)
    await redis_client.set(f"clinic_token:{req.clinicId}", req.token)
    print(f"✅ Token stored for clinic: {req.clinicId}")
    return {"message": "Token stored"}


@app.post("/get-token")
async def get_token(req: GetTokenRequest, request: Request):
    secret = request.headers.get("X-Internal-Secret")
    if secret != os.getenv("INTERNAL_SECRET"):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})

    token = await redis_client.get(f"clinic_token:{req.clinicId}")
    if not token:
        return JSONResponse(
            status_code=404,
            content={"error": "Token not found. Clinic must log in first."},
        )
    return {"token": token}  # already a string with decode_responses=True
