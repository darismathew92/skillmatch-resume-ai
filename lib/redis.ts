import { Redis } from "@upstash/redis"

// One shared Redis client for rate limits and free-tier counters.
// Works with a direct Upstash database (UPSTASH_REDIS_REST_*) or the
// Vercel Marketplace integration (KV_REST_API_*).
// Returns null when Redis isn't configured (e.g. local dev), so callers
// can fall back to in-memory counters.
let client: Redis | null | undefined

export function getRedis(): Redis | null {
  if (client !== undefined) return client

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[redis] not configured - falling back to in-memory rate limits")
    }
    client = null
    return client
  }

  client = new Redis({ url, token })
  return client
}
