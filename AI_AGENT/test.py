import httpx

url = "http://localhost:3000/api/clinic/timings"

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkwOWIzMGZhYTk4ZjYzZTk3ZTNkMTciLCJyb2xlIjoiY2xpbmljIiwiZW1haWwiOiI0NGR3aXZlZGlzYXJ0aGFrQGdtYWlsLmNvbSIsImlhdCI6MTc4MTMyNTk2OCwiZXhwIjoxNzgxNDEyMzY4fQ.Pv7x9l0NH60d3B-znajPdBXy7p4AIddanspU--3CLPs"

headers = {
    "Authorization": f"Bearer {token}"
}

response = httpx.get(url, headers=headers)

print(response.status_code)
print(response.text)