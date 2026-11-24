import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { getRedis } from "@/lib/redis"

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10 // 10 requests per minute per IP

// Shared limiter in Redis: one count per IP across every serverless instance,
// and it survives deploys. Sliding window, so there's no burst at the minute boundary.
const redis = getRedis()
const limiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "1 m"),
      prefix: "ratelimit:api",
    })
  : null

// In-memory fallback for local dev when Redis isn't configured.
const memoryLimit = new Map<string, { count: number; resetTime: number }>()

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  return forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown"
}

function tooManyRequests(retryAfterSeconds?: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined,
    },
  )
}

function checkMemoryLimit(ip: string): boolean {
  const now = Date.now()
  const entry = memoryLimit.get(ip)

  if (!entry || now > entry.resetTime) {
    memoryLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
  } else {
    entry.count++
    if (entry.count > MAX_REQUESTS) return false
  }

  // Occasionally clear expired entries
  if (Math.random() < 0.01) {
    for (const [key, value] of memoryLimit.entries()) {
      if (now > value.resetTime) memoryLimit.delete(key)
    }
  }
  return true
}

export async function proxy(request: NextRequest) {
  // Stripe calls the webhook from its own servers, so never rate-limit it.
  if (request.nextUrl.pathname.startsWith("/api/webhook/")) {
    return NextResponse.next()
  }

  const ip = getClientIp(request)

  if (limiter) {
    try {
      const { success, reset } = await limiter.limit(ip)
      if (!success) {
        return tooManyRequests(Math.max(1, Math.ceil((reset - Date.now()) / 1000)))
      }
    } catch (error) {
      // If Redis is briefly unreachable, don't take the whole API down.
      console.error("[ratelimit] Redis error, allowing request:", error)
    }
  } else if (!checkMemoryLimit(ip)) {
    return tooManyRequests()
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
