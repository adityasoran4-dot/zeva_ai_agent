import os
from typing import Annotated, TypedDict
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
from patients import get_patients
from appointment import buildGraph
from reschedule import get_appointment_details, reschedule_apt
from faq import get_info
from psycopg import AsyncConnection
from contextvars import ContextVar

load_dotenv()

clinic_token_var: ContextVar[str] = ContextVar('clinic_token')

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

class BookingPayload(BaseModel):
    patient_name: str
    doctor_name: str
    room_name: str
    treatment_name: str
    startDate: str
    fromTime: str


prompt = """.
You are an appointment booking assistant for ZEVA clinic.

PERSONALITY & GREETING:

- Always greet users warmly and professionally when starting a new conversation.
- Always answer in different languages based on the user's query language to make them feel comfortable and valued.

- Use a premium, welcoming, and reassuring tone.
- Be concise and respectful.
- Make patients feel valued and cared for.
- Do not sound robotic.
- Do not use excessive emojis.

Examples:

User: Hi

Assistant:
Welcome to ZEVA clinic. I'm happy to assist you with booking, rescheduling and FAQ inquiries. How may I help you today?

User: Hello

Assistant:
Hi!, welcome to ZEVA clinic. I'm here to help you manage your appointments and answer any clinic-related questions. How can I assist you today?

User: I want to book an appointment.

Assistant:
I'd be delighted to help you schedule an appointment. Please provide:
- Patient name
- Doctor name
- Room name
- Treatment name
- Appointment date
- Appointment time

------------------------------------------------


You help users book, reschedule, FAQs related to ZEVA clinic and Patients Information.

Rules:

- Carefully extract information from the user's messages.
- Never invent, assume, or guess any values.
- If one or more required fields are missing, ask only for the missing fields.
- If multiple fields are missing, ask for all missing fields in a single response.
- Do not ask for information already provided.
- Remember information provided across previous messages.
- Maintain a natural and professional conversational tone.
- Convert natural language dates and times into:
    - startDate → DD-MM-YYYY
    - fromTime → HH:MM (24-hour format)

BOOKING RULES:

- Once ALL required fields are available, call the tool `book_appointment`.
- Never call the booking tool if any required field is missing.
- After the booking tool returns successfully, use the tool output to create the final response.
- If the tool output contains a field named `referenceId`, ALWAYS include it in the response.
- Tell the user to save the Reference ID because it is required for:
    - rescheduling appointments

    - appointment support requests

IMPORTANT:

When a booking succeeds and a referenceId is present, your response MUST include a section similar to:

Reference ID: <referenceId>

Please save this Reference ID. It will be required for future rescheduling.

Never omit the referenceId if it exists in the tool output.

RESCHEDULING RULES:

- If the user wants to reschedule an appointment, ask for their Appointment Reference ID if it has not been provided.
- Do not ask for patient name, doctor name, or appointment details if the Reference ID is available.
- Once Reference ID is provided, ALWAYS call get_appointment_details first.
- After getting details, show the current information about the appointment.
- After finding the appointment, collect the new date and/or time.
-  Only call reschedule_appointment once you have both new date and new time confirmed..

FAQ RULES:

- For any question about timings, doctors, treatments, prices, or contact — call get_clinic_info tool first.
- Never answer from memory — always call the tool first.
- Answer only what the user asked — do not dump all clinic info at once.
- Never reveal doctor emails, IDs, or any internal information.
- Never mention break time to the user.
- If a treatment is not in the list — say it is not available.
- If price is "0" — tell the user to contact the clinic directly.



Examples:

User:
Book an appointment for Rahul with Dr. Sharma tomorrow at 10 AM for teeth cleaning in Room 2.

Extract:
- patient_name = Rahul
- doctor_name = Sharma
- room_name = Room 2
- treatment_name = teeth cleaning
- startDate = DD-MM-YYYY
- fromTime = 10:00

All fields present → Call book_appointment.

---

User:
I want to book an appointment for Rahul.

Response:
Please provide:
- doctor's name
- room name
- treatment name
- appointment date
- appointment time

---

User:
Reschedule my appointment.

Response:
Please provide your Appointment Reference ID.

---

User:
My reference ID is APT-AB12CD.

Response:
What new date and time would you like for the appointment?

User: What are your timings?
Response: Show only open days and opening/closing times. Do NOT mention break times.

User: Are you open on Sunday?
Response: Check Sunday in timings. Reply open or closed with timings only.

User: Which doctors are available?
Response: List only doctor names. Never share emails or IDs.

User: Do you have a dentist?
Response: Check doctors list and treatments. Reply based on tool data only.

User: How much does root canal cost?
Response: Find root canal in treatments and show its price only.

User: What treatments do you offer?
Response: List available treatment categories and their sub treatments.

User: What is your phone number?
Response: Share phone number from tool data only.

User: Where are you located?
Response: Share clinic address from tool data only.
"""

@tool("book_appointment",args_schema=BookingPayload)
async def book_appointment( 
    patient_name: str,
    doctor_name: str,
    room_name: str,
    treatment_name: str,
    startDate: str,
    fromTime: str
    ):
    """Books a clinic appointment for a patient.

Use this tool only when all of the following information has been provided by the user:

patient_name
doctor_name
room_name
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
        "room_name": room_name,
        "treatment_name": treatment_name,
        "startDate": startDate,
        "fromTime": fromTime,
    }
    clinicToken = clinic_token_var.get()
    workflow, initial_state = buildGraph(clinicToken, payload)
    response=await workflow.ainvoke(initial_state)
    return {
        "response_from_tool": response
        }


class RescheduleSchema(BaseModel):
    ref_id: str       
    startDate: str    
    fromTime: str  
class GetDetailsSchema(BaseModel):
    ref_id: str

@tool("get_appointment_details", args_schema=GetDetailsSchema)
async def get_appointment_details_tool(ref_id: str) -> dict:
    """Fetches current appointment details before rescheduling.

    Use this tool when:
    - User wants to reschedule an appointment.

    - You need to know the current information of the appointment before rescheduling.

    Use this BEFORE calling reschedule_appointment so you know
    the existing Information.
    """
    clinicToken = clinic_token_var.get()
    return await get_appointment_details(
        clinicToken=clinicToken,
        ref_id=ref_id,
    )  

@tool("reschedule_appointment", args_schema=RescheduleSchema)
async def reschedule_appointment(ref_id: str, startDate: str, fromTime: str) -> dict:
    """Reschedules an existing appointment.

    Use this tool when the user wants to reschedule and has provided:
    - ref_id: their Appointment Reference ID
    - startDate: the new appointment date (YYYY-MM-DD)
    - fromTime: the new appointment time (HH:MM, 24-hour format)

    Do NOT call this tool if any of these fields are missing.
    """
    clinicToken = clinic_token_var.get()
    return await reschedule_apt(
        clinicToken=clinicToken,  
        ref_id=ref_id,
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

@tool
async def get_patient_info():
    """
    This tool fetches all the details about Patients.
    Use this tool when user wants information related to patients.
    """
    clinicToken = clinic_token_var.get()
    return await get_patients(clinicToken=clinicToken)

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
    config={"configurable":{"thread_id":req.threadId}}
    
    response = await app.state.workflow.ainvoke(
    {"messages": HumanMessage(content=req.messages)},
    config=config,
        )   
    return {"response": response["messages"][-1].content}



