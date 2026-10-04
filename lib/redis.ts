import Redis from "ioredis";
import type { FoodProduct } from "./types/food";

declare global {
  var redis: Redis | undefined;
}

// 7 days default TTL for food product cache (nutrition data rarely changes)
export const DEFAULT_FOOD_CACHE_TTL = Number(process.env.FOOD_CACHE_TTL) || 60 * 60 * 24 * 7;

function normalizeRedisUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  const match = url.match(/redis[s]?:\/\/[^\s]+/);
  if (match) {
    url = match[0];
  }
  if (url.includes(".upstash.io") && url.startsWith("redis://")) {
    url = url.replace("redis://", "rediss://");
  }
  return url;
}

function createRedisClient(): Redis | null {
  const rawRedisUrl = process.env.REDIS_URL;
  const redisUrl = rawRedisUrl ? normalizeRedisUrl(rawRedisUrl) : undefined;
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined;
  const password = process.env.REDIS_PASSWORD;

  // If no Redis connection info provided, return null
  if (!redisUrl && !host) {
    return null;
  }

  try {
    const client = redisUrl
      ? new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 5000,
          retryStrategy(times) {
            if (times > 3) return null;
            return Math.min(times * 200, 1000);
          },
        })
      : new Redis({
          host: host || "127.0.0.1",
          port: port || 6379,
          password: password || undefined,
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
          retryStrategy(times) {
            if (times > 3) return null;
            return Math.min(times * 200, 1000);
          },
        });

    client.on("error", (err) => {
      // Suppress unhandled crash while logging warning
      console.warn("[Redis] Connection error:", err.message);
    });

    return client;
  } catch (error) {
    console.warn("[Redis] Failed to initialize client:", error);
    return null;
  }
}

export const redis = globalThis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production" && redis) {
  globalThis.redis = redis;
}

/**
 * Generate Redis key for barcode product cache.
 * Format: food:barcode:<barcode>
 */
export function getFoodCacheKey(barcode: string): string {
  return `food:barcode:${barcode.trim()}`;
}

/**
 * Retrieve food product data from global Redis cache.
 * Returns null on cache miss, missing client, or error.
 */
export async function getFoodFromCache(barcode: string): Promise<FoodProduct | null> {
  if (!redis) return null;

  try {
    const key = getFoodCacheKey(barcode);
    const data = await redis.get(key);
    if (!data) return null;

    const parsed = JSON.parse(data) as FoodProduct;
    if (parsed && typeof parsed.nama_makanan === "string") {
      return parsed;
    }
    return null;
  } catch (error) {
    console.warn("[Redis] Error reading cache for barcode:", barcode, error);
    return null;
  }
}

/**
 * Save food product data to global Redis cache with TTL.
 */
export async function setFoodToCache(
  barcode: string,
  product: FoodProduct,
  ttlSeconds: number = DEFAULT_FOOD_CACHE_TTL
): Promise<void> {
  if (!redis) return;

  try {
    const key = getFoodCacheKey(barcode);
    await redis.set(key, JSON.stringify(product), "EX", ttlSeconds);
  } catch (error) {
    console.warn("[Redis] Error writing cache for barcode:", barcode, error);
  }
}
