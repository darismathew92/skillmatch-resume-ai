import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const rateLimit = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10 // 10 requests per minute per IP

export function proxy(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    const now = Date.now()

    const userLimit = rateLimit.get(ip)

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or create new rate limit entry
      rateLimit.set(ip, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      })
    } else {
      // Increment request count
      userLimit.count++

      if (userLimit.count > MAX_REQUESTS) {
        return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
      }
    }

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      // 1% chance to clean up
      for (const [key, value] of rateLimit.entries()) {
        if (now > value.resetTime) {
          rateLimit.delete(key)
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
