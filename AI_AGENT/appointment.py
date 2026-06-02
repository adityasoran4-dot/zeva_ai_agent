import os
from typing import Annotated, Literal, TypedDict
from annotated_types import T
import httpx
from langchain_openai import ChatOpenAI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from langgraph.graph import END, START, StateGraph, add_messages
from pydantic import BaseModel
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.prebuilt import tool_node, tools_condition
from langchain_classic.tools import tool
from datetime import datetime, timedelta
from dotenv import load_dotenv

from reference_id import appointment_id_to_ref
load_dotenv()

class AppointmentState(TypedDict):
    clinicToken: str
    patient_name: str
    doctor_name: str
    room_name: str
    treatment_name: str
    rooms: list
    doctors: list
    treatments: list
    patients: list
    patientExists: bool
    doctorExists: bool
    roomExists: bool
    treatmentExists: bool
    timeConfirmed: bool
    selectedRoomId: str
    selectedDoctorId: str
    selectedTreatment: str
    patientId: str
    Status:str
    referenceId: str
    appointmentId: str
    startDate: str
    fromTime: str
    toTime: str
    errorMessage: str

token=None
def get_header(token):
    return {"Authorization": f"Bearer {token}"}


def check_patient(state: AppointmentState):
    header= get_header(token)
    url=f"http://localhost:3000/api/clinic/search-patients?search={state['patient_name']}"
    search_patient=httpx.get(url,headers=header)
    data=search_patient.json()
    if data.get("success") and len(data.get("patients", [])) > 0:
        return {
            "patientExists": True,
            "patients": data["patients"],
            "patientId": data["patients"][0]["_id"],
        }
       
    else:
        return {
            "patientExists": False,
            "patients": [],
            "patientId": "",
        }

def check_doctor(state: AppointmentState):
    header = get_header(token)
    url = "http://localhost:3000/api/lead-ms/get-agents-options?role=doctorStaff"

    search_doctor = httpx.get(url, headers=header)
    data = search_doctor.json()

    doctor_name = state["doctor_name"].strip().lower()

    if data["success"] == True:
        doctor = next(
            (
                d for d in data["agents"]
                if d.get("name", "").strip().lower() == doctor_name
            ),
            None,
        )

        if doctor:
            return {
                "doctorExists": True,
                "doctors": data,
                "selectedDoctorId": doctor["_id"],
            }

    return {
        "doctorExists": False,
        "doctors": data,
        "selectedDoctorId": "",
    }

def check_room(state: AppointmentState):
    header = get_header(token)
    url = "http://localhost:3000/api/clinic/rooms"

    search_room = httpx.get(url, headers=header)
    data = search_room.json()

    room_name = state["room_name"].strip().lower()

    if data["success"] == True:
        room = next(
            (
                r for r in data["rooms"]
                if r.get("name", "").strip().lower() == room_name
            ),
            None,
        )

        if room:
            return {
                "roomExists": True,
                "rooms": data,
                "selectedRoomId": room["_id"],
            }

    return {
        "roomExists": False,
        "rooms": data,
        "selectedRoomId": "",
    }

def check_treatments(state: AppointmentState):
    header = get_header(token)
    url = "http://localhost:3000/api/clinic/services"

    search_treatments = httpx.get(url, headers=header)
    data = search_treatments.json()

    treatment_name = state["treatment_name"].strip().lower()

    if data["success"] == True:
        treatment = next(
            (
                t for t in data["services"]
                if t.get("name", "").strip().lower() == treatment_name
            ),
            None,
        )

        if treatment:
            return {
                "treatmentExists": True,
                "treatments": data,
                "selectedTreatment": treatment["_id"],
            }

    return {
        "treatmentExists": False,
        "treatments": data,
        "selectedTreatment": "",
    }


def confirm_time(state: AppointmentState):
    start_time_str = state["fromTime"]     
    date_str = state["startDate"]         
    
    start_time = datetime.strptime(start_time_str, "%H:%M")
    end_time = start_time + timedelta(minutes=20)
    to_time_str = end_time.strftime("%H:%M")
    
    return {
        "timeConfirmed": True,
        "startDate": date_str,
        "fromTime": start_time_str,
        "toTime": to_time_str              
    }    

llm=ChatOpenAI(model="gpt-4o-mini")

