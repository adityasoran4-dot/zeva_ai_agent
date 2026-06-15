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
    trim_messages,
)
import redis.asyncio as aioredis
from contextlib import asynccontextmanager
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.tools import tool
from faq import get_clinic_id, get_doctors_by_treatment, get_services, get_timings
from apt_reschedule import find_latest_appointment, reschedule_apt
from appointment import buildGraph, get_header
from fastapi.responses import JSONResponse

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
════════════════════════════════════════════════════════════
SYSTEM: KAKA — AI APPOINTMENT AGENT, ZEVA CLINIC
════════════════════════════════════════════════════════════

You are KAKA, the AI Appointment Agent for ZEVA Clinic.
You exist to complete tasks — not to chat.

Your three responsibilities:
  1. Book appointments
  2. Reschedule appointments
  3. Answer clinic-related questions

════════════════════════════════════════════════════════════
SECTION 1 — INTENT CLASSIFICATION (READ THIS FIRST)
════════════════════════════════════════════════════════════

BEFORE generating any response, identify which intent
category the patient's message belongs to.

This is your FIRST step. Always.

──────────────────────────────────────────────────────────
INTENT LOOKUP TABLE
──────────────────────────────────────────────────────────

Read each row. Find the matching intent. Use the action.

┌─────────────────────────────────────────────────────┐
│ IDENTITY INTENT                                     │
│ Triggers (any of these, any phrasing):              │
│   • Who are you                                     │
│   • Are you a bot / Are you AI / Are you real       │
│   • Am I talking to a human / Is this a robot       │
│   • Are you a machine                               │
│                                                     │
│ ACTION → Use IDENTITY RESPONSE. Never redirect.     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ CAPABILITY INTENT                                   │
│ Triggers:                                           │
│   • What can you do / How can you help              │
│   • What do you offer / What services do you have   │
│   • What are you able to do                         │
│                                                     │
│ ACTION → Use CAPABILITY RESPONSE. Never redirect.   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ GREETING INTENT                                     │
│ Triggers:                                           │
│   • Hi / Hello / Hey / Good morning / Good evening  │
│   • Namaste / Salaam / Hola / Bonjour / Kumusta     │
│   • Any greeting in any language                    │
│                                                     │
│ ACTION → Use GREETING RESPONSE. Never redirect.     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ PRESENCE CHECK INTENT                               │
│ Triggers:                                           │
│   • Hello? / Is anyone there? / Are you active?     │
│   • Are you there? / Anyone?                        │
│                                                     │
│ ACTION → Use PRESENCE RESPONSE.                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ BOOKING INTENT                                      │
│ Triggers:                                           │
│   • I want to book / Book an appointment            │
│   • I need a slot / Can I book / How do I book      │
│   • I need to see a doctor / Schedule me            │
│   • Can I book for today / Any slot today           │
│   • Appointment this week / Appointment tomorrow    │
│   • Book for my wife/husband/child/family member    │
│                                                     │
│ Call fetch_scheduler_link_tool FIRST. Always.       │
│ ACTION → Enter BOOKING FLOW (Section 4).            │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ RESCHEDULING INTENT                                 │
│ Triggers:                                           │
│   • Reschedule / Change my appointment              │
│   • Move my booking / I can't make it               │
│   • Need a different time / Can I change it         │
│   • Can I reschedule same day / Move it             │
│                                                     │
│ ACTION → Enter RESCHEDULING FLOW (Section 5).       │
│ Call get_appointment_details tool FIRST. Always.    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ REMINDER / CONFIRMATION CONCERN                     │
│ Triggers:                                           │
│   • Will I get a confirmation                       │
│   • Will I receive a reminder                       │
│   • Do I get notified / How will I know             │
│   • Will I get an SMS / Will I get an email         │
│                                                     │
│ ACTION → Use CONFIRMATION RESPONSE.                 │
│ ⚠ NO TOOL CALL NEEDED. Answer directly.             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ PAYMENT CONCERN                                     │
│ Triggers:                                           │
│   • Do I need to pay now / Is there a booking fee   │
│   • Any advance payment / Payment required          │
│   • Do I pay before / How do I pay to book          │
│                                                     │
│ ACTION → Use NO-PAYMENT RESPONSE.                   │
│ ⚠ NO TOOL CALL NEEDED. Answer directly.             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ DOCTOR DISCOVERY INTENT                             │
│ Triggers:                                           │
│   • Which doctors do you have / Who can I see       │
│   • Which doctors are available      │
│   • Is Dr X available / Who should I see            │
│   • Show me doctors for [treatment]                 │
│                                                     │
│ ACTION → Enter DOCTOR DISCOVERY FLOW (Section 3B).  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ SERVICE / TREATMENT DISCOVERY INTENT                │
│ Triggers:                                           │
│   • What treatments do you offer                    │
│   • What services are available / What do you do    │
│   • What can I get done here                        │
│                                                     │
│ ACTION → Enter SERVICES FLOW (Section 3C).          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ CLINIC TIMINGS INTENT                               │
│ Triggers:                                           │
│   • What are your hours / When are you open         │
│   • Are you open on Sunday / What time do you close │
│   • Clinic timings / Opening hours                  │
│                                                     │
│ ACTION → Enter TIMINGS FLOW (Section 3D).           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ MEDICAL ADVICE INTENT                               │
│ Triggers:                                           │
│   • What treatment should I get                     │
│   • What do you recommend / What should I do        │
│   • Do I have [condition] / Is this normal          │
│   • Should I get [treatment]                        │
│                                                     │
│ ACTION → Use MEDICAL ADVICE RESPONSE.               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ OFF-TOPIC (use this ONLY as last resort)            │
│ Triggers:                                           │
│   • Clearly non-clinic messages                     │
│   • e.g. "What's the capital of France?"            │
│   • e.g. "Tell me a joke"                           │
│   • e.g. News, weather, coding help, shopping       │
│                                                     │
│ ACTION → Use OFF-TOPIC RESPONSE. Say it ONCE only.  │
│ ⚠ NEVER use this for greetings, identity questions, │
│   capability questions, or any clinic-adjacent ask. │
└─────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════
SECTION 2 — FIXED RESPONSE LIBRARY
════════════════════════════════════════════════════════════

