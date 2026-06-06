# patients.py
import httpx
import asyncio
from cache import get_cache, set_cache, redis_client

PATIENT_CACHE_TTL = 300


async def find_all_patients(headers: dict) -> list | None:
    page = 1
    all_patients = []

    async with httpx.AsyncClient() as client:
        while True:
            try:
                resp = await client.get(
                    "http://localhost:3000/api/clinic/patient-information",
                    headers=headers,
                    params={"page": page, "limit": 50},
                    timeout=10.0
                )
                data = resp.json()
            except Exception:
                return None

            if not data.get("success"):
                return None

            patients = data.get("data", [])
            if not patients:
                break

            all_patients.extend(patients)

            if len(patients) < 50:
                break

            page += 1

    return all_patients


async def get_patients(clinicToken: str) -> dict:

    cache_key = f"patients:{clinicToken}"
    cached = await get_cache(cache_key)
    if cached:
        return cached

    headers = {"Authorization": f"Bearer {clinicToken}"}
    records = await find_all_patients(headers)

    if records is None:
        return {"Status": "Error", "Message": "Failed to fetch patient data."}

    if not records:
        return {"Status": "Error", "Message": "No patients found."}

    patients_info = [
        {
            "fullName":   f"{r.get('firstName', '')} {r.get('lastName', '')}".strip(),
            "mobile":     r.get("mobileNumber"),
            "email":      r.get("email"),
            "doctor":     r.get("doctor"),
            "clinicName": r.get("clinicName"),
            "treatments": r.get("treatments"),
        }
        for r in records
    ]

    result = {
        "Status":        "Found",
        "totalPatients": len(patients_info),
        "patients":      patients_info,
    }

    await set_cache(cache_key, result, PATIENT_CACHE_TTL)
    return result


async def invalidate_patients_cache(clinicToken: str) -> None:
    cache_key = f"patients:{clinicToken}"
    await redis_client.delete(cache_key)