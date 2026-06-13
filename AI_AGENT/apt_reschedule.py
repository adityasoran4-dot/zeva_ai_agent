from cache import get_cache, set_cache, redis_client
import httpx
from datetime import datetime, timedelta
from appointment import get_header
import redis
import logging

logger = logging.getLogger(__name__)
APPOINTMENT_CACHE_TTL = 120


async def find_lead_id(conversation_id: str, clinicToken: str):
    headers = get_header(clinicToken)

    async with httpx.AsyncClient() as client:
        try:
            page = 1

            while True:
                url = (
                    f"http://localhost:3000/api/messages/get-messages/"
                    f"{conversation_id}?page={page}&limit=50"
                )

                resp = await client.get(url, headers=headers)
                data = resp.json()

                # Search all messages on this page
                for day in data["data"]:
                    for message in day["messages"]:
                        if "leadId" in message:
                            return {"leadId": message["leadId"]}

                # Stop if there are no more pages
                if not data["pagination"]["hasMore"]:
                    break

                page += 1

            return {"Status": "Error", "Message": "No leadId found in any page."}

        except Exception as e:
            return {
                "Status": "Error",
                "Message": f"Failed to fetch booking details: {e}",
            }


async def find_patient_number(leadId: str, clinicToken: str):
    headers = get_header(clinicToken)

    async with httpx.AsyncClient() as client:
        try:
            page = 1

            while True:
                url = (
                    f"http://localhost:3000/api/lead-ms/leadFilter"
                    f"?page={page}&limit=20&name="
                )

                resp = await client.get(url, headers=headers)
                data = resp.json()

                for d in data["leads"]:
                    if d["_id"] == leadId:
                        print("FOUND LEAD")
                        patient_number = d.get("phone")

                        if patient_number:
                            return {"patient_number": patient_number}
                        else:
                            return {
                                "Status": "Error",
                                "Message": "There are no bookings yet.",
                            }

                if not data["pagination"]["hasMore"]:
                    break

                page += 1

            return {"Status": "Error", "Message": "No Lead Id Found"}

        except Exception as e:
            return {
                "Status": "Error",
                "Message": f"Failed to fetch booking details: {e}",
            }


def extract_appointment_details(appointment: dict) -> dict:
    return {
        "_id": appointment.get("_id"),
        "patientName": appointment.get("patientName"),
        "patientNumber": appointment.get("patientNumber"),
        "doctorName": appointment.get("doctorName"),
        "treatment_names": appointment.get("serviceNames", []),
        "status": appointment.get("status"),
        "startDate": appointment.get("startDate"),
        "fromTime": appointment.get("fromTime"),
        "toTime": appointment.get("toTime"),
    }


async def find_latest_appointment(conversation_id: str, clinicToken: str):
    headers = get_header(clinicToken)

    # Step 1: Get lead ID
    lead_result = await find_lead_id(
        conversation_id=conversation_id, clinicToken=clinicToken
    )
    if "Status" in lead_result and lead_result["Status"] == "Error":
        return lead_result  # Bubble up: "No leadId found" etc.

    # Step 2: Get patient ID
    patient_result = await find_patient_number(
        leadId=lead_result["leadId"], clinicToken=clinicToken
    )
    if "Status" in patient_result and patient_result["Status"] == "Error":
        return patient_result  # Bubble up: "There are no bookings yet." etc.

    patientNumber = patient_result["patient_number"]

    url = (
        f"http://localhost:3000/api/clinic/all-appointments"
        f"?page=1&limit=50&patientNumber={patientNumber}"
    )

    def parse_date(appt: dict) -> datetime:
        raw = appt.get("createdAt")
        if not raw:
            return datetime.min
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            print(data)

            appointments = data.get("appointments", [])
            if not appointments:
                return {"Status": "Error", "Message": "No appointments found."}

            latest_apt = max(appointments, key=parse_date)
            return {
                "apt_details": extract_appointment_details(latest_apt),
                "existing": latest_apt,
                "all_apt": appointments,
            }

        except httpx.HTTPStatusError as e:
            return {
                "Status": "Error",
                "Message": f"API returned {e.response.status_code}: {e.response.text}",
            }
        except Exception as e:
            return {
                "Status": "Error",
                "Message": f"Failed to fetch appointment details: {e}",
            }


async def reschedule_apt(
    conversation_id: str, clinicToken: str, startDate: str, fromTime: str
):
    headers = get_header(clinicToken)

    apt = await find_latest_appointment(
        conversation_id=conversation_id, clinicToken=clinicToken
    )
    print(apt)
    # Check for any error bubbled up from lead/patient/appointment lookup
    if "Status" in apt and apt["Status"] == "Error":
        return apt  # Bubble up: agent will receive and relay the message

    existing = apt["existing"]
    apt_id = existing["_id"]

    toTime = (datetime.strptime(fromTime, "%H:%M") + timedelta(minutes=20)).strftime(
        "%H:%M"
    )
    try:
        converted_date = datetime.strptime(startDate, "%d-%m-%Y").strftime(
            "%Y-%m-%dT00:00:00.000Z"
        )
    except ValueError:
        return {
            "Status": "Error",
            "Message": f"Invalid date format received: {startDate}",
        }

    print(existing["fromTime"])

    existing["startDate"] = converted_date
    existing["fromTime"] = fromTime
    existing["toTime"] = toTime
    existing["status"] = "Rescheduled"

    fields_to_remove = ["_id", "__v", "createdAt", "updatedAt", "referenceId"]
    for field in fields_to_remove:
        existing.pop(field, None)

    try:
        async with httpx.AsyncClient() as client:
            put_resp = await client.put(
                f"http://localhost:3000/api/clinic/update-appointment/{apt_id}",
                json=existing,
                headers=headers,
                timeout=10.0,
            )
            print(put_resp)
        put_data = put_resp.json()
        print(put_data)
    except Exception as e:
        return {"Status": "Error", "Message": f"Failed to update appointment: {e}"}

    if put_data.get("success"):
        cache_key = f"appointment:{clinicToken}:{apt_id}"
        try:
            await redis_client.delete(cache_key)
        except redis.exceptions.RedisError as e:
            logger.error(f"Redis Error: {e}")
        return {
            "Appointment Status": "Rescheduled",
            "Message": put_data.get("message", "Appointment rescheduled successfully."),
            "newDate": startDate,
            "newTime": fromTime,
        }
    else:
        return {
            "Status": "Error",
            "Message": put_data.get("message", "Server rejected the update."),
        }
