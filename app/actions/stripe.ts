"use server"

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

export async function verifyPaymentByEmail(email: string) {
  try {
    // Search for customers with this email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    })

    if (customers.data.length === 0) {
      return { success: false, message: "No payment found for this email" }
    }

    const customer = customers.data[0]

    // Check for successful payment intents
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customer.id,
      limit: 100,
    })

    // Check if any payment was successful and has the unlimited-access metadata
    const hasValidPayment = paymentIntents.data.some(
      (pi) => pi.status === "succeeded" && pi.metadata.purchaseType === "unlimited-access",
    )

    if (hasValidPayment) {
      return { success: true, message: "Payment verified successfully" }
    }

    return { success: false, message: "No valid payment found" }
  } catch (error) {
    console.error("Error verifying payment:", error)
    return { success: false, message: "Error verifying payment" }
  }
}