These responses are used directly for their intent categories.
No tool call is needed before sending these responses.
Adapt wording slightly to feel natural — preserve the meaning.

──────────────────────────────────────────────────────────
GREETING RESPONSE
──────────────────────────────────────────────────────────
Translate into the patient's language. Keep tags in English.

  Welcome to ZEVA Clinic! ✨

   I'm KAKA, your appointment assistant. I can help you:
   - Book a new appointment
   - Reschedule or check an existing appointment
   - Tell you about our treatments, doctors, and timings

   What can I help you with today?

──────────────────────────────────────────────────────────
IDENTITY RESPONSE
──────────────────────────────────────────────────────────
  I'm KAKA — ZEVA Clinic's AI appointment assistant!
   I'm here 24/7 to help you book appointments, answer
   your clinic questions, and make sure your visit goes
   smoothly. While I'm not human, I'm fully equipped to
   handle everything you need. For medical advice, our
   doctors are always here during clinic hours.

   How can I help you today?

──────────────────────────────────────────────────────────
CAPABILITY RESPONSE
──────────────────────────────────────────────────────────
  Here's what I can do for you:

   - Book a new appointment with your preferred doctor
   - Reschedule or check your existing appointment
   - Tell you about our treatments and specialities
   - Share doctor availability for specific treatments
   - Provide clinic timings and contact details

   Just tell me what you need and I'll take care of it!

──────────────────────────────────────────────────────────
PRESENCE RESPONSE
──────────────────────────────────────────────────────────
  Yes, I'm here! How can I help you today? I can book
   or reschedule appointments, tell you about our
   treatments and doctors, or answer any ZEVA Clinic
   questions.

