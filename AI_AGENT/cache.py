# cache.py
import redis.asyncio as redis
import os
import json

redis_client = redis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"),
    decode_responses=True
)

async def get_cache(key: str) -> dict | None:
    try:
        data = await redis_client.get(key)
        if data:
            return json.loads(data)
        return None
    except Exception:
        return None                         

async def set_cache(key: str, value: dict, ttl_seconds: int) -> None:
    try:
        await redis_client.setex(key, ttl_seconds, json.dumps(value))
    except Exception:
        pass                                