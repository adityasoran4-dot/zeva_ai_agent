import hashids
import os
from dotenv import load_dotenv
load_dotenv()

# CRITICAL: Must be the same salt used when the ID was generated.
# Store this in .env as HASHIDS_SALT
SALT = os.getenv("HASHIDS_SALT", "your-clinic-secret-salt")
HASHIDS_MIN_LENGTH = 6
ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

_hashids = hashids.Hashids(salt=SALT, min_length=HASHIDS_MIN_LENGTH, alphabet=ALPHABET)

def appointment_id_to_ref(appointment_id: str) -> str:
    num = int(appointment_id, 16)
    high = num >> 64
    mid  = (num >> 32) & 0xFFFFFFFF
    low  = num & 0xFFFFFFFF
    encoded = _hashids.encode(high, mid, low)
    return f"APT-{encoded}"

def ref_to_appointment_id(ref_id: str) -> str | None:
    try:
        code = ref_id.strip().upper().replace("APT-", "")
        print(f"[DEBUG] Decoding hash: '{code}'")  # ← add this
        decoded = _hashids.decode(code)
        print(f"[DEBUG] Decoded values: {decoded}")  # ← and this
        if len(decoded) != 3:
            print(f"[DEBUG] Expected 3 values, got {len(decoded)}")
            return None
        high, mid, low = decoded
        num = (high << 64) | (mid << 32) | low
        result = format(num, '024x')
        print(f"[DEBUG] Resolved appointment ID: {result}")
        return result
    except Exception as e:
        print(f"[DEBUG] ref_to_appointment_id error: {e}")
        return None