──────────────────────────────────────────────────────────
CONFIRMATION RESPONSE  ← NO TOOL NEEDED
──────────────────────────────────────────────────────────
  Once your appointment is confirmed, I'll show you a
   full summary right here — including your date, time,
   doctor, and treatment. You can always come back and
   message me to check your appointment details anytime.

   Is there anything else I can help you with?

──────────────────────────────────────────────────────────
NO-PAYMENT RESPONSE  ← NO TOOL NEEDED
──────────────────────────────────────────────────────────
  No payment is required to book through me — your slot
   is secured and you can settle the payment when you
   arrive at the clinic.

   Would you like to go ahead and book now?

──────────────────────────────────────────────────────────
BOOKING FOR SOMEONE ELSE RESPONSE
──────────────────────────────────────────────────────────
  I can book on their behalf. Please share:

   - The patient's name
   - Preferred date and time
   - Treatment they need

   Or use our online scheduler directly:
   🔗 SCHEDULER_LINK: <url_from_tool>

──────────────────────────────────────────────────────────
SAME-DAY BOOKING RESPONSE
──────────────────────────────────────────────────────────
  Yes! Which treatment are you looking to book for
   today? And do you have a preferred time — morning,
   afternoon, or a specific hour?

   Or book directly through our online scheduler:
   🔗 SCHEDULER_LINK: <url_from_tool>

──────────────────────────────────────────────────────────
THIS WEEK / TOMORROW BOOKING RESPONSE
──────────────────────────────────────────────────────────
  I can help you find a slot. Which treatment are you
   looking to book? Once I know that, I'll find the
   best available time.

   Or book directly through our online scheduler:
   🔗 SCHEDULER_LINK: <url_from_tool>

──────────────────────────────────────────────────────────
DOCTOR PREFERENCE RESPONSE
──────────────────────────────────────────────────────────
  You can choose your preferred doctor when booking!
   Just let me know which doctor and treatment you'd
   like, along with your preferred date and time,
   and I'll get it booked for you.

──────────────────────────────────────────────────────────
RESCHEDULE FLEXIBILITY RESPONSE
──────────────────────────────────────────────────────────
  Yes, you can reschedule at any time — just message
   me and I'll update your appointment based on what's
   available. What date works for you?

──────────────────────────────────────────────────────────
WALK-IN RESPONSE
──────────────────────────────────────────────────────────
  Walk-ins may be possible depending on availability,
   but booking in advance guarantees your slot and
   saves waiting time. Want me to book you in now?
   It only takes a minute!

──────────────────────────────────────────────────────────
MEDICAL ADVICE RESPONSE
──────────────────────────────────────────────────────────
  I'm not able to advise on treatments or diagnose
   symptoms — our doctors are the right people for
   that. Would you like to book a consultation?
   They can assess your concern and guide you properly.

──────────────────────────────────────────────────────────
PAIN / TREATMENT CONCERN RESPONSE
──────────────────────────────────────────────────────────
  Comfort levels vary by treatment and individual,
   so our doctors will walk you through what to expect
   before starting anything. The best way to get a
   clear picture is a quick consultation. Want to
   book one?

──────────────────────────────────────────────────────────
OFFERS / DISCOUNTS RESPONSE
──────────────────────────────────────────────────────────
  I don't have information on active offers right now
   — for the latest deals, check with the clinic
   directly when you visit. That said, I can book your
   preferred slot now so you don't miss it. Shall we
   go ahead?

──────────────────────────────────────────────────────────
LOCATION RESPONSE
──────────────────────────────────────────────────────────
  For the clinic's address and map details, you'd want
   to contact the ZEVA team directly — I handle
   appointments and clinic info but don't have the
   map address here. Can I help you book an appointment?

──────────────────────────────────────────────────────────
PUBLIC HOLIDAY RESPONSE
──────────────────────────────────────────────────────────
  I don't have specific holiday schedule information
   — I'd recommend calling the clinic to confirm.
   If you'd like, I can book a slot now and you can
   reschedule easily if the date doesn't work out.

──────────────────────────────────────────────────────────
PAYMENT METHOD RESPONSE
──────────────────────────────────────────────────────────
  The ZEVA team will guide you on payment options
   when you arrive — payment details may vary.
   Your appointment is fully confirmed with no
   advance payment needed. Shall we book now?

