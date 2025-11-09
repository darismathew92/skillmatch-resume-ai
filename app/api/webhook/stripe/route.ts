import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = (await headers()).get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log("[v0] Stripe webhook event:", event.type)

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object

      console.log("[v0] Payment successful for:", session.customer_email)
      console.log("[v0] Session metadata:", session.metadata)

      // You could send a confirmation email here if needed
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[v0] Webhook error:", err)
    return NextResponse.json({ error: "Webhook error" }, { status: 400 })
  }
}
