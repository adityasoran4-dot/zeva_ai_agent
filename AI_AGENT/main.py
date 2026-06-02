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
    AIMessageChunk,
    AIMessage,
    ToolMessage,
    SystemMessage,
)
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.prebuilt import ToolNode,tools_condition
from langchain_classic.tools import tool
import sqlite3
from reference_id import ref_to_appointment_id
from appointment import buildGraph
from reschedule import reschedule_apt
load_dotenv()


llm=ChatOpenAI(model="gpt-4o-mini")
app=FastAPI()
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


clinicToken=None
threadId=None

prompt = """
You are an appointment booking assistant for a medical clinic.

You help users book, reschedule, and cancel appointments.

For booking an appointment, collect the following required information:

1. patient_name
2. doctor_name
3. room_name
4. treatment_name
5. startDate (DD-MM-YYYY)
6. fromTime (HH:MM, 12-hour format)

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
    - cancelling appointments
    - appointment support requests

IMPORTANT:

When a booking succeeds and a referenceId is present, your response MUST include a section similar to:

Reference ID: <referenceId>

Please save this Reference ID. It will be required for future rescheduling or cancellation requests.

Never omit the referenceId if it exists in the tool output.

RESCHEDULING RULES:

- If the user wants to reschedule an appointment, ask for their Appointment Reference ID if it has not been provided.
- Do not ask for patient name, doctor name, or appointment details if the Reference ID is available.
- Use the Reference ID to locate the appointment.
- After finding the appointment, collect the new date and/or time.
- Call the rescheduling tool once sufficient information is available.

CANCELLATION RULES:

- If the user wants to cancel an appointment, ask for their Appointment Reference ID if it has not been provided.
- Use the Reference ID to identify the appointment.
- Call the cancellation tool after confirmation.

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
"""

@tool("book_appointment",args_schema=BookingPayload)
def book_appointment( 
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
    workflow, initial_state = buildGraph(clinicToken, payload)
    response=workflow.invoke(initial_state)
    return {
        "response_from_tool": response
        }

# In main.py — replace the reschedule tool

class RescheduleSchema(BaseModel):
    ref_id: str       
    startDate: str    
    fromTime: str    

@tool("reschedule_appointment", args_schema=RescheduleSchema)
def reschedule_appointment(ref_id: str, startDate: str, fromTime: str) -> dict:
    """Reschedules an existing appointment.

    Use this tool when the user wants to reschedule and has provided:
    - ref_id: their Appointment Reference ID
    - startDate: the new appointment date (YYYY-MM-DD)
    - fromTime: the new appointment time (HH:MM, 24-hour format)

    Do NOT call this tool if any of these fields are missing.
    """
    return reschedule_apt(
        clinicToken=clinicToken,  
        ref_id=ref_id,
        startDate=startDate,
        fromTime=fromTime,
    )

tools=[book_appointment, reschedule_appointment]
agent=llm.bind_tools(tools)


conn = sqlite3.connect("chatbot.db", check_same_thread=False)
checkpointer=SqliteSaver(conn=conn)
graph=StateGraph(ChatState)

def chat_node(state: ChatState):
    messages = state["messages"]

    system_message = SystemMessage(content=prompt)
    message_with_system = [system_message] + messages
    response = agent.invoke(
        message_with_system
    )

    return {
        "messages": [response]
    }

tool_node=ToolNode(tools)

graph.add_node("chat",chat_node)
graph.add_node("tools",tool_node)
graph.add_edge(START,"chat")
graph.add_conditional_edges("chat", tools_condition)
graph.add_edge("tools", "chat")


workflow=graph.compile(checkpointer=checkpointer)


@app.post("/chat")
def chat(req:ChatRequest):
    global clinicToken,threadId
    clinicToken=req.clinicToken
    threadId=req.threadId
    config={"configurable":{"thread_id":req.threadId}}
    
    response = workflow.invoke(
    {"messages": HumanMessage(content=req.messages)},
    config=config,
        )   
    return {"response": response["messages"][-1].content}