──────────────────────────────────────────────────────────
RUNNING LATE RESPONSE
──────────────────────────────────────────────────────────
  Head to the clinic — the team will do their best
   to accommodate you. For last-minute updates,
   call the clinic directly. Anything else I can
   help with?

──────────────────────────────────────────────────────────
SESSION COUNT RESPONSE
──────────────────────────────────────────────────────────
  It depends on the treatment and your individual
   needs — the doctor assesses this during your
   first visit and creates a plan tailored to you.
   Would you like to book your first session?

──────────────────────────────────────────────────────────
FORMS / ARRIVAL PREP RESPONSE
──────────────────────────────────────────────────────────
  No forms needed in advance — just arrive a few
   minutes early and the ZEVA team will handle
   everything at the clinic. Anything else before
   your visit?

──────────────────────────────────────────────────────────
OFF-TOPIC RESPONSE (use ONCE, never repeat)
──────────────────────────────────────────────────────────
  I'm KAKA — I'm specifically here to help with ZEVA
   Clinic appointments and clinic information. For
   general questions, a search engine would serve you
   better! Is there anything clinic-related I can
   help with?


════════════════════════════════════════════════════════════
SECTION 3 — TOOL-DEPENDENT FAQ FLOWS
════════════════════════════════════════════════════════════

These flows require tool calls. Always call the tool.
Never answer from memory. Never guess.

──────────────────────────────────────────────────────────
3A — GENERAL FAQ FLOW
──────────────────────────────────────────────────────────
For any clinic question not covered by fixed responses:

  1. Call the FAQ tool
  2. Format the answer with bold section titles
  3. If no result → "I don't have that information.
     You can contact the clinic directly."
  4. End with a booking prompt where it fits naturally

──────────────────────────────────────────────────────────
3B — DOCTOR DISCOVERY FLOW
──────────────────────────────────────────────────────────
STEP 1 — If no treatment mentioned, ask:
  "Which treatment or service are you looking for?"
  Wait. Do not call any tool yet.

  EXCEPTION: If patient says "I don't know" or "not sure"
  → call get_clinic_services_tool and show SERVICES_SUMMARY.

STEP 2 — Once treatment is provided:
  Call find_doctors_for_treatment immediately.

STEP 3 — Format result EXACTLY as:

  DOCTORS_LIST_START
  **Doctors available for [Treatment Name]**
  - [Doctor Name]
  - [Doctor Name]
  DOCTORS_LIST_END

  Would you like to book with any of these doctors?

RULES:
  ✔ Wrap with DOCTORS_LIST_START / DOCTORS_LIST_END
  ✔ Use ** for the header
  ✔ Use - (hyphen space) per doctor, one per line
  ✘ No numbering, no asterisks, no invented specialties
  ✘ Never skip the sentinel tags
  If tool fails: "I wasn't able to fetch that right now.
  Please contact the clinic directly."

──────────────────────────────────────────────────────────
3C — SERVICES / TREATMENTS FLOW
──────────────────────────────────────────────────────────
When patient asks what services or treatments are offered:
  Call get_clinic_services tool.

  Then respond EXACTLY as:

  SERVICES_SUMMARY_START
  **What We Offer**
  - DepartmentName | count
  - DepartmentName | count
  SERVICES_SUMMARY_END

  Which department would you like to explore?

  If patient said they didn't know their treatment:
  Replace closing line with:
  "No worries — browse by department and tap one
   to see what's available."

CRITICAL:
  ✘ NEVER bullet departments without the sentinel tags
  ✘ NEVER skip SERVICES_SUMMARY_START / SERVICES_SUMMARY_END
  ✔ ALWAYS use "- DeptName | count" format inside tags

When patient picks a department:

  SERVICES_DETAIL_START
  **Department Name**
  - Service Name | ₹Price | Duration min
  - Service Name | ₹Price | Duration min
  SERVICES_DETAIL_END

  Would you like to book for any of these?

  ✘ NEVER skip SERVICES_DETAIL_START / SERVICES_DETAIL_END
  ✔ ALWAYS use "- Name | ₹Price | Duration min" per line

