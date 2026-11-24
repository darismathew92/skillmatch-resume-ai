import { type NextRequest, NextResponse } from "next/server"
import { verifyCheckoutSession } from "@/app/actions/stripe"
import { createAccessToken } from "@/lib/access-token"

// Called by the checkout page right after payment.
// The server confirms the checkout session with Stripe itself, then issues
// a signed access token. The browser's word is never enough on its own.
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ success: false, message: "Missing checkout session" }, { status: 400 })
    }

    const result = await verifyCheckoutSession(sessionId)
    if (!result.success || !result.sessionId) {
      return NextResponse.json({ success: false, message: result.message }, { status: 402 })
    }

    const accessToken = createAccessToken(result.email || "", result.sessionId)
    return NextResponse.json({ success: true, accessToken, email: result.email })
  } catch (error) {
    console.error("Error in claim-access route:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
