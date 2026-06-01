from asyncio import streams
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
from langgraph.prebuilt import tool_node, tools_condition
from langchain_classic.tools import tool
import sqlite3


class AppointmentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    clinicToken: str
    rooms: list  # fetched from /rooms
    doctors: list  # fetched from /doctors
    treatments: list  # fetched from /services
    patients: list
    # data collected from user conversation
    selectedRoomId: str
    selectedDoctorId: str
    selectedTreatment: str
    patientId: str
    patientName: str
    followType: str
    startDate: str
    fromTime: str
    toTime: str
   

class Token(BaseModel):
    clinicToken:str

def build_graph():
    graph=StateGraph(AppointmentState)
    graph.add_node("check_patient",check_patient)
    graph.add_node("check_doctor",check_doctor)
    graph.add_node("check_room",check_room)
    graph.add_node("check_treatments",check_treatments)
    graph.add_node("confirm_time",confirm_time)
    graph.add_node("book_appointment",book_appointment)



def book_appointment():