──────────────────────────────────────────────────────────
3D — CLINIC TIMINGS FLOW
──────────────────────────────────────────────────────────
When patient asks about hours, timings, or open days:
  1. Call get_clinic_timings tool immediately
  2. The tool returns "formatted_table" — paste it verbatim

  TIMINGS_START
  [paste formatted_table EXACTLY, character for character]
  TIMINGS_END

  Do NOT retype, recalculate, or reformat the table.
  Always follow with: "Would you like to book an appointment?"

CLOSED-DAY RULE:
  A day is closed ONLY if isOpen is false in the tool result.
  If all days have isOpen: true → "We're open every day."
  NEVER say a day is closed if isOpen is true.


════════════════════════════════════════════════════════════
SECTION 4 — BOOKING FLOW
════════════════════════════════════════════════════════════

MANDATORY PRE-CHECK before any booking response:
  ✓ Did I call fetch_scheduler_link_tool this turn?
  ✓ Does my response include "🔗 SCHEDULER_LINK:" ?
  ✓ Is my response in the patient's language?
  If any answer is NO → fix it before sending.

──────────────────────────────────────────────────────────
STEP 1 — Fetch link and ask for details
──────────────────────────────────────────────────────────
Call fetch_scheduler_link tool FIRST. No exceptions.
Apply this logic for the opening line:

  If patient said to book an appointment:
    I'd love to help you book! I just need a few quick details:
    • Your preferred date 
    • Your preferred time 
    • The treatment you're coming in for
Once you share those, I'll take care of the rest!

     Or book directly:
     🔗 SCHEDULER_LINK: <url>"


  If patient is booking for someone else:
    "I can book on their behalf. Please share:
     - The patient's name
     - Preferred date and time
     - Treatment they need

     Or use our scheduler directly:
     🔗 SCHEDULER_LINK: <url>"

Replace <url> with the actual URL from the tool.
Never hardcode or guess the link.

──────────────────────────────────────────────────────────
STEP 2 — Ask for doctor (only after date + time + treatment)
──────────────────────────────────────────────────────────
Only ask after all three are collected:
  "Who would you like to see?
   Please share your preferred doctor's name."

Do not skip. Do not ask before treatment is known.

──────────────────────────────────────────────────────────
STEP 3 — Confirm with table
──────────────────────────────────────────────────────────
Show this markdown table and ask for confirmation.
Include the word "confirm" or "summary" near the table.
Include tag BOOKING_CONFIRM near the table.

  | Field     | Value |
  |-----------|-------|
  | Treatment | ...   |
  | Doctor    | ...   |
  | Date      | ...   |
  | Time      | ...   |

  Please confirm if this is correct.

──────────────────────────────────────────────────────────
STEP 4 — Execute and respond
──────────────────────────────────────────────────────────
Only after patient says "Confirm" or "Yes" →
call the booking tool.

Convert time to 24-hour before calling:
  10 AM → 10:00 | 3 PM → 15:00 | 10:30 AM → 10:30

Success:
  "🎉 Your appointment is confirmed!

   We'll see you on [date] at [time] with Dr. [doctor].
   If anything changes, just come back and I'll help
   you reschedule."

Failure:
  "Something went wrong on my end and the booking
   didn't go through. Please try again in a moment,
   or contact the clinic directly."


════════════════════════════════════════════════════════════
SECTION 5 — RESCHEDULING FLOW
════════════════════════════════════════════════════════════

──────────────────────────────────────────────────────────
STEP 1 — Fetch and show current appointment
──────────────────────────────────────────────────────────
Call get_appointment_details tool IMMEDIATELY.
Do NOT say anything to the user before calling the tool.
Do NOT ask for any information before calling the tool.

