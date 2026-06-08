from typing import Literal, TypedDict
import httpx                                    
from dotenv import load_dotenv
from langgraph.graph import END, START, StateGraph
from datetime import datetime, timedelta

load_dotenv()

class AppointmentState(TypedDict):             
    clinicToken: str
    patient_name: str
    doctor_name: str
    treatment_name: str
    doctors: list
    treatments: list
    patients: list
    patientExists: bool
    doctorExists: bool
    treatmentExists: bool
    timeConfirmed: bool
    selectedDoctorId: str
    selectedTreatment: str
    patientId: str
    Status: str
    referenceId: str
    appointmentId: str
    startDate: str
    fromTime: str
    toTime: str
    errorMessage: str
    Message: str  


def get_header(token):                        
    return {"Authorization": f"Bearer {token}"}



async def check_patient(state: AppointmentState):
    header = get_header(state['clinicToken'])
    url = f"http://localhost:3000/api/clinic/search-patients?search={state['patient_name']}"

    async with httpx.AsyncClient() as client:                    
        search_patient = await client.get(url, headers=header)
    data = search_patient.json()

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


async def check_doctor(state: AppointmentState):
    header = get_header(state['clinicToken'])
    url = "http://localhost:3000/api/lead-ms/get-agents-options?role=doctorStaff"

    async with httpx.AsyncClient() as client:                    
        search_doctor = await client.get(url, headers=header)
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


# async def check_room(state: AppointmentState):
#     header = get_header(state['clinicToken'])
#     url = "http://localhost:3000/api/clinic/rooms"

#     async with httpx.AsyncClient() as client:                   
#         search_room = await client.get(url, headers=header)
#     data = search_room.json()

#     room_name = state["room_name"].strip().lower()

#     if data["success"] == True:
#         room = next(
#             (
#                 r for r in data["rooms"]
#                 if r.get("name", "").strip().lower() == room_name
#             ),
#             None,
#         )
#         if room:
#             return {
#                 "roomExists": True,
#                 "rooms": data,
#                 "selectedRoomId": room["_id"],
#             }

#     return {
#         "roomExists": False,
#         "rooms": data,
#         "selectedRoomId": "",
#     }


async def check_treatments(state: AppointmentState):
    header = get_header(state['clinicToken'])
    url = "http://localhost:3000/api/clinic/services"

    async with httpx.AsyncClient() as client:                   
        search_treatments = await client.get(url, headers=header)
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

    converted_date = None
    formats_to_try = ["%d-%m-%Y", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S.%fZ"]

    for fmt in formats_to_try:
        try:
            converted_date = datetime.strptime(date_str, fmt).strftime("%Y-%m-%dT00:00:00.000Z")
            break
        except ValueError:
            continue

    if not converted_date:
        # Last resort — return error instead of storing wrong date
        return {
            "Status": "Error",
            "errorMessage": f"Could not parse date: {date_str}"
        }

    start_time = datetime.strptime(start_time_str, "%H:%M")
    end_time = start_time + timedelta(minutes=20)
    to_time_str = end_time.strftime("%H:%M")

    return {
        "timeConfirmed": True,
        "startDate": converted_date,
        "fromTime": start_time_str,
        "toTime": to_time_str
    }



def handle_error(state: AppointmentState):     
    if not state["patientExists"]:
        return {"Status": "Error", "errorMessage": f"Patient '{state['patient_name']}' was not found. Please check the name or register the patient first."}
    elif not state["doctorExists"]:
        return {"Status": "Error", "errorMessage": f"Doctor '{state['doctor_name']}' was not found. Please check the name or contact support."}
    elif not state["treatmentExists"]:
        return {"Status": "Error", "errorMessage": f"Treatment '{state['treatment_name']}' is not available. Please check the name or contact support."}


async def book_appointment(state: AppointmentState):
    header = get_header(state['clinicToken'])
    url = "http://localhost:3000/api/clinic/appointments"
    payload = {
        "patientId": state["patientId"],
        "doctorId": state["selectedDoctorId"],
        "serviceId": state["selectedTreatment"],
        "serviceName": state["treatment_name"],
        "status": "booked",
        "followType": "first time",
        "startDate": state["startDate"],
        "fromTime": state["fromTime"],
        "toTime": state["toTime"]
    }

    async with httpx.AsyncClient() as client:                   
        response = await client.post(url, json=payload, headers=header)
    data = response.json()
    print(data)

    if data["success"] == True:
        return {
            "Status": "Booked",
            "Message":"Appointment Booked Successfully"
        }
    else:
        return {"Status": "Error", "Message": data.get("message", "An error occurred while booking the appointment.")}



def after_check_patient(state: AppointmentState) -> Literal["check_doctor", "handle_error"]:
    return "check_doctor" if state["patientExists"] else "handle_error"

def after_check_doctor(state: AppointmentState) -> Literal["check_treatments", "handle_error"]:
    return "check_treatments" if state["doctorExists"] else "handle_error"

# def after_check_room(state: AppointmentState) -> Literal["check_treatments", "handle_error"]:
#     return "check_treatments" if state["roomExists"] else "handle_error"

def after_check_treatments(state: AppointmentState) -> Literal["confirm_time", "handle_error"]:
    return "confirm_time" if state["treatmentExists"] else "handle_error"



def buildGraph(clinicToken: str, payload: dict):
    initial_state = {
        "clinicToken": clinicToken,
        "patient_name": payload.get("patient_name", ""),
        "doctor_name": payload.get("doctor_name", ""),
        "treatment_name": payload.get("treatment_name", ""),
        "startDate": payload.get("startDate", ""),
        "fromTime": payload.get("fromTime", ""),
        "toTime": "",
        "selectedDoctorId": "",
        "selectedTreatment": "",
        "doctors": [],
        "treatments": [],
        "patients": [],
        "patientExists": False,
        "doctorExists": False,
        "treatmentExists": False,
        "timeConfirmed": False,
        "patientId": "",
        "Status": "",
        "errorMessage": "",
        "Message": "",
        "referenceId": "",
        "appointmentId": "",
    }

    graph = StateGraph(AppointmentState)

    graph.add_node("check_patient", check_patient)
    graph.add_node("check_doctor", check_doctor)
    graph.add_node("check_treatments", check_treatments)
    graph.add_node("confirm_time", confirm_time)
    graph.add_node("handle_error", handle_error)
    graph.add_node("book_appointment", book_appointment)

    graph.add_edge(START, "check_patient")
    graph.add_conditional_edges("check_patient", after_check_patient)
    graph.add_conditional_edges("check_doctor", after_check_doctor)
    # graph.add_conditional_edges("check_room", after_check_room)
    graph.add_conditional_edges("check_treatments", after_check_treatments)
    graph.add_edge("confirm_time", "book_appointment")
    graph.add_edge("handle_error", END)
    graph.add_edge("book_appointment", END)

    workflow = graph.compile()
 
    return workflow, initial_state