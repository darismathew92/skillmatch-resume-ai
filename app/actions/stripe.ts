"use server"

import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { PRODUCTS } from "@/lib/products"

export async function startCheckoutSession(productId: string, email?: string) {
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  // Create Checkout Sessions for one-time payment
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    customer_email: email, // Capture email for verification
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      productId: productId,
      purchaseType: "unlimited-access",
    },
  })

  return session.client_secret
}

function isPaidUnlimitedSession(session: Stripe.Checkout.Session): boolean {
  return session.payment_status === "paid" && session.metadata?.purchaseType === "unlimited-access"
}

function sessionEmail(session: Stripe.Checkout.Session): string {
  return session.customer_details?.email || session.customer_email || ""
}

// Confirms one specific checkout with Stripe (used right after payment).
export async function verifyCheckoutSession(
  sessionId: string,
): Promise<{ success: boolean; email?: string; sessionId?: string; message: string }> {
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return { success: false, message: "Invalid checkout session" }
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!isPaidUnlimitedSession(session)) {
      return { success: false, message: "Payment not completed" }
    }
    return { success: true, email: sessionEmail(session), sessionId: session.id, message: "Payment verified" }
  } catch (error) {
    console.error("Error verifying checkout session:", error)
    return { success: false, message: "Error verifying payment" }
  }
}

// Finds a past paid checkout by email (used to restore access on a new device).
export async function verifyPaymentByEmail(
  email: string,
): Promise<{ success: boolean; email?: string; sessionId?: string; message: string }> {
  try {
    const normalized = email.trim()

    // Paid checkouts by this email. Covers guest checkouts, which never
    // create a Stripe customer, so a customer lookup alone would miss them.
    const sessions = await stripe.checkout.sessions.list({
      customer_details: { email: normalized },
      limit: 100,
    })

    const paid = sessions.data.find(isPaidUnlimitedSession)
    if (paid) {
      return { success: true, email: normalized, sessionId: paid.id, message: "Payment verified successfully" }
    }

    return { success: false, message: "No payment found for this email" }
  } catch (error) {
    console.error("Error verifying payment:", error)
    return { success: false, message: "Error verifying payment" }
  }
}
