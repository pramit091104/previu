import { Request, Response, NextFunction } from "express";
import redis from "../config/redis.ts";

/**
 * Middleware to handle request idempotency using Redis.
 * Expects an 'x-idempotency-key' header.
 */
export const idempotency = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers["x-idempotency-key"];

  if (!key || typeof key !== "string") {
    return next();
  }

  if (!redis) {
    return next();
  }

  const redisKey = `idempotency:${key}`;
  
  try {
    const existingResponse = await redis.get(redisKey);
    
    if (existingResponse) {
      const { status, body } = JSON.parse(existingResponse);
      return res.status(status).json(body);
    }

    // Wrap res.json to cache the response
    const originalJson = res.json;
    res.json = function (body) {
      redis?.set(redisKey, JSON.stringify({ status: res.statusCode, body }), "EX", 3600); // Cache for 1 hour
      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    console.error("Idempotency Middleware Error:", error);
    next();
  }
};
