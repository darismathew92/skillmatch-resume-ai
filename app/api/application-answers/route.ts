import { generateStructured } from "@/lib/ai"
import { answersSchema, jobPostingSchema, type ApplicationProfile } from "@/lib/job-types"
import { checkFreeTier, recordFreeTierUse } from "@/lib/usage"

export const maxDuration = 30

const MAX_CV_SIZE = 50_000
const MAX_QUESTIONS = 12

// Questions almost every application form asks
const COMMON_QUESTIONS = [
  "Why do you want to work at {company}?",
  "Why are you a good fit for this role?",
  "Describe a relevant project you're proud of.",
  "What is your notice period / earliest start date?",
  "What are your salary expectations?",
  "Are you authorised to work in the job's location, or do you need sponsorship?",
]

const SHAPE = `{"answers":[{"question":"","answer":""}]}`

function profileLines(profile: Partial<ApplicationProfile>): string {
  const labels: Record<keyof ApplicationProfile, string> = {
    fullName: "Name",
    location: "Location",
    noticePeriod: "Notice period / availability",
    salaryExpectation: "Salary expectation",
    workAuthorization: "Work authorisation",
    linkedin: "LinkedIn",
    portfolio: "Portfolio",
    extraNotes: "Other notes",
  }
  return (Object.keys(labels) as (keyof ApplicationProfile)[])
    .map((key) => {
      const value = typeof profile[key] === "string" ? profile[key]!.trim().slice(0, 500) : ""
      return `${labels[key]}: ${value || "NOT PROVIDED"}`
    })
    .join("\n")
}

// Drafts answers to an application's questions, grounded in the CV and the
// facts the user saved in their profile.
export async function POST(req: Request) {
  try {
    const limited = await checkFreeTier(req)
    if (limited) return limited

    const body = await req.json()
    const cvData = typeof body.cvData === "string" ? body.cvData : ""
    const parsedJob = jobPostingSchema.safeParse(body.job)
    const profile: Partial<ApplicationProfile> = body.profile && typeof body.profile === "object" ? body.profile : {}
    const extra: string[] = Array.isArray(body.questions)
      ? body.questions.filter((q: unknown) => typeof q === "string" && q.trim()).map((q: string) => q.trim().slice(0, 300))
      : []

    if (!cvData.trim() || !parsedJob.success) {
      return Response.json({ error: "MISSING_INPUT", message: "Upload your CV and add a job first." }, { status: 400 })
    }
    if (cvData.length > MAX_CV_SIZE) {
      return Response.json({ error: "INPUT_TOO_LARGE", message: "Your CV text is too long." }, { status: 400 })
    }

    const job = parsedJob.data
    const company = job.company || "this company"
    const questions = Array.from(
      new Set([...job.applicationQuestions, ...extra, ...COMMON_QUESTIONS.map((q) => q.replace("{company}", company))]),
    ).slice(0, MAX_QUESTIONS)

    const { answers } = await generateStructured({
      schema: answersSchema,
      shapeHint: SHAPE,
      temperature: 0.6,
      maxOutputTokens: 4000,
      system:
        "You help a candidate answer job application questions in their own voice: first person, warm, specific and concise. You never invent facts, numbers, employers, dates or skills that aren't in the CV or profile.",
      prompt: `Write an answer for each question below, in the same order, copying each question exactly.

Rules:
- 60-150 words per answer unless the question needs only a short fact.
- Use concrete evidence from the CV (projects, results, tech) where relevant.
- For facts that come from the profile (notice period, salary, work authorisation, location): use the profile value. If it says NOT PROVIDED, write a short answer with a placeholder in square brackets, e.g. "[your notice period]". Never guess these.
- For "why this company": use what the job posting says about the role and company; don't invent company facts.
- No clichés like "I am writing to express my interest". No markdown.

QUESTIONS:
${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

JOB:
Title: ${job.title}
Company: ${company}
Location: ${job.location || "not stated"} (${job.workMode})
Summary: ${job.summary}
Requirements:
- ${job.requirements.join("\n- ") || "not listed"}

CANDIDATE PROFILE:
${profileLines(profile)}

CANDIDATE CV:
${cvData}`,
    })

    await recordFreeTierUse(req)
    return Response.json({ answers: answers.filter((a) => a.question && a.answer) })
  } catch (error) {
    console.error("[application-answers] failed:", error)
    return Response.json(
      { error: "AI_ERROR", message: "Couldn't draft answers right now. Please try again in a minute." },
      { status: 503 },
    )
  }
}
