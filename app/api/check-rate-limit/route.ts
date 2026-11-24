import { checkRateLimit, getClientIdentifier, cleanupOldEntries } from "@/lib/rate-limit"
import { hasPaidAccess } from "@/lib/access-token"

export async function POST(req: Request) {
  try {
    // Paid access is checked from the server-signed token, not the request body
    if (hasPaidAccess(req)) {
      return Response.json({
        allowed: true,
        remaining: 999,
        unlimited: true,
      })
    }

    // Cleanup old entries (in-memory fallback only)
    cleanupOldEntries()

    // Get client identifier
    const identifier = getClientIdentifier(req)

    // Check rate limit
    const result = await checkRateLimit(identifier)

    return Response.json({
      allowed: result.allowed,
      remaining: result.remaining,
      reason: result.reason,
      unlimited: false,
    })
  } catch (error) {
    console.error("Rate limit check error:", error)
    return Response.json({ error: "Failed to check rate limit" }, { status: 500 })
  }
}
