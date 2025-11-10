"use client"

import { useCallback, useState } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { startCheckoutSession } from "../actions/stripe"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { analytics } from "@/lib/analytics"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function Checkout({ productId, onSuccess }: { productId: string; onSuccess?: () => void }) {
  const [isComplete, setIsComplete] = useState(false)
  const [email, setEmail] = useState("")
  const [showCheckout, setShowCheckout] = useState(false)

  const startCheckoutSessionForProduct = useCallback(() => startCheckoutSession(productId, email), [productId, email])

  return (
    <div id="checkout" className="w-full max-w-2xl mx-auto">
      {!isComplete ? (
        <>
          {!showCheckout ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Enter Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-base"
                  required
                />
                <p className="text-sm text-gray-600">
                  We'll use this email to verify your payment if you need to restore access.
                </p>
              </div>
              <Button
                onClick={() => {
                  if (email && email.includes("@")) {
                    analytics.trackPaymentInitiated()
                    setShowCheckout(true)
                  } else {
                    alert("Please enter a valid email address")
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Continue to Payment
              </Button>
            </div>
          ) : (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{
                fetchClientSecret: startCheckoutSessionForProduct,
                onComplete: () => {
                  setIsComplete(true)
                  localStorage.setItem("hasUnlimitedAccess", "true")
                  localStorage.setItem("purchaseEmail", email)
                  localStorage.setItem("purchaseDate", new Date().toISOString())

                  analytics.trackPaymentCompleted(email)

                  if (onSuccess) {
                    onSuccess()
                  }
                },
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </>
      ) : (
        <div className="text-center p-8 bg-green-50 rounded-lg border-2 border-green-200">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
          <p className="text-green-700 mb-4">You now have unlimited lifetime access to the ResumeAlign.</p>
          <p className="text-sm text-gray-600 mb-4">
            We've saved your access to: <strong>{email}</strong>
          </p>
          <button
            onClick={() => (window.location.href = "/app")}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Start Using the App
          </button>
        </div>
      )}
    </div>
  )
}
