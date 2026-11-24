import { type NextRequest, NextResponse } from "next/server"
import { verifyPaymentByEmail } from "@/app/actions/stripe"
import { createAccessToken } from "@/lib/access-token"

// Restore access on a new device by payment email.
// On success it returns a signed access token, the same one checkout issues.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const result = await verifyPaymentByEmail(email)
    if (!result.success || !result.sessionId) {
      return NextResponse.json({ success: false, message: result.message })
    }

    const accessToken = createAccessToken(result.email || email, result.sessionId)
    return NextResponse.json({ success: true, message: result.message, accessToken })
  } catch (error) {
    console.error("Error in verify-payment route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
