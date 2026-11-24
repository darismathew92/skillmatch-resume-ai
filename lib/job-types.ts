import { z } from "zod"

// Shared shapes for the job application workflow.
// Strings default to "" and lists to [] so a model that omits an unknown
// field still produces a valid object.

const text = z.string().default("")
const list = z.array(z.string()).default([])

export const jobPostingSchema = z.object({
  title: text.describe("Job title"),
  company: text.describe("Hiring company name"),
  location: text.describe("City/country, or empty if not stated"),
  workMode: z.enum(["remote", "hybrid", "onsite", "unknown"]).default("unknown"),
  employmentType: text.describe("e.g. Full-time, Contract; empty if not stated"),
  salary: text.describe("Salary exactly as stated, or empty if not stated. Never guess."),
  seniority: text.describe("e.g. Junior, Mid, Senior; empty if unclear"),
  summary: text.describe("2-3 sentence plain summary of the role"),
  responsibilities: list,
  requirements: list.describe("Must-have requirements"),
  niceToHave: list,
  skills: list.describe("Distinct technical skills and tools named in the posting, short names like 'React', 'PostgreSQL'"),
  applicationQuestions: list.describe("Questions the posting explicitly asks applicants to answer"),
})
export type JobPosting = z.infer<typeof jobPostingSchema>

export const matchReportSchema = z.object({
  score: z.coerce.number().min(0).max(100).describe("Overall fit 0-100, honest"),
  verdict: z.enum(["strong", "good", "partial", "weak"]).default("partial"),
  headline: text.describe("One sentence summary of the fit"),
  strengths: z
    .array(z.object({ point: text, evidence: text.describe("Where in the CV this is shown") }))
    .default([]),
  gaps: z
    .array(
      z.object({
        skill: text,
        severity: z.enum(["critical", "moderate", "minor"]).default("moderate"),
        suggestion: text.describe("Concrete way to close or address the gap"),
      }),
    )
    .default([]),
  recommendation: text.describe("Whether to apply and what to emphasise"),
})
export type MatchReport = z.infer<typeof matchReportSchema>

// What the API returns: the AI report plus a deterministic keyword check
export interface MatchResult extends MatchReport {
  aiScore: number
  keywordCoverage: number // 0-100, share of the job's skills found in the CV
  keywordsMatched: string[]
  keywordsMissing: string[]
}

export const answersSchema = z.object({
  answers: z.array(z.object({ question: text, answer: text })).default([]),
})
export type ApplicationAnswer = z.infer<typeof answersSchema>["answers"][number]

// Facts the user provides once, so answers use real details instead of guesses
export interface ApplicationProfile {
  fullName: string
  location: string
  noticePeriod: string
  salaryExpectation: string
  workAuthorization: string
  linkedin: string
  portfolio: string
  extraNotes: string
}

export const emptyProfile: ApplicationProfile = {
  fullName: "",
  location: "",
  noticePeriod: "",
  salaryExpectation: "",
  workAuthorization: "",
  linkedin: "",
  portfolio: "",
  extraNotes: "",
}

// Converts a structured posting into the {title, company, description, requirements}
// shape the existing resume / email / PDF routes already accept.
export function toLegacyJobDetails(job: JobPosting) {
  const description = [
    job.summary,
    job.responsibilities.length ? `Responsibilities:\n- ${job.responsibilities.join("\n- ")}` : "",
    job.niceToHave.length ? `Nice to have:\n- ${job.niceToHave.join("\n- ")}` : "",
    job.location ? `Location: ${job.location} (${job.workMode})` : "",
  ]
    .filter(Boolean)
    .join("\n\n")

  const requirements = [
    job.requirements.length ? `- ${job.requirements.join("\n- ")}` : "",
    job.skills.length ? `Skills: ${job.skills.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n")

  return {
    title: job.title,
    company: job.company,
    description: description.slice(0, 9000),
    requirements: requirements.slice(0, 4000),
  }
}
