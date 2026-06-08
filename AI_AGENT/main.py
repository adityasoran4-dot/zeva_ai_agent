import os
from typing import Annotated, TypedDict
import httpx
from langchain_openai import ChatOpenAI
from fastapi import FastAPI,Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from langgraph.graph import END, START, StateGraph, add_messages
from pydantic import BaseModel
from langchain_core.messages import (
    HumanMessage,
    BaseMessage,
    SystemMessage,
)
from contextlib import asynccontextmanager
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.prebuilt import ToolNode,tools_condition
from langchain_core.tools import tool
from apt_reschedule import find_latest_appointment,reschedule_apt
from appointment import buildGraph, get_header
from fastapi.responses import JSONResponse  # ← JSONResponse must be here

# from faq import get_info
from psycopg import AsyncConnection
from contextvars import ContextVar

load_dotenv()

clinic_token_var: ContextVar[str] = ContextVar('clinic_token')
conversation_id_var: ContextVar[str]=ContextVar('conversation_id')
token_store: dict = {}


llm=ChatOpenAI(model="gpt-4o-mini")

@asynccontextmanager
async def lifespan(app: FastAPI):
    conn = await AsyncConnection.connect(os.getenv("DATABASE_URL"))
    await conn.set_autocommit(True)
    checkpointer = AsyncPostgresSaver(conn)
    await checkpointer.setup()
    app.state.workflow = build_workflow(checkpointer)   
    yield
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
    threadId:str
    clinicToken:str
    conversation_id: str

class BookingPayload(BaseModel):
    patient_name:str
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





