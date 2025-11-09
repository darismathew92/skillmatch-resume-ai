interface UsageRecord {
  count: number
  date: string // YYYY-MM-DD
  lastReset: number
}

// In-memory storage (resets on deployment, but better than localStorage)
const usageStore = new Map<string, UsageRecord>()

const FREE_DAILY_LIMIT = 5
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000 // 24 hours in ms

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

export function checkRateLimit(identifier: string): {
  allowed: boolean
  remaining: number
  reason?: string
} {
  const today = getTodayDate()
  const now = Date.now()

  let record = usageStore.get(identifier)

  // Reset if new day or no record
  if (!record || record.date !== today || now - record.lastReset > RATE_LIMIT_WINDOW) {
    record = {
      count: 0,
      date: today,
      lastReset: now,
    }
    usageStore.set(identifier, record)
  }

  const remaining = Math.max(0, FREE_DAILY_LIMIT - record.count)

  if (record.count >= FREE_DAILY_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      reason: "Daily free limit reached. Upgrade for unlimited access or try again tomorrow!",
    }
  }

  return {
    allowed: true,
    remaining,
  }
}

export function incrementUsage(identifier: string): void {
  const today = getTodayDate()
  const now = Date.now()

  let record = usageStore.get(identifier)

  if (!record || record.date !== today) {
    record = {
      count: 1,
      date: today,
      lastReset: now,
    }
  } else {
    record.count++
  }

  usageStore.set(identifier, record)
}

export function getRemainingGenerations(identifier: string): number {
  const check = checkRateLimit(identifier)
  return check.remaining
}

// Cleanup old entries periodically (run on each check)
export function cleanupOldEntries(): void {
  const today = getTodayDate()
  for (const [key, record] of usageStore.entries()) {
    if (record.date !== today) {
      usageStore.delete(key)
    }
  }
}
