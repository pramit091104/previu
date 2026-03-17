import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

let redis: Redis | null = null;

// Ignore localhost/127.0.0.1 URLs as they will just crash dev server if no local Redis is running
if (redisUrl && !redisUrl.includes("localhost") && !redisUrl.includes("127.0.0.1")) {
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // prevent unhandled promise rejection crash
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on("error", (err) => {
      console.error("❌ Redis Error:", err);
    });

    redis.on("connect", () => {
      console.log("✅ Redis Connected");
    });
  } catch (error) {
    console.error("❌ Redis Connection Failed:", error);
  }
} else {
  console.warn("⚠️ REDIS_URL not set. Redis features will be disabled.");
}

export default redis;
