export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
}

// Product catalog for the Skillmatchresume
// Using INR (Indian Rupees) for India support with UPI
export const PRODUCTS: Product[] = [
  {
    id: "unlimited-access",
    name: "Unlimited Access - Lifetime",
    description:
      "Unlimited AI resume customization, PDF generation, and email drafts. One-time payment, lifetime access.",
    priceInCents: 41500, // ₹415 (approximately $4.99 USD, adjusted for India pricing)
  },
]
