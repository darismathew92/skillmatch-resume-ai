import "server-only"
import { createHmac, timingSafeEqual } from "crypto"

// Signed "paid access" tokens.
// The server only issues one after confirming a real paid Stripe checkout,
// and every API route verifies the signature. The browser can store the
// token but can't forge one, unlike the old localStorage "true" flag.

interface AccessPayload {
  email: string
  sid: string // Stripe Checkout Session id that proved the payment
  iat: number // issued at (ms)
}

function getSecret(): string {
  const secret = process.env.ACCESS_TOKEN_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("ACCESS_TOKEN_SECRET must be set (at least 32 characters)")
  }
  return secret
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url")
}

export function createAccessToken(email: string, sessionId: string): string {
  const payload: AccessPayload = { email, sid: sessionId, iat: Date.now() }
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${data}.${sign(data)}`
}

export function verifyAccessToken(token: string | null | undefined): AccessPayload | null {
  if (!token || typeof token !== "string") return null

  const [data, signature] = token.split(".")
  if (!data || !signature) return null

  try {
    const expected = new TextEncoder().encode(sign(data))
    const given = new TextEncoder().encode(signature)
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
      return null
    }
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as AccessPayload
    if (!payload.sid || !payload.email) return null
    return payload
  } catch {
    return null
  }
}

// True only when the request carries a valid, server-issued access token.
export function hasPaidAccess(req: Request): boolean {
  return verifyAccessToken(req.headers.get("x-access-token")) !== null
}
