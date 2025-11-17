"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import Checkout from "../components/checkout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PRODUCTS } from "@/lib/products"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { analytics } from "@/lib/analytics"

export default function UnlockPage() {
  const router = useRouter()
  const [restoreEmail, setRestoreEmail] = useState("")
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [restoreMessage, setRestoreMessage] = useState("")

  const handleRestoreAccess = async () => {
    if (!restoreEmail || !restoreEmail.includes("@")) {
      setRestoreMessage("Please enter a valid email address")
      return
    }

    setRestoreLoading(true)
    setRestoreMessage("")

    try {
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: restoreEmail }),
      })

      const result = await response.json()

      if (result.success) {
        localStorage.setItem("hasUnlimitedAccess", "true")
        localStorage.setItem("purchaseEmail", restoreEmail)

        analytics.trackAccessRestored()

        setRestoreMessage("Access restored! Redirecting...")
        setTimeout(() => router.push("/app"), 1500)
      } else {
        setRestoreMessage(result.message || "No payment found for this email")
      }
    } catch (error) {
      setRestoreMessage("Error verifying payment. Please try again.")
    } finally {
      setRestoreLoading(false)
    }
  }

  const product = PRODUCTS[0]
  const priceInINR = (product.priceInCents / 100).toFixed(2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="mb-2 sm:mb-3 text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-2">
            Unlock Unlimited Access
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            One-time payment. Lifetime access. No subscriptions.
          </p>
          <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
            <p className="text-xs sm:text-sm text-blue-800">
              <span className="font-semibold">Currently:</span> You get 5 free generations per day.
              <br />
              <span className="font-semibold">Upgrade for:</span> Unlimited generations, forever!
            </p>
          </div>
        </div>

        <Card className="mb-6 sm:mb-8 border-2 border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Already Purchased?</CardTitle>
            <CardDescription className="text-sm sm:text-base">Restore your access by entering your payment email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="restore-email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="restore-email"
                  type="email"
                  placeholder="your@email.com"
                  value={restoreEmail}
                  onChange={(e) => setRestoreEmail(e.target.value)}
                  disabled={restoreLoading}
                  className="h-11 text-base"
                />
              </div>
              <Button onClick={handleRestoreAccess} disabled={restoreLoading} className="sm:w-auto h-11">
                {restoreLoading ? "Verifying..." : "Restore Access"}
              </Button>
            </div>
            {restoreMessage && (
              <p
                className={`mt-3 text-xs sm:text-sm ${
                  restoreMessage.includes("restored") || restoreMessage.includes("Redirecting")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {restoreMessage}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <Card className="border-2">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl">What You Get</CardTitle>
              <CardDescription className="text-sm sm:text-base">Everything you need to land your dream job</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-xl sm:text-2xl flex-shrink-0">✨</span>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Unlimited AI Resume Customization</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Tailor your resume for every job application</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl sm:text-2xl flex-shrink-0">📄</span>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Beautiful PDF Generation</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Professional, ATS-friendly PDF resumes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl sm:text-2xl flex-shrink-0">✉️</span>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Application Email Drafts</h3>
                  <p className="text-xs sm:text-sm text-gray-600">AI-powered cover emails for every application</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl sm:text-2xl flex-shrink-0">🚀</span>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Lifetime Access</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Pay once, use forever. No recurring fees.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl sm:text-2xl flex-shrink-0">🇮🇳</span>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">India-Friendly Payments</h3>
                  <p className="text-xs sm:text-sm text-gray-600">UPI, cards, and all Indian payment methods supported</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl">One-Time Payment</CardTitle>
              <CardDescription className="text-sm sm:text-base">No subscriptions. No hidden fees.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4 sm:mb-6">
                <div className="text-4xl sm:text-5xl font-bold text-blue-600 mb-2">₹{priceInINR}</div>
                <div className="text-xs sm:text-sm text-gray-600">Approximately $4.99 USD</div>
                <div className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                  Lifetime Access
                </div>
              </div>
              <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-base">✓</span>
                  <span>Unlimited resume generations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-base">✓</span>
                  <span>Unlimited PDF exports</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-base">✓</span>
                  <span>Unlimited email drafts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-base">✓</span>
                  <span>All future updates included</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl text-center">Complete Your Purchase</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Secure payment powered by Stripe. Supports UPI, cards, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Checkout productId="unlimited-access" />
          </CardContent>
        </Card>

        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-600 px-4">
          <p>Secured by Stripe. Your payment information is encrypted and secure.</p>
        </div>
      </div>
    </div>
  )
}
