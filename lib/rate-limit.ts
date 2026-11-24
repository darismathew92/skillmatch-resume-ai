import { getRedis } from "@/lib/redis"

// Daily free-tier counter.
// Stored in Redis so every serverless instance shares the same count and it
// survives deploys. Falls back to an in-memory Map when Redis isn't configured
// (local dev only - in-memory counts reset on deploy and aren't shared).

interface UsageRecord {
  count: number
  date: string // YYYY-MM-DD
}

const memoryStore = new Map<string, UsageRecord>()

const FREE_DAILY_LIMIT = 5
const KEY_TTL_SECONDS = 2 * 24 * 60 * 60 // keep each day's key for 2 days, then Redis deletes it

export function getClientIdentifier(req: Request): string {
  // Combine IP address with fingerprint from headers
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
  const userAgent = req.headers.get("user-agent") || "unknown"
  const fingerprint = req.headers.get("x-fingerprint") || ""

  // Create a composite key
  return `${ip}:${fingerprint}:${userAgent.substring(0, 50)}`
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]
}

function usageKey(identifier: string): string {
  return `freetier:${getTodayDate()}:${identifier}`
}

async function getUsageCount(identifier: string): Promise<number> {
  const redis = getRedis()
  if (redis) {
    const count = await redis.get<number>(usageKey(identifier))
    return Number(count) || 0
  }

  const record = memoryStore.get(identifier)
  return record && record.date === getTodayDate() ? record.count : 0
}

export async function checkRateLimit(identifier: string): Promise<{
  allowed: boolean
  remaining: number
  reason?: string
}> {
  const count = await getUsageCount(identifier)
  const remaining = Math.max(0, FREE_DAILY_LIMIT - count)

  if (count >= FREE_DAILY_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      reason: "Daily free limit reached. Upgrade for unlimited access or try again tomorrow!",
    }
  }

  return { allowed: true, remaining }
}

// Called only after a successful generation, so failed AI calls don't use up a free credit.
export async function incrementUsage(identifier: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    const key = usageKey(identifier)
    await redis.incr(key)
    await redis.expire(key, KEY_TTL_SECONDS)
    return
  }

  const today = getTodayDate()
  const record = memoryStore.get(identifier)
  if (!record || record.date !== today) {
    memoryStore.set(identifier, { count: 1, date: today })
  } else {
    record.count++
  }
}

export async function getRemainingGenerations(identifier: string): Promise<number> {
  const check = await checkRateLimit(identifier)
  return check.remaining
}

// Only needed for the in-memory fallback; Redis keys expire on their own.
export function cleanupOldEntries(): void {
  const today = getTodayDate()
  for (const [key, record] of memoryStore.entries()) {
    if (record.date !== today) {
      memoryStore.delete(key)
    }
  }
}
