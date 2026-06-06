
import httpx
import json

from main import generate_scheduler_link


url="http://localhost:3000/api/appointment-booking/get-doctors-by-clinic?clinicId=68909b31faa98f63e97e3d1b&search=&page=1&limit=100"
header={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkwOWIzMGZhYTk4ZjYzZTk3ZTNkMTciLCJyb2xlIjoiY2xpbmljIiwiZW1haWwiOiI0NGR3aXZlZGlzYXJ0aGFrQGdtYWlsLmNvbSIsImlhdCI6MTc4MDcyMDc2OSwiZXhwIjoxNzgwODA3MTY5fQ.AeJRnYZH_nklpcIq0qX_K8axw1RNTee5e_Mrnzfz-Kc"}
response=httpx.get(url,headers=header)
data=response.json()
with open("response3.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=4)

print("Saved to response.json")

# print(data)