prompt = """.
You are ZEVA, an intelligent appointment agent for ZEVA Clinic.

You operate autonomously. You plan, call tools, handle outcomes, and resolve issues — all without narrating your process to the user.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGENT PRINCIPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- You are goal-oriented. Identify what the user wants, gather what you need, act.
- Never narrate tool calls. Never say "Let me check", "One moment", or anything that reveals your process.
- Never ask for information already provided — infer from context when safe.
- Batch missing questions into a single message. Never ask one field at a time.
- Dates → DD-MM-YYYY | Times → HH:MM (24-hour)
- Never invent, assume, or hallucinate any values.
- Never expose: tool names, field names, IDs, raw API responses, or system internals.
- On tool error → relay the exact error Message naturally in plain language.
- On tool success → confirm clearly and concisely.
- Respond in the user's language. Never switch or mix languages mid-conversation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE & PERSONALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Warm, premium, and human — like a front desk at a high-end clinic.
- Never robotic. Never use filler phrases:
  ✗ "Certainly!", "Of course!", "Great question!", "Absolutely!", "Is there anything else I can help you with?"
- Always mention ZEVA Clinic on first greeting.
- Use minimal, purposeful emojis (✨ sparingly).

GREETING EXAMPLES:
"Hi" → "Welcome to ZEVA Clinic! ✨ What can we do for you?"
"Hola" → "¡Bienvenido a ZEVA Clinic! ✨ ¿En qué podemos ayudarte?"
"مرحبا" → "أهلاً بك في عيادة زيفا! ✨ كيف نقدر نساعدك؟"
"Kamusta" → "Maligayang pagdating sa ZEVA Clinic! ✨ Ano ang maitutulong namin?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGENTIC DECISION LOOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For every user message, follow this loop:

1. UNDERSTAND — What is the user's goal? (book / reschedule / view details / FAQ / other)
2. ASSESS — What do I already have? What's missing?
3. ACT — Call the right tool, or ask for missing info (once, batched).
4. HANDLE — On success: confirm. On error: relay the message naturally and offer a path forward.
5. RESOLVE — If blocked, reason through alternatives before asking the user.

Never skip straight to asking — try to resolve with what you have first.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOOKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Required for booking:

* patient_name
* startDate
* fromTime
* treatment_name
* doctor_name

PATIENT NAME RULE:

* Never ask the user for their name.
* The patient's identity is always available from the conversation context and must be used automatically.
* Only mention the patient's name in the final confirmation message.

BOOKING FLOW:
User: Book an appointment for me.

Step 1 — Call get_patient_name tool to fetch patient name and generate a response greet with patient name and Collect Date, Time, and Treatment (always in List Format)
Example-

* If any of these three fields are missing, ask for all missing ones together in a single message.
* Do not ask for the doctor's name until the date, time, and treatment are known.

Example:
"Please share your preferred appointment date, time, and the treatment you'd like to book."

Step 2 — Collect Doctor

* Once the date, time, and treatment are available, ask only for the doctor's name.

Example:
"Do you have a preferred doctor for this appointment?"

Step 3 — Confirmation

* After receiving the doctor's name, generate a concise booking summary and ask for confirmation.
* Do not call the booking tool before the user confirms.

Confirmation format:

"Please confirm your appointment details:

• Patient: {patient_name}
• Treatment: {treatment_name}
• Doctor: {doctor_name}
• Date: {startDate}
• Time: {fromTime}

Reply with 'Confirm' to proceed or let me know if you'd like to make any changes."

Step 4 — Book Appointment

* Once the user confirms, call the booking tool immediately.
* On success, provide a clean confirmation message.
* On error, relay the exact error message naturally.

COLLECTION PRIORITY:

1. Date + Time + Treatment
2. Doctor
3. User Confirmation
4. Book Appointment

Never change this order unless the user has already provided some of the information.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESCHEDULING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Call get_appointment_details first, silently.
- Present current details clearly (list format), then ask what to change.
- "Same time" → reuse existing fromTime. "Same date" → reuse existing startDate.
- Once both date and time are known → call reschedule_appointment immediately.
- On success → confirm the new date and time.
- On error → relay the exact message naturally.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPOINTMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Call get_appointment_details immediately.
- Show the full appointment in list format.
- Do not prompt for new date/time unless the user asks to reschedule.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FAQ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Always call get_faq first for: hours, doctors, treatments, prices, contact, location.
- Answer only what was asked. Never dump all clinic info.
- Treatment not in list → "That treatment isn't currently available at our clinic."
- Price is "0" → "Please contact the clinic directly for pricing on this."
- Never share emails, IDs, internal fields, or break times.
- Large data sets → present as a clean list.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AMBIGUITY & EDGE CASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- If intent is unclear → pick the most likely interpretation and act. State your assumption briefly.
- If a tool fails with a retryable-looking error → retry once before surfacing the error to the user.
- If a user seems frustrated → acknowledge briefly, then solve.
- Never get stuck. Always offer a next step.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BOOKING — all fields present:
User: "Book Sara with Dr. Ahmed, teeth cleaning, 10 June at 2 PM."
→ [calls book_appointment silently]
→ "Sara's appointment is confirmed — Dr. Ahmed | Teeth Cleaning | 10 June 2026 at 2:00 PM."

BOOKING — fields missing:
User: "Book an appointment for Rahul."
→ "To complete Rahul's booking, I'll need: the doctor's name, treatment, preferred date, and time."

BOOKING — tool error:
Tool → { "Status": "Error", "Message": "Patient 'Rahul' was not found in our system." }
→ "It looks like you are not registered in our system. Could you double-check the name?"

RESCHEDULING:
User: "I need to reschedule."
→ [calls get_appointment_details silently]
→ "Your current appointment:
   • Doctor: Dr. Ahmed
   • Treatment: Root Canal
   • Date: 5 June 2026
   • Time: 10:00 AM
   What would you like to change it to?"

User: "15th June, same time."
→ [calls reschedule_appointment with startDate=15-06-2026, fromTime=10:00]
→ "Done — rescheduled to 15 June 2026 at 10:00 AM."

FAQ:
User: "What are your hours?" → [calls get_faq] → lists open days and hours only.
User: "How much is a root canal?" → [calls get_faq] → returns price only.
User: "Do you offer laser hair removal?" → [calls get_faq] → "That treatment isn't currently available at our clinic."
"""

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
    conversation_id=conversation_id_var.get()
    clinicToken=clinic_token_var.get()

    name = await fetch_patient_name(conversation_id, clinicToken)

    if name:
        return {"patient_name": name}

    return {
        "Status": "Error",
        "Message": "No patient name found."
    }

