import redis

r = redis.Redis(
    host="127.0.0.1",
    port=6379,
    decode_responses=True,
    protocol=2
)

for key in r.scan_iter("*"):
    print(f"\n=== {key} ===")
    print("TYPE:", r.type(key))

    try:
        t = r.type(key)

        if t == "string":
            print(r.get(key))

        elif t == "hash":
            print(r.hgetall(key))

        elif t == "list":
            print(r.lrange(key, 0, -1))

        elif t == "set":
            print(r.smembers(key))

        elif t == "zset":
            print(r.zrange(key, 0, -1, withscores=True))

    except Exception as e:
        print("ERROR:", e)