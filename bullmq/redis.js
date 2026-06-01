// lib/redis.ts
import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "";

const redisOptions = {
  maxRetriesPerRequest: null, // ✅ REQUIRED FOR BULLMQ
  enableReadyCheck: false, // ✅ REQUIRED FOR BULLMQ
  keepAlive: 10000, // ✅ Help prevent idle timeouts
  connectTimeout: 10000, // ✅ Fail faster if connection is blocked
  // ⚠️ Add this - helps with BullMQ
  lazyConnect: false,
  // ⚠️ Add these for better BullMQ compatibility
  enableAutoPipelining: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetErrors = [
      "ECONNRESET",
      "ECONNABORTED",
      "ETIMEDOUT",
      "EADDRNOTAVAIL",
    ];
    if (
      targetErrors.some((code) => err.message.includes(code)) ||
      targetErrors.includes(err.code)
    ) {
      console.log(`Redis reconnecting due to: ${err.message}`);
      return true;
    }
    return false;
  },
};

// Singleton pattern for Next.js / Node.js
const getRedisClient = () => {
  const maskedUrl = REDIS_URL
    ? REDIS_URL.replace(/:[^:@]+@/, ":****@")
    : "localhost:6379";
  let client;

  // Use globalThis for both development and production
  // This ensures connection is preserved across hot reloads (dev)
  // and reused across module imports (production)
  if (!globalThis.redis) {
    console.log(
      `Creating new Redis connection (${process.env.NODE_ENV === "production" ? "Prod" : "Dev"}): ${maskedUrl}`,
    );
    globalThis.redis = new Redis(REDIS_URL, redisOptions);
  }
  client = globalThis.redis;

  // Add event listeners if they haven't been added yet
  if (client && !client._events_added) {
    client.on("error", (err) => {
      console.error("Redis connection error:", err.message);
    });

    client.on("connect", () => {
      console.log("Redis connected successfully");
    });

    client.on("reconnecting", (ms) => {
      console.log(`Redis reconnecting in ${ms}ms...`);
    });

    client.on("close", () => {
      console.log("Redis connection closed");
    });

    client._events_added = true;
  }

  return client;
};

const redis = getRedisClient();
console.log("Redis client initialized");

export const redisClient = redis;
export default redis;
