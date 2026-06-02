import httpx
from reference_id import ref_to_appointment_id
from datetime import datetime, timedelta

def normalize_time(time_str: str) -> str:
    time_str = time_str.strip()
    for fmt in ("%H:%M", "%I:%M %p", "%I %p", "%I:%M%p", "%I%p"):
        try:
            return datetime.strptime(time_str.upper(), fmt).strftime("%H:%M")
        except ValueError:
            continue
    raise ValueError(f"Cannot parse time: '{time_str}'")

def normalize_date(date_str: str) -> str:
    date_str = date_str.strip()
    if len(date_str) == 10 and date_str[4] == '-':
        return date_str
    try:
        return datetime.strptime(date_str, "%d-%m-%Y").strftime("%Y-%m-%d")
    except ValueError:
        pass
    raise ValueError(f"Cannot parse date: '{date_str}'")

def reschedule_apt(clinicToken: str, ref_id: str, startDate: str, fromTime: str) -> dict:
    apt_id = ref_to_appointment_id(ref_id)
    if not apt_id:
        return {"Status": "Error", "Message": f"No appointment found for reference ID: {ref_id}"}

    toTime = (datetime.strptime(fromTime, "%H:%M") + timedelta(minutes=20)).strftime("%H:%M")
    headers = {"Authorization": f"Bearer {clinicToken}"}

    # ── STEP 1: Fetch existing appointment ────────────────────────────
    try:
        =httpx.get(
            f"http://localhost:3000/api/clinic/all-appointments"
            headers=headers,
            timeout=10.0
        )
        data=   get_resp.json()
    except Exception as e:
        return {"Status": "Error", "Message": f"Failed to fetch appointment: {e}"}

    if not get_data.get("success"):
        return {"Status": "Error", "Message": get_data.get("message", "Could not fetch appointment.")}

    existing = get_data.get("appointment") or get_data.get("data") or get_data.get("result")
    if not existing:
        return {"Status": "Error", "Message": f"Unexpected response shape: {get_data}"}

    # ── STEP 2: Merge only date/time fields ───────────────────────────
    payload = {**existing, "startDate": startDate, "fromTime": fromTime, "toTime": toTime}

    for field in ["_id", "__v", "createdAt", "updatedAt", "referenceId"]:
        payload.pop(field, None)

    print(f"[RESCHEDULE] PUT payload: {payload}")

    # ── STEP 3: Send full updated object ──────────────────────────────
    try:
        put_resp = httpx.put(
            f"http://localhost:3000/api/clinic/update-appointment/{apt_id}",
            json=payload,
            headers=headers,
            timeout=10.0
        )
        print(f"[RESCHEDULE] PUT status : {put_resp.status_code}")
        print(f"[RESCHEDULE] PUT body   : {put_resp.text}")
        put_data = put_resp.json()
    except Exception as e:
        return {"Status": "Error", "Message": f"Failed to update appointment: {e}"}

    if put_data.get("success"):
        return {
            "Status": "Rescheduled",
            "Message": put_data.get("message", "Appointment rescheduled successfully."),
            "newDate": startDate,
            "newTime": fromTime,
        }
    else:
        return {
            "Status": "Error",
            "Message": put_data.get("message", "Server rejected the update."),
            "debug": put_data,
        }