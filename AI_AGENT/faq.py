# faq.py
import httpx
import asyncio
from cache import get_cache, set_cache

FAQ_CACHE_TTL = 600                       

async def get_info(clinicToken: str) -> dict:

    cache_key = f"faq:{clinicToken}"
    cached = await get_cache(cache_key)
    if cached:
        return cached                       
    headers = {"Authorization": f"Bearer {clinicToken}"}

    async with httpx.AsyncClient() as client:
        try:
            resp1, resp2 = await asyncio.gather(
                client.get(
                    "http://localhost:3000/api/clinic/appointment-data",
                    headers=headers,
                    timeout=10.0
                ),
                client.get(
                    "http://localhost:3000/api/clinics/myallClinic",
                    headers=headers,
                    timeout=10.0
                )
            )
        except Exception as e:
            return {"Status": "Error", "Message": f"Failed to fetch clinic data: {e}"}

    data1 = resp1.json()
    data2 = resp2.json()

    if not data1["success"]:
        return {"Status": "Error", "Message": data1.get("message", "Could not fetch clinic data.")}

    if not data2["success"]:
        return {"Status": "Error", "Message": data2.get("message", "Could not fetch treatments data.")}

    clinic1      = data1["clinic"]
    doctor_staff = data1["doctorStaff"]
    clinic2      = data2["clinic"]

    safe_timings = []
    for timing in clinic1["timings"]:
        if timing["isOpen"]:
            safe_timings.append({
                "day":         timing["day"],
                "openingTime": timing["openingTime"],
                "closingTime": timing["closingTime"],
            })
        else:
            safe_timings.append({
                "day":    timing["day"],
                "status": "Closed",
            })

    safe_doctors = [{"name": doctor["name"]} for doctor in doctor_staff]

    safe_treatments = []
    for treatment in clinic2["treatments"]:
        if not treatment["enabled"]:
            continue
        sub_list = [
            {"name": sub["name"], "price": sub["price"]}
            for sub in treatment["subTreatments"]
            if sub["enabled"]
        ]
        if sub_list:
            safe_treatments.append({
                "category":   treatment["mainTreatment"],
                "treatments": sub_list,
            })

    result = {
        "Status":     "Found",
        "clinicName": clinic2["name"],
        "address":    clinic2["address"],
        "phone":      clinic2["phone"],
        "whatsapp":   clinic2["whatsapp"],
        "email":      clinic2["email"],
        "currency":   clinic2["currency"],
        "timings":    safe_timings,
        "doctors":    safe_doctors,
        "treatments": safe_treatments,
    }

    await set_cache(cache_key, result, FAQ_CACHE_TTL) 

    return result