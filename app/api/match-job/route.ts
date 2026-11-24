import { generateStructured } from "@/lib/ai"
import { blendScore, keywordCoverage } from "@/lib/keywords"
import { jobPostingSchema, matchReportSchema, type MatchResult } from "@/lib/job-types"

export const maxDuration = 30

const MAX_CV_SIZE = 50_000

const SHAPE = `{"score":0,"verdict":"strong|good|partial|weak","headline":"","strengths":[{"point":"","evidence":""}],"gaps":[{"skill":"","severity":"critical|moderate|minor","suggestion":""}],"recommendation":""}`

// Scores how well the CV fits a job: an honest AI assessment anchored by a
// deterministic check of which required skills actually appear in the CV.
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const cvData = typeof body.cvData === "string" ? body.cvData : ""
    const parsedJob = jobPostingSchema.safeParse(body.job)

    if (!cvData.trim() || !parsedJob.success) {
      return Response.json({ error: "MISSING_INPUT", message: "Upload your CV and add a job first." }, { status: 400 })
    }
    if (cvData.length > MAX_CV_SIZE) {
      return Response.json({ error: "INPUT_TOO_LARGE", message: "Your CV text is too long." }, { status: 400 })
    }

    const job = parsedJob.data
    const keywords = keywordCoverage(cvData, job.skills)

    const report = await generateStructured({
      schema: matchReportSchema,
      shapeHint: SHAPE,
      temperature: 0.2,
      maxOutputTokens: 2500,
      system:
        "You are a blunt, fair technical recruiter. You judge fit only from evidence in the CV. You never flatter. A score of 80+ means a recruiter would very likely shortlist this person; 50 means borderline; under 35 means they shouldn't spend time applying.",
      prompt: `Assess how well this candidate fits the job.

Scoring guide:
- Weigh must-have requirements far more than nice-to-haves.
- Count a skill as present only if the CV shows it (a project, role or listed skill). Related experience can earn partial credit.
- Seniority and years of experience matter.

Return:
- "score": 0-100.
- "verdict": strong (80+), good (65-79), partial (45-64), weak (under 45).
- "headline": one honest sentence.
- "strengths": up to 5, each with the CV evidence.
- "gaps": up to 6 most important gaps, each with severity and a concrete suggestion (how to address it in the application, or how to learn it fast).
- "recommendation": 2-3 sentences on whether to apply and what to emphasise.

Keyword check already done in code (for reference):
Found in CV: ${keywords.matched.join(", ") || "none"}
Not found in CV: ${keywords.missing.join(", ") || "none"}

JOB:
Title: ${job.title}
Company: ${job.company}
Seniority: ${job.seniority || "not stated"}
Requirements:
- ${job.requirements.join("\n- ") || "not listed"}
Nice to have:
- ${job.niceToHave.join("\n- ") || "none"}
Skills: ${job.skills.join(", ") || "not listed"}
Summary: ${job.summary}

CANDIDATE CV:
${cvData}`,
    })

    const score = blendScore(report.score, keywords.coverage, job.skills.length)
    const result: MatchResult = {
      ...report,
      aiScore: Math.round(report.score),
      score,
      // Verdict follows the final blended score so the label and number always agree
      verdict: score >= 80 ? "strong" : score >= 65 ? "good" : score >= 45 ? "partial" : "weak",
      keywordCoverage: keywords.coverage,
      keywordsMatched: keywords.matched,
      keywordsMissing: keywords.missing,
    }

    return Response.json({ match: result })
  } catch (error) {
    console.error("[match-job] failed:", error)
    return Response.json(
      { error: "AI_ERROR", message: "Couldn't score this job right now. Please try again in a minute." },
      { status: 503 },
    )
  }
}