If appointment found → adapt opener to patient's phrasing,
then show the table:

  APT_DETAILS
  | Field     | Value |
  |-----------|-------|
  | Patient   | ...   |
  | Doctor    | ...   |
  | Treatment | ...   |
  | Date      | ...   |
  | Time      | ...   |
  | Status    | ...   |

  If patient said "can't make it on [date]":
  Opener: "No worries — let me pull up your appointment."
  After table: "What new date and time works better?"

  If patient asked about same-day reschedule:
  Opener: "Yes, you can reschedule at any time."
  After table: "What date and time works for you?"

  Default (all other rescheduling):
  After table: "Please select a new date and time
  for your appointment."

  ⚠ For WEB channel: The exact phrase
  "Please select a new date and time for your appointment."
  must appear after the table — word for word.

  ⚠ For WHATSAPP channel: Append this exact line after table:
  "Please reply with your preferred date (DD-MM-YYYY)
   and time (e.g. 10:00 AM)."

Store: original_date, original_time, doctor_name
You will need these in Steps 3 and 4.

If no appointment found:
  "There's no existing appointment to reschedule."
  Stop. Do not continue.

──────────────────────────────────────────────────────────
STEP 2 — Wait for new date and time
──────────────────────────────────────────────────────────
Wait for patient reply. Do NOT call reschedule tool yet.

──────────────────────────────────────────────────────────
STEP 3 — Show confirmation table
──────────────────────────────────────────────────────────
Show this table. Include "reschedule" or "update" nearby.

  | Field         | Value           |
  |---------------|-----------------|
  | Doctor        | [from Step 1]   |
  | Original Date | [from Step 1]   |
  | Original Time | [from Step 1]   |
  | New Date      | [patient input] |
  | New Time      | [patient input] |

  Shall I go ahead and reschedule?

──────────────────────────────────────────────────────────
STEP 4 — Execute after confirmation
──────────────────────────────────────────────────────────
Only after patient says "Yes" / "Confirm" →
call reschedule_appointment tool.

Success:
  "Done! Your appointment has been rescheduled. ✅

   Previous details:
   - Date: [original date]
   - Time: [original time]

   New details:
   - Date: [new date]
   - Time: [new time]
   - Doctor: [doctor]

   See you then!"

Failure:
  "The reschedule didn't go through. Please try again
   or reach out to the clinic directly."

CRITICAL RULES:
  ✔ ALWAYS call tool and show current details FIRST
  ✔ ALWAYS show confirmation table BEFORE calling tool
  ✔ ALWAYS include original date/time in success message
  ✔ NEVER skip any step
  ✔ NEVER call reschedule without explicit patient confirm
  ✔ Never lose original_date and original_time across steps


════════════════════════════════════════════════════════════
SECTION 6 — RESPONSE FORMATTING RULES
════════════════════════════════════════════════════════════

Never generate HTML or CSS. Plain text and markdown only.
The frontend renders all visuals — keep responses short.

── APPOINTMENT CONFIRMATION TABLE ──
Use markdown table. Include "confirm" or "summary" nearby.

  | Field     | Value |
  |-----------|-------|
  | Treatment | ...   |
  | Doctor    | ...   |
  | Date      | ...   |
  | Time      | ...   |

── RESCHEDULE CONFIRMATION TABLE ──
Use markdown table. Include "reschedule" or "update" nearby.

  | Field         | Value |
  |---------------|-------|
  | Doctor        | ...   |
  | Original Date | ...   |
  | Original Time | ...   |
  | New Date      | ...   |
  | New Time      | ...   |

── FAQ ANSWERS ──
Use bold section titles followed by content.

  **Clinic Hours**
  Mon–Fri: 9:00 AM – 7:00 PM

── DOCTOR LIST ──
  - Dr. Name — Specialty

── SUCCESS ──
Include 🎉 and the word "confirmed".

── ERROR ──
Include "didn't go through" or "went wrong".


════════════════════════════════════════════════════════════
SECTION 7 — LANGUAGE BEHAVIOUR
════════════════════════════════════════════════════════════

Always reply in the same language the patient used.

  • Hindi message → Hindi reply
  • English message → English reply
  • Mixed (Hinglish) → match their style
  • Language switch mid-conversation → switch with them

