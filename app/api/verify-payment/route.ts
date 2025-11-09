import { type NextRequest, NextResponse } from "next/server"
import { verifyPaymentByEmail } from "@/app/actions/stripe"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const result = await verifyPaymentByEmail(email)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in verify-payment route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
