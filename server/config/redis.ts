import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redis: Redis | null = null;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
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

export default redis;
