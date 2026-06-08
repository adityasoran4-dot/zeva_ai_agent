# import httpx
# import json

# url = "http://localhost:3000/api/messages/get-messages/6a21221e153027071ff1f27b?page=1&limit=5"
# header = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkwOWIzMGZhYTk4ZjYzZTk3ZTNkMTciLCJyb2xlIjoiY2xpbmljIiwiZW1haWwiOiI0NGR3aXZlZGlzYXJ0aGFrQGdtYWlsLmNvbSIsImlhdCI6MTc4MDkyMDYxOSwiZXhwIjoxNzgxMDA3MDE5fQ.MOGVJplKYS99fOSf0np_rZpiR-JO7rAvTgWo0zi5cN8"}

# response = httpx.get(url, headers=header)
# print(response.json())
# # Check FIRST before parsing
# print("Status:", response.status_code)
# print("Raw response:", response.text)

# # Only parse if response is not empty
# if response.text.strip():
#     data = response.json()
#     with open("response3.json", "w", encoding="utf-8") as f:
#         json.dump(data, f, indent=4)
#     print("Saved to response3.json")
# else:
#     print("Empty response from server")


from main import get_patient_name
import asyncio

async def main():
    data = await get_patient_name()
    print(data)

asyncio.run(main())