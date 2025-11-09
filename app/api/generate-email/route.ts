import { generateText } from "ai"
import { checkRateLimit, getClientIdentifier, incrementUsage, cleanupOldEntries } from "@/lib/rate-limit"
import { ENABLE_FREE_TIER_LIMITS } from "@/lib/config"

export const maxDuration = 30

const MAX_CV_SIZE = 50000
const MAX_JOB_DESC_SIZE = 10000

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cvData, jobDetails, hasUnlimitedAccess } = body

    if (ENABLE_FREE_TIER_LIMITS && !hasUnlimitedAccess) {
      cleanupOldEntries()
      const identifier = getClientIdentifier(req)
      const rateCheck = checkRateLimit(identifier)

      if (!rateCheck.allowed) {
        return Response.json(
          {
            error: "RATE_LIMIT_EXCEEDED",
            message: rateCheck.reason,
            remaining: 0,
          },
          { status: 429 },
        )
      }
    }

    // Validate input sizes to prevent abuse
    if (!cvData || !jobDetails) {
      return Response.json({ error: "Missing required fields: cvData and jobDetails" }, { status: 400 })
    }

    const cvDataStr = typeof cvData === "string" ? cvData : JSON.stringify(cvData)
    const jobDescStr = jobDetails.description || ""

    if (cvDataStr.length > MAX_CV_SIZE) {
      return Response.json({ error: "CV data too large. Maximum size is 50KB" }, { status: 413 })
    }

    if (jobDescStr.length > MAX_JOB_DESC_SIZE) {
      return Response.json({ error: "Job description too large. Maximum size is 10KB" }, { status: 413 })
    }

    const cvText = cvDataStr
    const jobText = `Job Title: ${jobDetails.title}\nCompany: ${jobDetails.company || "Not specified"}\nDescription: ${jobDetails.description}\nRequirements: ${jobDetails.requirements || "Not specified"}`

    const prompt = `You are an expert career consultant and professional email writer. Your task is to write a compelling job application email.

Given the following candidate information:
${cvText}

And the following job details:
${jobText}

Please write a professional, engaging job application email that:
1. Has a clear, professional subject line
2. Addresses the hiring manager professionally (use "Dear Hiring Manager" if company name not specified)
3. Opens with a strong hook that shows enthusiasm and relevance
4. Highlights 2-3 key qualifications that match the job requirements
5. Shows knowledge of the company (if company name is provided)
6. Expresses genuine interest in the role
7. Includes a clear call to action
8. Maintains a professional yet personable tone
9. Is concise (250-350 words in the body)
10. Ends with professional sign-off

Format the email with:
- Subject line at the top
- Proper greeting
- Well-structured body paragraphs
- Professional closing
- Candidate's name and contact info as signature

Make it compelling, authentic, and tailored to this specific opportunity.`

    const { text } = await generateText({
      model: "meta/llama-3.1-8b",
      prompt,
      maxTokens: 2000,
      temperature: 0.7,
      providerOptions: {
        gateway: {
          order: ["groq", "fireworks", "together"], // Try Groq first (free), then fallback to paid providers
        },
      },
    })

    if (ENABLE_FREE_TIER_LIMITS && !hasUnlimitedAccess) {
      const identifier = getClientIdentifier(req)
      incrementUsage(identifier)
    }

    return Response.json({ email: text })
  } catch (error: any) {
    return Response.json(
      {
        error: "AI_ERROR",
        message: "🚫 AI Service is temporarily unavailable. Please try again in a few minutes.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    )
  }
}
