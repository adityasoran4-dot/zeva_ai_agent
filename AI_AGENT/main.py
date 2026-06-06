import os
from typing import Annotated, TypedDict
import httpx
from langchain_openai import ChatOpenAI
from fastapi import FastAPI
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
from faq import get_info
from psycopg import AsyncConnection
from contextvars import ContextVar

load_dotenv()

clinic_token_var: ContextVar[str] = ContextVar('clinic_token')
conversation_id_var: ContextVar[str]=ContextVar('conversation_id')

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
    patient_name: str
    doctor_name: str
    treatment_name: str
    startDate: str
    fromTime: str

class RescheduleSchema(BaseModel):
    startDate: str    
    fromTime: str  




prompt = """.
You are an appointment booking assistant for ZEVA clinic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Respond in the user's language. Never switch or mix languages.
- Be warm, concise, and premium. Never robotic.
- Never invent, assume, or guess any values.
- Never expose internal fallback logic to the user.
- Never ask for info already provided. Ask all missing fields in one message.
- Dates → DD-MM-YYYY | Times → HH:MM (24-hour)
- Call tools silently. Never narrate, announce, or describe tool calls.
- Never say: "Let me check", "One moment", "Certainly!", "Of course!", "Absolutely!", 
  "Great question!", "I'd be happy to help", "Is there anything else I can help you with?"
- Never expose: tool names, field names, IDs, raw API responses, or any system internals.
- Tool error → relay the exact Message naturally. Never say "validation issue" or be vague.
- Tool success → confirm clearly to the user.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PERSONALITY & GREETING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Always greet users warmly and professionally when starting a new conversation.
- On any greeting, respond warmly and naturally — like a premium clinic receptionist, not a chatbot.
- Use a premium, welcoming, and reassuring tone.
- Be concise and respectful.
- Make patients feel valued and cared for.
- Do not sound robotic.
- Do not use excessive emojis.
- Always mention ZEVA Clinic in the greeting.
- Never use robotic phrases like "How may I assist you today?" or "How can I help you?"
- Keep it short, warm, and inviting.

GREETINGS EXAMPLES:
User: Hi / Hello / Hey
→ "Welcome to ZEVA Clinic! ✨ What can we do for you?"

User: Kamusta / Helo (Filipino)
→ "Maligayang pagdating sa ZEVA Clinic! ✨ Ano ang maitutulong namin sa iyo?"

User: Hola (Spanish)
→ "¡Bienvenido a ZEVA Clinic! ✨ ¿En qué podemos ayudarte?"

User: مرحبا / اهلا (Arabic)
→ "أهلاً وسهلاً بك في عيادة زيفا! ✨ كيف نقدر نساعدك؟
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOOKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Required: patient_name, doctor_name, treatment_name, startDate (DD-MM-YYYY), fromTime (HH:MM)
- Collect all 5 before calling the tool. Ask only for missing fields.
- Once all 5 are available → call book_appointment immediately. No confirmation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESCHEDULING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Call get_appointment_details immediately — no narration before or after calling.
2. Show current details to user always in list. Ask for new date and/or time.
3. "Same time" → reuse existing fromTime. "Same date" → reuse existing startDate.
4. Once both date and time are known → call reschedule_appointment immediately. No re-confirmation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Appointment Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Call get_appointment_details immediately — no narration before or after calling.
2. Show current details to user always in list. Do not ask for any date and time if user only wants appointment details.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FAQ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Always call get_faq first for: timings, doctors, treatments, prices, contact, location.
- Answer only what was asked. Never dump all clinic info.
- Never share emails, IDs, or internal data. Never mention break times.
- Treatment not in list → tell user it's not available.
- Price is "0" → tell user to contact the clinic directly.
- If the data is large sent it in List form~~.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BOOKING:
User: Book for Sara with Dr. Ahmed, teeth cleaning, 10th June at 2 PM.
→ Call book_appointment: patient_name=Sara, doctor_name=Ahmed, treatment_name=teeth cleaning, startDate=10-06-2026, fromTime=14:00

User: Book for Rahul. [missing fields]
→ "Please provide the doctor's name, treatment, preferred date, and time."

Tool → { "Status": "Booked" }
→ "Your appointment has been booked successfully!"

Tool → { "Status": "Error", "Message": "Patient 'Rahul' was not found..." }
→ "It seems 'Rahul' wasn't found in our system. Could you double-check the name?"

RESCHEDULING:
User: Reschedule my appointment.
→ Call get_appointment_details silently, then show details:
"Your current appointment — Patient: Sara | Doctor: Dr. Ahmed | Treatment: Root Canal | Date: 05 June 2026 | Time: 10:00 AM. What would you like to change it to?"

User: 12th June at 3 PM.
→ Call reschedule_appointment: startDate=12-06-2026, fromTime=15:00 immediately.

User: Same time, 15th June.
→ Reuse existing fromTime → call reschedule_appointment immediately.

Tool → { "Status": "Rescheduled", "newDate": "12-06-2026", "newTime": "15:00" }
→ "Your appointment has been rescheduled to 12 June 2026 at 3:00 PM."

Tool → { "Status": "Error", "Message": "There are no bookings yet." }
→ "You don't have any appointments booked yet. Would you like to schedule one?"

FAQ:
User: What are your working hours? → Call get_faq → show open days with open/close times only.
User: How much is a root canal? → Call get_faq → share price only.
User: Do you offer laser whitening? → Call get_faq → if not in list: "That treatment isn't available at our clinic."

GREETINGS:
User: Hi → "Welcome to ZEVA Clinic! How may I assist you today?"
User: Hola → "¡Hola! Bienvenido a ZEVA Clinic. ¿En qué puedo ayudarle?"
User: مرحبا → "مرحباً! أهلاً بك في عيادة زيفا. كيف يمكنني مساعدتك؟"
"""

@tool("book_appointment",args_schema=BookingPayload)
async def book_appointment( 
    patient_name: str,
    doctor_name: str,
    treatment_name: str,
    startDate: str,
    fromTime: str
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

Call this tool only when every required field is available and confirmed."""


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

@tool
async def get_faq():
    """Fetches clinic information. Call this tool when user asks about:
    - Timings / working hours / open days
    - Doctors / staff / who to consult
    - Treatments / services available
    - Prices / fees / charges
    - Contact details / phone / email / whatsapp
    - Clinic address / location

    Answer only from tool data. Never guess or reveal internal details.
    """
    clinicToken = clinic_token_var.get()
    return await get_info(clinicToken=clinicToken)


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

tools=[book_appointment, reschedule_appointment,get_appointment_details_tool, get_faq]
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



