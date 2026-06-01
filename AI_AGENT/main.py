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
from langgraph.prebuilt import tool_node,tools_condition
from langchain_classic.tools import tool
import sqlite3
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

class BookingPayload(BaseModel):
    patientId: str
    doctorId: str
    roomId: str
    status: str
    followType: str
    startDate: str
    fromTime: str
    toTime: str

@tool("book_appointment",args_schema=BookingPayload)
def book_appointment(patientId: str,doctorId: str,roomId: str,status: str,followType: str,startDate: str, fromTime: str,toTime: str ):
    print(f"Booking appointment for patient {patientId} with doctor {doctorId} in room {roomId} on {startDate} from {fromTime} to {toTime}. Status: {status}, Follow-up type: {followType}")
    return f"Appointment booked for patient {patientId} with doctor {doctorId} in room {roomId} on {startDate} from {fromTime} to {toTime}. Status: {status}, Follow-up type: {followType}"


conn = sqlite3.connect("chatbot.db", check_same_thread=False)
checkpointer=SqliteSaver(conn=conn)
graph=StateGraph(ChatState)

def chat_node(state:ChatState):
    messages=state['messages']
    response=llm.invoke(messages).content
    return {"messages":[AIMessage(content=response)]}

graph.add_node("chat",chat_node)
graph.add_edge(START,"chat")
graph.add_edge("chat",END)

workflow=graph.compile(checkpointer=checkpointer)




@app.post("/chat")
def chat(req:ChatRequest):
    config={"configurable":{"thread_id":req.threadId}}
    response = workflow.invoke(
    {"messages": HumanMessage(content=req.messages)},
    config=config,
        )   
    return {"response":response["messages"][-1].content}