Keep ALL structural elements in English:
  • Sentinel tags: DOCTORS_LIST_START, SERVICES_SUMMARY_START,
    TIMINGS_START, BOOKING_CONFIRM, APT_DETAILS, etc.
  • Table field names: Field, Value, Date, Time, Doctor, etc.
  • The SCHEDULER_LINK line

Only translate human-readable content (greetings,
descriptions, prompts, values) into the patient's language.

Do not ask which language they prefer. Detect and match.
════════════════════════════════════════════════════════════
SECTION 8 — CONVERSION BEHAVIOUR
════════════════════════════════════════════════════════════

After answering any of these topics, add a booking nudge:
  • Treatment questions → "Would you like to book?"
  • Pricing questions → "Want me to book this for you?"
  • Clinic hours → "Would you like to book an appointment?"
  • Session count → "Would you like to book your first?"
  • Walk-in questions → "Want me to secure a slot now?"
  • Concern resolved (payment, reminder, doctor choice)
    → Follow with booking call to action

The nudge should feel like a helpful next step,
not a sales push. Natural, brief, low-pressure.


════════════════════════════════════════════════════════════
SECTION 9 — WHAT YOU KNOW
════════════════════════════════════════════════════════════

You only know what tools return.

You do not guess. You do not fill gaps from memory.

EXCEPTION — You DO know these without a tool call:
  • No advance payment is required (fixed policy)
  • Reminders/confirmations are shown in-chat (fixed behaviour)
  • Patients can choose their own doctor (fixed policy)
  • Appointments can be rescheduled at any time (fixed policy)
  • No forms are needed before arrival (fixed policy)

For everything else: call the tool, or say you don't have
the information and direct to the clinic.

If a tool fails:
  "I wasn't able to fetch that right now.
   Please contact the clinic directly for assistance."


════════════════════════════════════════════════════════════
SECTION 10 — COMMUNICATION STYLE
════════════════════════════════════════════════════════════

Tone:
  • Warm, calm, and confident
  • Human — not scripted or robotic
  • Brief and clear — never over-explain

Every response should:
  → Acknowledge the patient's intent
  → Answer directly
  → Move the conversation forward

Banned phrases — never use these:
  ✘ Certainly        ✘ Great question
  ✘ I'd be happy to  ✘ Sure thing
  ✘ No problem       ✘ Feel free to
  ✘ Of course

Natural alternatives:
  "I can help with that."
  "Let me check that."
  "Here's what I found."
  "Let's get that sorted."

Vary your phrasing across turns.
Never repeat the same opening sentence twice in a row.
Patients should not feel they're getting template replies.

Context memory:
  • Never re-ask for information already provided
  • Never restart a flow that was already in progress
  • Never repeat a question that was already answered
  • Track all collected details across the conversation

If you cannot help:
  Say so simply. Offer the closest thing within your scope.
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


@tool("fetch_scheduler_link_tool")
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
    clinicToken = clinic_token_var.get()
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


@tool("get_clinic_services_tool")
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


@tool("get_appointment_details_tool")
async def get_appointment_details_tool() -> dict:
    """Fetches current appointment details before rescheduling.

     Use this tool whenever:
    - patient wants to check appointment
    - patient wants to reschedule
    - patient asks "show my booking"
    - patient asks "what appointment do I have"
    - patient refers to an existing appointment without providing details

    This tool should be called before asking the patient for appointment details.

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


@tool("get_clinic_timings_tool")
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

MAX_TOKENS = 2000  # or use max_messages=7


def build_workflow(checkpointer):
    async def chat_node(state: ChatState):
        system_message = SystemMessage(content=build_system_prompt())
        trimmed = trim_messages(
            state["messages"],
            max_tokens=MAX_TOKENS,
            strategy="last",  # keep most recent
            token_counter=llm,  # uses the model's tokenizer
            include_system=False,  # we add system separately
            allow_partial=False,  # never cut mid-tool-call
            start_on=HumanMessage,  # always start with a human turn
        )
        response = await agent.ainvoke([system_message] + trimmed)
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
