import { generateText } from "ai"
import { checkRateLimit, getClientIdentifier, incrementUsage, cleanupOldEntries } from "@/lib/rate-limit"
import { ENABLE_FREE_TIER_LIMITS } from "@/lib/config"

export const maxDuration = 30

const MAX_CV_SIZE = 50000
const MAX_JOB_DESC_SIZE = 10000

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cvData, jobDetails, customInstructions, hasUnlimitedAccess } = body

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
    
    const additionalInstructionsText = customInstructions 
      ? `\n\n**SPECIAL USER INSTRUCTIONS (HIGHEST PRIORITY):**\n${customInstructions}\n\nYou MUST follow these user-specific requirements carefully while maintaining professionalism.`
      : ''

    const prompt = `You are an expert resume writer and career consultant. Your task is to customize a resume for a specific job application with DEEP, STRATEGIC customization.

Given the following CV data:
${cvText}

And the following job details:
${jobText}${additionalInstructionsText}

Please create a highly tailored, professional resume that demonstrates EXCEPTIONAL alignment with this role by:

STRATEGIC CUSTOMIZATIONS:
1. **Professional Summary**: Write a compelling 3-4 sentence summary that directly addresses the key requirements of this role, highlighting the candidate's most relevant strengths and experience
2. **Experience Section**: 
   - Rewrite bullet points to emphasize achievements relevant to this specific role
   - Quantify accomplishments wherever possible (percentages, numbers, metrics)
   - Start each bullet with strong action verbs that match the job description's language
   - Highlight projects/responsibilities that directly align with job requirements
3. **Skills Prioritization**:
   - Place the most job-relevant skills prominently at the top
   - Group skills into categories that match the job's technical requirements
   - Include both hard skills and soft skills mentioned in the job description
4. **Keyword Optimization**: Naturally integrate key terms from the job description throughout the resume
5. **Achievement Focus**: Transform generic responsibilities into specific, measurable achievements
6. **Relevance Ranking**: Prioritize and expand on experiences most relevant to this role, while keeping less relevant items brief

FORMATTING REQUIREMENTS:
- Use clear section headers with visual separators (─────────)
- Maintain professional ATS-friendly formatting
- Structure: Contact Info, Professional Summary, Experience, Skills, Education, Certifications
- Keep language professional and impactful

CRITICAL RULES:
- DO NOT mention the company name "${jobDetails.company || ""}" or job title "${jobDetails.title}" in the resume
- DO NOT include disclaimers, warnings, or notes about qualification matches
- DO NOT fabricate experience or skills - only enhance and reframe existing information
- Keep all factual information accurate while optimizing presentation

Make this resume stand out as the perfect candidate for this specific role while maintaining authenticity and professionalism.`

    const { text } = await generateText({
      model: "meta/llama-3.1-8b",
      prompt,
      maxTokens: 4000,
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

    return Response.json({ customizedResume: text })
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