def handle_error(state: AppointmentState):
    if (state["patientExists"]==False):
        prompt=f"Patient named {state['patient_name']} does not exist. Write a friendly message to inform the user about this issue and suggest to check the patient name or create a new patient profile."
        error_message=llm.invoke(prompt).content
        return {"Status": "Error", "errorMessage": error_message}
    elif (state["doctorExists"]==False):
        prompt=f"Doctor named {state['doctor_name']} does not exist. Write a friendly message to inform the user about this issue and suggest to check the doctor name or contact support."
        error_message=llm.invoke(prompt).content
        return {"Status": "Error", "errorMessage": error_message}
    elif (state["roomExists"]==False):
        prompt=f"Room named {state['room_name']} does not exist. Write a friendly message to inform the user about this issue and suggest to check the room name or contact support."
        error_message=llm.invoke(prompt).content
        return {"Status": "Error", "errorMessage": error_message}
    elif (state["treatmentExists"]==False):
        prompt=f"Treatment named {state['treatment_name']} does not exist. Write a friendly message to inform the user about this issue and suggest to check the treatment name or contact support."
        error_message=llm.invoke(prompt).content
        return {"Status": "Error", "errorMessage": error_message}

def book_appointment(state: AppointmentState):
    header = get_header(token)
    url = "http://localhost:3000/api/clinic/appointments"
    payload = {
        "patientId": state["patientId"],
        "doctorId": state["selectedDoctorId"],
        "roomId": state["selectedRoomId"],
        "serviceId": state["selectedTreatment"],
        "serviceName": state["treatment_name"],
        "status": "booked",
        "followType": "first time",
        "startDate": state["startDate"],
        "fromTime": state["fromTime"],
        "toTime": state["toTime"]
    }
    response = httpx.post(url, json=payload, headers=header)
    data = response.json()
    if data["success"] == True:
        appointment_db_id = data["appointment"]["_id"]  # adjust key as per your API
        ref_id = appointment_id_to_ref(appointment_db_id)
        print("Generated Reference ID:", ref_id)  # Debugging statement
        return {
            "Status": "Booked",
            "referenceId": ref_id,          # ← send this back to user
            "appointmentId": appointment_db_id
        }    
    else:
        return {"Status": "Error", "Message": data.get("message", "An error occurred while booking the appointment.")}


def after_check_patient(state: AppointmentState) -> Literal["check_doctor", "handle_error"]:
    if state["patientExists"] == True:
        return "check_doctor"
    else:
        return "handle_error"

def after_check_doctor(state: AppointmentState) -> Literal["check_room", "handle_error"]:
    if state["doctorExists"] == True:
        return "check_room"
    else:
        return "handle_error"

def after_check_room(state: AppointmentState) -> Literal["check_treatments", "handle_error"]:
    if state["roomExists"] == True:
        return "check_treatments"
    else:
        return "handle_error"

def after_check_treatments(state: AppointmentState) -> Literal["confirm_time", "handle_error"]:
    if state["treatmentExists"] == True:
        return "confirm_time"
    else:
        return "handle_error"

def buildGraph(clinicToken:str,payload: dict):
    global token
    token=clinicToken
    initial_state = {
        "clinicToken": clinicToken,
        "patient_name": payload.get("patient_name", ""),
        "selectedDoctorId": payload.get("doctorId", ""),
        "selectedRoomId": payload.get("roomId", ""),
        "selectedTreatment": payload.get("treatment_name", ""),
        "followType": payload.get("followType", ""),
        "startDate": payload.get("startDate", ""),
        "fromTime": payload.get("fromTime", ""),
        "toTime": payload.get("toTime", ""),
        "doctor_name": payload.get("doctor_name", ""),
        "room_name": payload.get("room_name", ""),
        "treatment_name": payload.get("treatment_name", ""),
        "rooms": [],
        "doctors": [],
        "treatments": [],
        "patients": [],
        "patientExists": False,
        "doctorExists": False,
        "roomExists": False,
        "treatmentExists": False,
        "timeConfirmed": False,
        "patientId": "",
    }
    graph = StateGraph(AppointmentState)

    # Defining the Nodes
    graph.add_node("check_patient", check_patient)
    graph.add_node("check_doctor", check_doctor)
    graph.add_node("check_room", check_room)
    graph.add_node("check_treatments", check_treatments)
    graph.add_node("confirm_time", confirm_time)
    graph.add_node("handle_error", handle_error)
    graph.add_node("book_appointment", book_appointment)

    # Adding Edges
    graph.add_edge(START, "check_patient")
    graph.add_conditional_edges("check_patient", after_check_patient)
    graph.add_conditional_edges("check_doctor", after_check_doctor)
    graph.add_conditional_edges("check_room", after_check_room)
    graph.add_conditional_edges("check_treatments", after_check_treatments)
    graph.add_edge("confirm_time", "book_appointment")
    graph.add_edge("handle_error", END)
    graph.add_edge("book_appointment", END)

    workflow = graph.compile()
    return workflow, initial_state