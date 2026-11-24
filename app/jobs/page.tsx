"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import {
  createApplication,
  isFollowUpDue,
  loadApplications,
  loadProfile,
  loadSavedCV,
  saveApplications,
  saveProfile,
  snoozeFollowUp,
  STATUS_LABELS,
  withStatus,
  type ApplicationStatus,
  type JobApplication,
} from "@/lib/applications"
import { ApiError, designPdf, draftAnswers, extractJob, scoreMatch, tailorResume, writeEmail } from "@/lib/job-client"
import type { ApplicationProfile } from "@/lib/job-types"
import { emptyProfile } from "@/lib/job-types"
import { AddJob, type AnalyseResult } from "./_components/add-job"
import { ApplicationDetail, type PackPart } from "./_components/application-detail"
import { ApplicationList } from "./_components/application-list"
import { ProfileCard } from "./_components/profile-card"
import type { StepState } from "./_components/ui-bits"

type PackState = Partial<Record<PackPart, StepState>>

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again."
}

function csvCell(value: string | number | undefined): string {
  const s = String(value ?? "")
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export default function JobHubPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [cv, setCv] = useState("")
  const [apps, setApps] = useState<JobApplication[]>([])
  const [profile, setProfile] = useState<ApplicationProfile>(emptyProfile)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [analysing, setAnalysing] = useState(false)
  const [steps, setSteps] = useState<{ label: string; state: StepState }[] | null>(null)
  const [scoring, setScoring] = useState<Set<string>>(new Set())
  const [packs, setPacks] = useState<Record<string, PackState>>({})
  const [pdfBusy, setPdfBusy] = useState<Set<string>>(new Set())
  const [pdfHtml, setPdfHtml] = useState<Record<string, string>>({})
  const detailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loaded = loadApplications()
    setApps(loaded)
    setProfile(loadProfile())
    setCv(loadSavedCV())
    setSelectedId(loaded[0]?.id ?? null)
    setMounted(true)
  }, [])

  // Every change is saved straight away, using the latest state
  const mutateApps = useCallback(
    (fn: (prev: JobApplication[]) => JobApplication[]) => {
      setApps((prev) => {
        const next = fn(prev)
        if (!saveApplications(next)) {
          toast({ title: "Couldn't save", description: "Your browser storage is full or blocked.", variant: "destructive" })
        }
        return next
      })
    },
    [toast],
  )

  const updateApp = useCallback(
    (id: string, fn: (app: JobApplication) => JobApplication) => {
      mutateApps((prev) => prev.map((a) => (a.id === id ? fn(a) : a)))
    },
    [mutateApps],
  )

  const setBusy = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string, on: boolean) =>
    setter((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const select = (id: string) => {
    setSelectedId(id)
    // On phones the detail sits below the list
    if (window.innerWidth < 1024) setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }

  const runScore = async (id: string, job: JobApplication["job"]) => {
    setBusy(setScoring, id, true)
    try {
      const match = await scoreMatch(cv, job)
      updateApp(id, (a) => ({ ...a, match, updatedAt: new Date().toISOString() }))
      return true
    } catch (error) {
      toast({ title: "Couldn't score the match", description: errorMessage(error), variant: "destructive" })
      return false
    } finally {
      setBusy(setScoring, id, false)
    }
  }

  const analyse = async (input: { url?: string; text?: string }): Promise<AnalyseResult> => {
    if (!cv) return { ok: false, message: "Upload your CV first." }

    if (input.url && !input.text) {
      const existing = apps.find((a) => a.sourceUrl && a.sourceUrl === input.url)
      if (existing) {
        select(existing.id)
        return { ok: false, message: "That job is already in your list, so we opened it." }
      }
    }

    setAnalysing(true)
    setSteps([
      { label: "Reading the job", state: "active" },
      { label: "Scoring your match", state: "pending" },
    ])

    try {
      let extracted
      try {
        extracted = await extractJob(input)
      } catch (error) {
        setSteps(null)
        const needsPaste = error instanceof ApiError && error.code === "NEEDS_PASTE"
        return { ok: false, needsPaste, message: errorMessage(error) }
      }

      const app = createApplication(extracted.job, extracted.sourceUrl || input.url || "")
      mutateApps((prev) => [app, ...prev])
      setSelectedId(app.id)
      setSteps([
        { label: `Read: ${extracted.job.title}${extracted.job.company ? ` at ${extracted.job.company}` : ""}`, state: "done" },
        { label: "Scoring your match", state: "active" },
      ])

      const scored = await runScore(app.id, app.job)
      setSteps((s) => s && s.map((step, i) => (i === 1 ? { ...step, state: scored ? "done" : "error" } : step)))
      setTimeout(() => setSteps(null), 2500)
      return { ok: true }
    } finally {
      setAnalysing(false)
    }
  }

  const generatePart = async (
    app: JobApplication,
    part: PackPart,
    options: { instructions?: string; questions?: string[] } = {},
  ) => {
    setPacks((p) => ({ ...p, [app.id]: { ...p[app.id], [part]: "active" } }))
    try {
      if (part === "resume") {
        const resume = await tailorResume(cv, app.job, options.instructions)
        updateApp(app.id, (a) => ({ ...a, resume, updatedAt: new Date().toISOString() }))
        // A new resume means any PDF made from the old one is out of date
        setPdfHtml(({ [app.id]: _old, ...rest }) => rest)
      } else if (part === "email") {
        const email = await writeEmail(cv, app.job, options.instructions)
        updateApp(app.id, (a) => ({ ...a, email, updatedAt: new Date().toISOString() }))
      } else {
        const answers = await draftAnswers(cv, app.job, profile, options.questions)
        updateApp(app.id, (a) => ({ ...a, answers, updatedAt: new Date().toISOString() }))
      }
      setPacks((p) => ({ ...p, [app.id]: { ...p[app.id], [part]: "done" } }))
      return true
    } catch (error) {
      setPacks((p) => ({ ...p, [app.id]: { ...p[app.id], [part]: "error" } }))
      toast({ title: `Couldn't create the ${part}`, description: errorMessage(error), variant: "destructive" })
      return false
    }
  }

  const clearPack = (id: string) =>
    setPacks(({ [id]: _done, ...rest }) => rest)

  const preparePack = async (app: JobApplication) => {
    const missing: PackPart[] = (["resume", "email", "answers"] as PackPart[]).filter((part) =>
      part === "answers" ? !app.answers?.length : !app[part],
    )
    const results = await Promise.all(missing.map((part) => generatePart(app, part)))
    clearPack(app.id)

    if (results.every(Boolean)) {
      updateApp(app.id, (a) => (a.status === "saved" ? withStatus(a, "ready") : a))
      toast({ title: "Application pack ready", description: "Check the Resume, Email and Answers tabs, then head to Apply." })
    }
  }

  const regenerate = async (app: JobApplication, part: PackPart, options?: { instructions?: string; questions?: string[] }) => {
    await generatePart(app, part, options)
    clearPack(app.id)
  }

  const makePdf = async (app: JobApplication) => {
    if (!app.resume) return
    setBusy(setPdfBusy, app.id, true)
    try {
      const html = await designPdf(app.resume, app.job)
      setPdfHtml((p) => ({ ...p, [app.id]: html }))
    } catch (error) {
      toast({ title: "Couldn't design the PDF", description: errorMessage(error), variant: "destructive" })
    } finally {
      setBusy(setPdfBusy, app.id, false)
    }
  }

  const changeStatus = (app: JobApplication, status: ApplicationStatus) => {
    updateApp(app.id, (a) => withStatus(a, status))
    if (status === "applied") toast({ title: "Marked as applied", description: "We'll remind you to follow up in 7 days." })
  }

  const remove = (id: string) => {
    mutateApps((prev) => prev.filter((a) => a.id !== id))
    setSelectedId((current) => (current === id ? null : current))
  }

  const exportCsv = () => {
    const header = ["Title", "Company", "Location", "Status", "Match", "Applied", "Follow up", "Link", "Notes"]
    const rows = apps.map((a) =>
      [a.job.title, a.job.company, a.job.location, STATUS_LABELS[a.status], a.match?.score, a.appliedAt?.slice(0, 10), a.followUpAt?.slice(0, 10), a.sourceUrl, a.notes]
        .map(csvCell)
        .join(","),
    )
    const url = URL.createObjectURL(new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `job-applications-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => {
    const scored = apps.filter((a) => a.match)
    return {
      total: apps.length,
      applied: apps.filter((a) => ["applied", "interview", "offer", "rejected"].includes(a.status)).length,
      interviews: apps.filter((a) => a.status === "interview" || a.status === "offer").length,
      followUps: apps.filter((a) => isFollowUpDue(a)).length,
      avgMatch: scored.length ? Math.round(scored.reduce((sum, a) => sum + (a.match?.score ?? 0), 0) / scored.length) : null,
    }
  }, [apps])

  const selected = apps.find((a) => a.id === selectedId) ?? null
  const busyIds = useMemo(() => new Set([...scoring, ...Object.keys(packs)]), [scoring, packs])
  const profileFilled = !!(profile.noticePeriod.trim() && profile.salaryExpectation.trim() && profile.workAuthorization.trim())

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 md:p-8">
      <Toaster />
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <a href="/app" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
            <span className="text-xl">←</span> Resume tailor
          </a>
          {apps.length > 0 && (
            <button onClick={exportCsv} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-blue-300">
              Export CSV
            </button>
          )}
        </div>

        <div className="mb-6 text-center">
          <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl">
            Job Hub
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
            Paste a job link. AI reads it, scores your fit, prepares your resume, email and answers, and tracks every application.
          </p>
        </div>

        {mounted && (
          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ["Jobs", stats.total],
              ["Applied", stats.applied],
              ["Interviews", stats.interviews],
              ["Follow-ups due", stats.followUps],
              ["Avg. match", stats.avgMatch === null ? "–" : `${stats.avgMatch}%`],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className={`rounded-xl border bg-white p-3 text-center shadow-sm last:col-span-2 sm:last:col-span-1 ${label === "Follow-ups due" && stats.followUps > 0 ? "border-amber-300" : "border-gray-200"}`}
              >
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        )}

        {mounted && !cv && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <span className="font-semibold">Upload your CV first.</span> The Job Hub uses the CV you saved in the resume tailor.{" "}
            <a href="/app" className="font-semibold text-blue-700 underline">
              Upload it here
            </a>
            , then come back.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4">
            <AddJob disabled={!cv} busy={analysing} steps={steps} onAnalyse={analyse} />
            {mounted && cv && (
              <p className="px-1 text-xs text-gray-500">
                Using your saved CV ({cv.length.toLocaleString()} characters) ·{" "}
                <a href="/app" className="text-blue-600 hover:underline">
                  change
                </a>
              </p>
            )}
            <ProfileCard
              profile={profile}
              onSave={(p) => {
                setProfile(p)
                saveProfile(p)
              }}
            />
            {mounted && <ApplicationList apps={apps} selectedId={selectedId} busyIds={busyIds} onSelect={select} />}
          </div>

          <div ref={detailRef} className="min-w-0 scroll-mt-4">
            {selected ? (
              <ApplicationDetail
                key={selected.id}
                app={selected}
                busy={{ scoring: scoring.has(selected.id), pack: packs[selected.id] ?? null, pdf: pdfBusy.has(selected.id) }}
                pdfHtml={pdfHtml[selected.id] ?? null}
                profileFilled={profileFilled}
                onScore={() => cv && runScore(selected.id, selected.job)}
                onPreparePack={() => preparePack(selected)}
                onRegenerate={(part, options) => regenerate(selected, part, options)}
                onDesignPdf={() => makePdf(selected)}
                onUpdate={(patch) => updateApp(selected.id, (a) => ({ ...a, ...patch, updatedAt: new Date().toISOString() }))}
                onStatus={(status) => changeStatus(selected, status)}
                onSnooze={() => updateApp(selected.id, (a) => snoozeFollowUp(a))}
                onDelete={() => remove(selected.id)}
              />
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/60 p-8 text-center">
                <p className="text-lg font-semibold text-gray-800">How it works</p>
                <ol className="mt-4 space-y-2 text-left text-sm text-gray-600">
                  <li>1. Paste a job link (or the description).</li>
                  <li>2. See your match score, strengths and gaps.</li>
                  <li>3. One click prepares your resume, email and form answers.</li>
                  <li>4. Apply, mark it as applied, and get a follow-up reminder.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
