import httpx
import json

url = "http://localhost:3000/api/clinic/services"
header = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkwOWIzMGZhYTk4ZjYzZTk3ZTNkMTciLCJyb2xlIjoiY2xpbmljIiwiZW1haWwiOiI0NGR3aXZlZGlzYXJ0aGFrQGdtYWlsLmNvbSIsImlhdCI6MTc4MDcyMDc2OSwiZXhwIjoxNzgwODA3MTY5fQ.AeJRnYZH_nklpcIq0qX_K8axw1RNTee5e_Mrnzfz-Kc"}

response = httpx.get(url, headers=header)

# Check FIRST before parsing
print("Status:", response.status_code)
print("Raw response:", response.text)

# Only parse if response is not empty
if response.text.strip():
    data = response.json()
    with open("response3.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    print("Saved to response3.json")
else:
    print("Empty response from server")