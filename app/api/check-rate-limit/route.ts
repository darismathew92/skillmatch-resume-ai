import { checkRateLimit, getClientIdentifier, cleanupOldEntries } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Check if user has unlimited access
    const body = await req.json()
    const { hasUnlimitedAccess } = body

    if (hasUnlimitedAccess) {
      return Response.json({
        allowed: true,
        remaining: 999,
        unlimited: true,
      })
    }

    // Cleanup old entries
    cleanupOldEntries()

    // Get client identifier
    const identifier = getClientIdentifier(req)

    // Check rate limit
    const result = checkRateLimit(identifier)

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
