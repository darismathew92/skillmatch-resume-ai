import "server-only"
import { ENABLE_FREE_TIER_LIMITS } from "@/lib/config"
import { hasPaidAccess } from "@/lib/access-token"
import { checkRateLimit, cleanupOldEntries, getClientIdentifier, incrementUsage } from "@/lib/rate-limit"

// Same free-tier rules as the resume/email/PDF routes, shared by the job workflow routes.
// Returns a 429 response when the daily free limit is used up, otherwise null.
export async function checkFreeTier(req: Request): Promise<Response | null> {
  if (!ENABLE_FREE_TIER_LIMITS || hasPaidAccess(req)) return null

  cleanupOldEntries()
  const result = await checkRateLimit(getClientIdentifier(req))
  if (result.allowed) return null

  return Response.json({ error: "RATE_LIMIT_EXCEEDED", message: result.reason, remaining: 0 }, { status: 429 })
}

// Counts one generation, only after it succeeded.
export async function recordFreeTierUse(req: Request): Promise<void> {
  if (!ENABLE_FREE_TIER_LIMITS || hasPaidAccess(req)) return
  await incrementUsage(getClientIdentifier(req))
}
