import { accessHeaders } from "@/lib/free-tier"
import { getStoredFingerprint } from "@/lib/fingerprint"
import type { ApplicationAnswer, ApplicationProfile, JobPosting, MatchResult } from "@/lib/job-types"
import { toLegacyJobDetails } from "@/lib/job-types"

// Browser-side calls for the job workflow. Each throws an ApiError with a
// user-friendly message the UI can show directly.

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message)
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-fingerprint": getStoredFingerprint(),
        ...accessHeaders(),
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError("You seem to be offline. Check your connection and try again.", "NETWORK", 0)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      response.status === 429 && data.error !== "RATE_LIMIT_EXCEEDED"
        ? "Too many requests in a minute. Wait a moment and try again."
        : data.message || data.error || "Something went wrong. Please try again."
    throw new ApiError(message, data.error || "ERROR", response.status)
  }
  return data as T
}

export async function extractJob(input: { url?: string; text?: string }) {
  return post<{ job: JobPosting; sourceUrl: string }>("/api/extract-job", input)
}

export async function scoreMatch(cvData: string, job: JobPosting) {
  const data = await post<{ match: MatchResult }>("/api/match-job", { cvData, job })
  return data.match
}

export async function tailorResume(cvData: string, job: JobPosting, customInstructions = "") {
  const data = await post<{ customizedResume: string }>("/api/customize-resume", {
    cvData,
    jobDetails: toLegacyJobDetails(job),
    customInstructions,
  })
  return data.customizedResume
}

export async function writeEmail(cvData: string, job: JobPosting, customInstructions = "") {
  const data = await post<{ email: string }>("/api/generate-email", {
    cvData,
    jobDetails: toLegacyJobDetails(job),
    customInstructions,
  })
  return data.email
}

export async function draftAnswers(
  cvData: string,
  job: JobPosting,
  profile: ApplicationProfile,
  questions: string[] = [],
): Promise<ApplicationAnswer[]> {
  const data = await post<{ answers: ApplicationAnswer[] }>("/api/application-answers", {
    cvData,
    job,
    profile,
    questions,
  })
  return data.answers
}

export async function designPdf(resume: string, job: JobPosting) {
  const data = await post<{ htmlResume: string }>("/api/generate-pdf-resume", {
    customizedResume: resume,
    jobDetails: toLegacyJobDetails(job),
    customInstructions: "",
  })
  return data.htmlResume
}
