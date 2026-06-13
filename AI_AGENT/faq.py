import httpx
import asyncio
import logging
import traceback
from cache import get_cache, set_cache
from appointment import get_header

logger = logging.getLogger(__name__)
CACHE_TTL = 120

# Limit to 5 concurrent requests at a time instead of 26
SEMAPHORE = asyncio.Semaphore(5)


async def get_services_for_doctor(doctor_id: str, clinicToken: str) -> list[str]:
    cache_key = f"services:{doctor_id}"
    cached = await get_cache(cache_key)
    if cached:
        return cached

    header = get_header(clinicToken)
    services = []
    page = 1

    # Longer timeout since local server can be slow under load
    timeout = httpx.Timeout(30.0, connect=15.0)

    async with SEMAPHORE:  # ← max 5 concurrent connections
        async with httpx.AsyncClient(timeout=timeout) as client:
            while True:
                url = (
                    f"http://localhost:3000/api/appointment-booking/get-services/{doctor_id}"
                    f"?search=&page={page}&limit=10"
                )
                resp = await client.get(url, headers=header)
                resp.raise_for_status()
                data = resp.json()

                inner = data.get("data", {})

                for s in inner.get("services", []):
                    name = s.get("name")
                    if name:
                        services.append(name)

                pagination = inner.get("pagination", {})
                if not pagination.get("hasMore"):
                    break
                page += 1

    await set_cache(cache_key, services, CACHE_TTL)
    return services


async def get_all_doctors(clinicToken: str, clinic_id: str) -> list[dict]:
    cache_key = f"doctors:{clinic_id}"
    cached = await get_cache(cache_key)
    if cached:
        return cached

    header = get_header(clinicToken)
    all_doctors = []
    page = 1

    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
        while True:
            url = (
                f"http://localhost:3000/api/appointment-booking/get-doctors-by-clinic"
                f"?clinicId={clinic_id}&search=&page={page}&limit=10"
            )
            resp = await client.get(url, headers=header)
            resp.raise_for_status()
            data = resp.json()

            for d in data.get("data", {}).get("doctors", []):
                all_doctors.append(
                    {
                        "_id": d.get("_id"),
                        "name": d.get("name"),
                        "email": d.get("email"),
                    }
                )

            if not data.get("data", {}).get("pagination", {}).get("hasMore"):
                break
            page += 1

    await set_cache(cache_key, all_doctors, CACHE_TTL)
    return all_doctors


async def get_doctors_by_treatment(
    treatment_name: str, clinicToken: str, clinic_id: str
) -> dict:
    doctors = await get_all_doctors(clinicToken, clinic_id)

    if not doctors:
        return {
            "status": "error",
            "message": "Could not fetch doctors. Please try again later.",
        }

    # Deduplicate by _id
    seen = set()
    unique_doctors = []
    for d in doctors:
        if d["_id"] not in seen:
            seen.add(d["_id"])
            unique_doctors.append(d)

    async def doctor_with_services(doctor: dict) -> tuple[dict, list[str]]:
        services = await get_services_for_doctor(doctor["_id"], clinicToken)
        return doctor, services

    results = await asyncio.gather(
        *[doctor_with_services(d) for d in unique_doctors], return_exceptions=True
    )

    treatment_lower = treatment_name.strip().lower()
    matched_doctors = []
    all_services: set[str] = set()

    for result in results:
        if isinstance(result, Exception):
            logger.warning(f"Failed to fetch services for a doctor: {result}")
            traceback.print_exception(type(result), result, result.__traceback__)
            continue

        doctor, services = result
        all_services.update(services)
        services_lower = [s.lower() for s in services]

        if treatment_lower in services_lower or any(
            treatment_lower in s for s in services_lower
        ):
            matched_doctors.append(
                {
                    "doctor_name": doctor["name"],
                    "doctor_id": doctor["_id"],
                    "services": services,
                }
            )

    if not matched_doctors:
        return {
            "status": "not_found",
            "message": f"No doctors found for treatment '{treatment_name}'.",
            "available_treatments": sorted(all_services),
        }

    return {
        "status": "success",
        "treatment": treatment_name,
        "doctors": matched_doctors,
    }


async def get_services(clinicToken: str) -> dict:
    header = get_header(clinicToken)
    all_services = []
    page = 1

    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
        while True:
            url = f"http://localhost:3000/api/clinic/services?page={page}&limit=20"
            resp = await client.get(url, headers=header)
            resp.raise_for_status()
            data = resp.json()

            for s in data.get("services", []):
                if not s.get("isActive"):
                    continue
                all_services.append(
                    {
                        "name": s.get("name"),
                        "price": s.get("clinicPrice") or s.get("price"),
                        "duration_minutes": s.get("durationMinutes"),
                        "department": (
                            s.get("departmentId", {}).get("name")
                            if isinstance(s.get("departmentId"), dict)
                            else None
                        ),
                    }
                )

            # Check pagination — adjust key based on your actual API response shape
            pagination = data.get("pagination", {})
            if not pagination.get("hasMore"):
                break
            page += 1

    # Group by department
    grouped: dict[str, list] = {}
    for s in all_services:
        dept = s["department"] or "General"
        grouped.setdefault(dept, []).append(s)

    return {
        "status": "success",
        "total": len(all_services),
        "by_department": grouped,
    }


async def get_timings(clinicToken: str) -> dict:
    header = get_header(clinicToken)
    url = "http://localhost:3000/api/clinic/timings"

    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0)) as client:
        resp = await client.get(url, headers=header)
        resp.raise_for_status()
        data = resp.json()

    timings = []
    for t in data.get("timings", []):
        timings.append(
            {
                "day": t.get("day"),
                "isOpen": t.get("isOpen"),
                "openingTime": t.get("openingTime") if t.get("isOpen") else None,
                "closingTime": t.get("closingTime") if t.get("isOpen") else None,
            }
        )

    return {"status": "success", "timings": timings}


async def get_clinic_id(clinicToken: str) -> str:
    header = get_header(clinicToken)
    url = "http://localhost:3000/api/clinics/myallClinic"
    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0)) as client:
        resp = await client.get(url, headers=header)
        resp.raise_for_status()
        data = resp.json()
        return data["clinic"]["_id"]
