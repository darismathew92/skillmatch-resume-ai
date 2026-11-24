import { generateStructured } from "@/lib/ai"
import { buildJobSourceText, fetchJobPage, JobPageError } from "@/lib/job-page"
import { jobPostingSchema } from "@/lib/job-types"

export const maxDuration = 30

const MAX_PASTE = 20_000
const MIN_USEFUL_TEXT = 250

const SHAPE = `{"title":"","company":"","location":"","workMode":"remote|hybrid|onsite|unknown","employmentType":"","salary":"","seniority":"","summary":"","responsibilities":[""],"requirements":[""],"niceToHave":[""],"skills":[""],"applicationQuestions":[""]}`

// Reads a job posting from a link or pasted text and returns it as structured data.
export async function POST(req: Request) {
  try {
    const { url, text } = (await req.json()) as { url?: string; text?: string }

    let sourceText = ""
    let finalUrl = ""

    if (text && text.trim()) {
      if (text.length > MAX_PASTE) {
        return Response.json({ error: "INPUT_TOO_LARGE", message: "That description is too long. Trim it to the job details." }, { status: 400 })
      }
      sourceText = text.trim()
      finalUrl = typeof url === "string" ? url.trim() : ""
    } else if (url && url.trim()) {
      try {
        const page = await fetchJobPage(url)
        finalUrl = page.finalUrl
        sourceText = buildJobSourceText(page.html).text
      } catch (error) {
        if (error instanceof JobPageError) {
          const status = error.code === "INVALID_URL" || error.code === "BLOCKED_URL" ? 400 : 422
          return Response.json({ error: error.code, message: error.message }, { status })
        }
        throw error
      }
    } else {
      return Response.json({ error: "MISSING_INPUT", message: "Add a job link or paste the job description." }, { status: 400 })
    }

    // Sign-in walls and app-only pages return almost no readable text
    if (sourceText.replace(/\s+/g, " ").length < MIN_USEFUL_TEXT) {
      return Response.json(
        {
          error: "NEEDS_PASTE",
          message: "We couldn't read enough of that page (sites like LinkedIn often hide jobs behind a sign-in). Paste the job description instead.",
        },
        { status: 422 },
      )
    }

    const job = await generateStructured({
      schema: jobPostingSchema,
      shapeHint: SHAPE,
      temperature: 0.1,
      maxOutputTokens: 3000,
      system:
        "You extract job postings into structured data. Use only information present in the source. Never invent a salary, location or requirement. Use empty strings or empty lists for anything not stated.",
      prompt: `Extract this job posting.

Rules:
- "skills": distinct technical skills, languages, frameworks and tools, as short names (e.g. "React", "Laravel", "AWS"). Max 25.
- "requirements": must-have requirements as short bullet sentences. Max 12.
- "niceToHave": optional or preferred items. Max 8.
- "responsibilities": max 10 short bullets.
- "applicationQuestions": only questions the posting explicitly asks applicants to answer.
- If the page contains several jobs or lots of unrelated text, extract the main job only.

SOURCE:
${sourceText}`,
    })

    if (!job.title) {
      return Response.json(
        { error: "NEEDS_PASTE", message: "We couldn't find a job on that page. Paste the job description instead." },
        { status: 422 },
      )
    }

    return Response.json({ job, sourceUrl: finalUrl })
  } catch (error) {
    console.error("[extract-job] failed:", error)
    return Response.json(
      { error: "AI_ERROR", message: "Couldn't read that job right now. Please try again in a minute." },
      { status: 503 },
    )
  }
}
