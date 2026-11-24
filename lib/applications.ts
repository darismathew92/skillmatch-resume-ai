import type { ApplicationAnswer, ApplicationProfile, JobPosting, MatchResult } from "@/lib/job-types"
import { emptyProfile } from "@/lib/job-types"

// Application tracker, stored in this browser (no account needed).

export type ApplicationStatus = "saved" | "ready" | "applied" | "interview" | "offer" | "rejected"

export const STATUS_ORDER: ApplicationStatus[] = ["saved", "ready", "applied", "interview", "offer", "rejected"]

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  ready: "Ready to apply",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
}

export interface JobApplication {
  id: string
  createdAt: string
  updatedAt: string
  sourceUrl: string
  job: JobPosting
  match?: MatchResult
  resume?: string
  email?: string
  answers?: ApplicationAnswer[]
  status: ApplicationStatus
  history: { status: ApplicationStatus; at: string }[]
  appliedAt?: string
  followUpAt?: string
  notes: string
}

const APPS_KEY = "jobApplications"
const PROFILE_KEY = "applicationProfile"
const FOLLOW_UP_DAYS = 7

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function safeWrite(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false // storage full or blocked
  }
}

export function loadApplications(): JobApplication[] {
  const apps = safeRead<JobApplication[]>(APPS_KEY, [])
  return Array.isArray(apps) ? apps : []
}

export function saveApplications(apps: JobApplication[]): boolean {
  return safeWrite(APPS_KEY, apps)
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function createApplication(job: JobPosting, sourceUrl: string): JobApplication {
  const now = new Date().toISOString()
  return {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    sourceUrl,
    job,
    status: "saved",
    history: [{ status: "saved", at: now }],
    notes: "",
  }
}

export function withStatus(app: JobApplication, status: ApplicationStatus): JobApplication {
  if (app.status === status) return app
  const now = new Date()
  const next: JobApplication = {
    ...app,
    status,
    updatedAt: now.toISOString(),
    history: [...app.history, { status, at: now.toISOString() }],
  }
  if (status === "applied") {
    next.appliedAt = app.appliedAt ?? now.toISOString()
    next.followUpAt = new Date(now.getTime() + FOLLOW_UP_DAYS * 86_400_000).toISOString()
  }
  // Once there's a response, no follow-up reminder is needed
  if (status === "interview" || status === "offer" || status === "rejected") next.followUpAt = undefined
  return next
}

export function snoozeFollowUp(app: JobApplication, days = FOLLOW_UP_DAYS): JobApplication {
  return {
    ...app,
    updatedAt: new Date().toISOString(),
    followUpAt: new Date(Date.now() + days * 86_400_000).toISOString(),
  }
}

export function isFollowUpDue(app: JobApplication, now = Date.now()): boolean {
  return app.status === "applied" && !!app.followUpAt && new Date(app.followUpAt).getTime() <= now
}

export function daysSince(iso?: string, now = Date.now()): number | null {
  if (!iso) return null
  return Math.floor((now - new Date(iso).getTime()) / 86_400_000)
}

export function loadProfile(): ApplicationProfile {
  return { ...emptyProfile, ...safeRead<Partial<ApplicationProfile>>(PROFILE_KEY, {}) }
}

export function saveProfile(profile: ApplicationProfile): boolean {
  return safeWrite(PROFILE_KEY, profile)
}

export function loadSavedCV(): string {
  try {
    return localStorage.getItem("savedCV") || ""
  } catch {
    return ""
  }
}