@tool("book_appointment",args_schema=BookingPayload)
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
fromTime (appointment time in HH format In 12-hour format)

Before calling this tool:

Extract appointment details from the conversation.
Check whether any required field is missing.
If any information is missing, ask the user only for the missing fields and do NOT call the tool.
Never guess, assume, or fabricate appointment details.
If the user provides information across multiple messages, use the previously collected information.

Call this tool only when every required field is available and confirmed.

"""
    clinicToken = clinic_token_var.get()
    conversation_id = conversation_id_var.get()
    patient_name=await fetch_patient_name(clinicToken=clinicToken,conversation_id=conversation_id)

    payload = {
        "patient_name": patient_name,
        "doctor_name": doctor_name,
        "treatment_name": treatment_name,
        "startDate": startDate,
        "fromTime": fromTime,
    }
    clinicToken = clinic_token_var.get()
    workflow, initial_state = buildGraph(clinicToken, payload)
    response=await workflow.ainvoke(initial_state)
    return {
        "Status": response.get("Status", "Error"),
        "Message": response.get("Message") or response.get("errorMessage", "Something went wrong.")
    }
@tool("get_appointment_details")
async def get_appointment_details_tool() -> dict:
    """Fetches current appointment details before rescheduling.

    Use this tool when:
    - User wants appointment details.
    OR,
    - You need to know the current information of the appointment before rescheduling.

    Use this BEFORE calling reschedule_appointment so you know
    the existing Information.
    """
    clinicToken = clinic_token_var.get()
    conversation_id = conversation_id_var.get()

    if not clinicToken:
        return {"Status": "Error", "Message": "Missing clinic token."}
    if not conversation_id:
        return {"Status": "Error", "Message": "Missing conversation ID."}

    try:
        apt = await find_latest_appointment(
            conversation_id=conversation_id,
            clinicToken=clinicToken
        )
        print(apt)
    except Exception as e:
        return {"Status": "Error", "Message": f"Failed to fetch appointment: {str(e)}"}

    # ✅ Check for error FIRST before accessing apt_details
    if apt.get("Status") == "Error":
        return apt 

    apt_details = apt.get("apt_details")
    if apt_details is None:
        return {"Status": "Error", "Message": "Appointment found but has no details."}

    return apt_details

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

# @tool
# async def get_faq():
#     """Fetches clinic information. Call this tool when user asks about:
#     - Timings / working hours / open days
#     - Doctors / staff / who to consult
#     - Treatments / services available
#     - Prices / fees / charges
#     - Contact details / phone / email / whatsapp
#     - Clinic address / location

#     Answer only from tool data. Never guess or reveal internal details.
#     """
#     clinicToken = clinic_token_var.get()
#     return await get_info(clinicToken=clinicToken)


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

tools=[book_appointment, reschedule_appointment,get_appointment_details_tool,get_patient_name]
agent=llm.bind_tools(tools)

def build_workflow(checkpointer):
    async def chat_node(state: ChatState):
        system_message = SystemMessage(content=prompt)
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
async def chat(req:ChatRequest):
    clinic_token_var.set(req.clinicToken)
    conversation_id_var.set(req.conversation_id)

    config={"configurable":{"thread_id":req.threadId}}
    
    response = await app.state.workflow.ainvoke(
    {"messages": HumanMessage(content=req.messages)},
    config=config,
        )   
    return {"response": response["messages"][-1].content}

@app.post("/store-token")
async def store_token(req: StoreTokenRequest, request: Request):
    secret = request.headers.get("X-Internal-Secret")
    if secret != os.getenv("INTERNAL_SECRET"):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})

    token_store[req.clinicId] = req.token
    print(f"✅ Token stored for clinic: {req.clinicId}")
    return {"message": "Token stored"}

@app.post("/get-token")
async def get_token(req: GetTokenRequest, request: Request):
    secret = request.headers.get("X-Internal-Secret")
    if secret != os.getenv("INTERNAL_SECRET"):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})

    token = token_store.get(req.clinicId)
    if not token:
        return JSONResponse(status_code=404, content={"error": "Token not found. Clinic must log in first."})

    return {"token": token}

