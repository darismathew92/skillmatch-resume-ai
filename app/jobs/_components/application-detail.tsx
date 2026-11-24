"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { ApplicationStatus, JobApplication } from "@/lib/applications"
import { daysSince, isFollowUpDue, STATUS_LABELS, STATUS_ORDER } from "@/lib/applications"
import { cn } from "@/lib/utils"
import { Chip, CopyButton, ScoreRing, SectionTitle, Spinner, StatusBadge, Steps, type StepState } from "./ui-bits"

export type PackPart = "resume" | "email" | "answers"

interface Props {
  app: JobApplication
  busy: { scoring: boolean; pack: Partial<Record<PackPart, StepState>> | null; pdf: boolean }
  pdfHtml: string | null
  profileFilled: boolean
  onScore: () => void
  onPreparePack: () => void
  onRegenerate: (part: PackPart, options?: { instructions?: string; questions?: string[] }) => void
  onDesignPdf: () => void
  // Partial update, merged into the latest saved version of this application
  onUpdate: (patch: Partial<JobApplication>) => void
  onStatus: (status: ApplicationStatus) => void
  onSnooze: () => void
  onDelete: () => void
}

const VERDICT_LABELS = {
  strong: "Strong fit",
  good: "Good fit",
  partial: "Partial fit",
  weak: "Weak fit",
} as const

const SEVERITY_STYLES = {
  critical: "border-red-200 bg-red-50 text-red-700",
  moderate: "border-amber-200 bg-amber-50 text-amber-800",
  minor: "border-gray-200 bg-gray-50 text-gray-600",
} as const

function formatDate(iso?: string) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "job"
}

function openHtml(html: string, print: boolean): boolean {
  const win = window.open("", "_blank")
  if (!win) return false
  win.document.write(html)
  win.document.close()
  if (print) win.onload = () => setTimeout(() => win.print(), 250)
  return true
}

export function ApplicationDetail(props: Props) {
  const { app, busy } = props
  const job = app.job
  const hasPack = !!(app.resume || app.email || app.answers?.length)

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{job.title || "Untitled role"}</h2>
            <p className="text-gray-600">{job.company || "Unknown company"}</p>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.location && <Chip>📍 {job.location}</Chip>}
          {job.workMode !== "unknown" && <Chip>{job.workMode[0].toUpperCase() + job.workMode.slice(1)}</Chip>}
          {job.employmentType && <Chip>{job.employmentType}</Chip>}
          {job.seniority && <Chip>{job.seniority}</Chip>}
          {job.salary && <Chip tone="green">{job.salary}</Chip>}
          {app.sourceUrl && (
            <a href={app.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:underline">
              View posting ↗
            </a>
          )}
        </div>
      </div>

      <Tabs defaultValue="match" className="p-4 sm:p-5">
        <TabsList className="mb-4 grid h-auto w-full grid-cols-5 gap-1">
          <TabsTrigger value="match" className="text-xs sm:text-sm">Match</TabsTrigger>
          <TabsTrigger value="resume" className="text-xs sm:text-sm">Resume</TabsTrigger>
          <TabsTrigger value="email" className="text-xs sm:text-sm">Email</TabsTrigger>
          <TabsTrigger value="answers" className="text-xs sm:text-sm">Answers</TabsTrigger>
          <TabsTrigger value="apply" className="text-xs sm:text-sm">Apply</TabsTrigger>
        </TabsList>

        <TabsContent value="match" className="space-y-5">
          <MatchPanel {...props} />
          <PackPanel {...props} hasPack={hasPack} />
          <JobDetails app={app} />
        </TabsContent>

        <TabsContent value="resume">
          <EditableDoc
            kind="resume"
            text={app.resume}
            busy={busy.pack?.resume === "active"}
            emptyLabel="Tailor my resume"
            onGenerate={(instructions) => props.onRegenerate("resume", { instructions })}
            onChange={(resume) => props.onUpdate({ resume })}
            filename={`resume-${slug(job.company)}.txt`}
          />
          {app.resume && <PdfTools {...props} />}
        </TabsContent>

        <TabsContent value="email">
          <EditableDoc
            kind="email"
            text={app.email}
            busy={busy.pack?.email === "active"}
            emptyLabel="Write my application email"
            onGenerate={(instructions) => props.onRegenerate("email", { instructions })}
            onChange={(email) => props.onUpdate({ email })}
            filename={`email-${slug(job.company)}.txt`}
          />
        </TabsContent>

        <TabsContent value="answers">
          <AnswersPanel {...props} />
        </TabsContent>

        <TabsContent value="apply">
          <ApplyPanel {...props} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MatchPanel({ app, busy, onScore }: Props) {
  const match = app.match
  if (!match) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
        <p className="mb-3 text-sm text-gray-600">No match score yet.</p>
        <Button onClick={onScore} disabled={busy.scoring}>
          {busy.scoring ? <><Spinner /> Scoring…</> : "Score my match"}
        </Button>
      </div>
    )
  }

  const totalSkills = match.keywordsMatched.length + match.keywordsMissing.length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ScoreRing score={match.score} size={104} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-lg font-semibold text-gray-900">{VERDICT_LABELS[match.verdict]}</p>
          <p className="text-sm text-gray-700">{match.headline}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-gray-50 p-2">
              <p className="text-gray-500">AI assessment</p>
              <p className="font-semibold text-gray-900">{match.aiScore}/100</p>
            </div>
            <div className="rounded-md bg-gray-50 p-2">
              <p className="text-gray-500">Skills found in CV</p>
              <p className="font-semibold text-gray-900">
                {totalSkills ? `${match.keywordsMatched.length}/${totalSkills} (${match.keywordCoverage}%)` : "n/a"}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onScore} disabled={busy.scoring} className="self-start">
          {busy.scoring ? <Spinner /> : "Rescore"}
        </Button>
      </div>

      {match.recommendation && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-sm text-blue-900">
          <span className="font-semibold">Recommendation: </span>
          {match.recommendation}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <SectionTitle>Strengths</SectionTitle>
          <ul className="space-y-2">
            {match.strengths.map((s, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium text-gray-900">✓ {s.point}</p>
                {s.evidence && <p className="pl-4 text-xs text-gray-500">{s.evidence}</p>}
              </li>
            ))}
            {match.strengths.length === 0 && <li className="text-sm text-gray-500">None identified.</li>}
          </ul>
        </div>
        <div>
          <SectionTitle>Gaps to address</SectionTitle>
          <ul className="space-y-2">
            {match.gaps.map((g, i) => (
              <li key={i} className={cn("rounded-md border p-2 text-sm", SEVERITY_STYLES[g.severity])}>
                <p className="font-medium">
                  {g.skill} <span className="text-[10px] uppercase tracking-wide opacity-75">{g.severity}</span>
                </p>
                {g.suggestion && <p className="mt-0.5 text-xs opacity-90">{g.suggestion}</p>}
              </li>
            ))}
            {match.gaps.length === 0 && <li className="text-sm text-gray-500">No major gaps.</li>}
          </ul>
        </div>
      </div>

      {totalSkills > 0 && (
        <div>
          <SectionTitle>Job skills vs your CV</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {match.keywordsMatched.map((k) => (
              <Chip key={k} tone="green">✓ {k}</Chip>
            ))}
            {match.keywordsMissing.map((k) => (
              <Chip key={k} tone="red">✕ {k}</Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PackPanel({ app, busy, onPreparePack, hasPack }: Props & { hasPack: boolean }) {
  const parts: { key: PackPart; label: string; done: boolean }[] = [
    { key: "resume", label: "Tailored resume", done: !!app.resume },
    { key: "email", label: "Application email", done: !!app.email },
    { key: "answers", label: "Answers to application questions", done: !!app.answers?.length },
  ]
  const allDone = parts.every((p) => p.done)

  if (busy.pack) {
    return (
      <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4">
        <p className="mb-3 font-semibold text-gray-900">Preparing your application pack…</p>
        <Steps steps={parts.map((p) => ({ label: p.label, state: busy.pack?.[p.key] ?? (p.done ? "done" : "pending") }))} />
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
      <p className="font-semibold">{allDone ? "Application pack ready" : "One click: everything you need to apply"}</p>
      <p className="mt-1 text-sm text-blue-50">
        {allDone
          ? "Review each tab, then use Apply to submit and track it."
          : "A resume tailored to this job, an application email, and answers to the usual form questions."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {parts.map((p) => (
          <span key={p.key} className={cn("rounded-full px-2.5 py-1 text-xs", p.done ? "bg-white/25" : "bg-white/10 text-blue-100")}>
            {p.done ? "✓ " : ""}
            {p.label}
          </span>
        ))}
      </div>
      {!allDone && (
        <Button onClick={onPreparePack} className="mt-4 w-full bg-white text-blue-700 hover:bg-blue-50 sm:w-auto">
          {hasPack ? "Finish the pack" : "Prepare application pack"}
        </Button>
      )}
    </div>
  )
}

function JobDetails({ app }: { app: JobApplication }) {
  const [open, setOpen] = useState(false)
  const job = app.job
  const sections: [string, string[]][] = [
    ["Requirements", job.requirements],
    ["Responsibilities", job.responsibilities],
    ["Nice to have", job.niceToHave],
  ]
  return (
    <div className="rounded-lg border border-gray-200">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-3 text-left text-sm font-medium" aria-expanded={open}>
        Job details
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-gray-100 p-3 text-sm">
          {job.summary && <p className="text-gray-700">{job.summary}</p>}
          {sections
            .filter(([, items]) => items.length)
            .map(([title, items]) => (
              <div key={title}>
                <SectionTitle>{title}</SectionTitle>
                <ul className="list-disc space-y-1 pl-5 text-gray-700">
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function EditableDoc({
  kind,
  text,
  busy,
  emptyLabel,
  onGenerate,
  onChange,
  filename,
}: {
  kind: "resume" | "email"
  text?: string
  busy: boolean
  emptyLabel: string
  onGenerate: (instructions: string) => void
  onChange: (text: string) => void
  filename: string
}) {
  const [instructions, setInstructions] = useState("")
  const [draft, setDraft] = useState(text ?? "")
  const [lastText, setLastText] = useState(text)

  // Pick up regenerated text from outside
  if (text !== lastText) {
    setLastText(text)
    setDraft(text ?? "")
  }

  if (!text) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
        <Button onClick={() => onGenerate("")} disabled={busy}>
          {busy ? <><Spinner /> Writing…</> : emptyLabel}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <CopyButton text={draft} />
        <button
          onClick={() => downloadText(filename, draft)}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 min-h-[32px]"
        >
          Download .txt
        </button>
      </div>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== text && onChange(draft)}
        className={cn("min-h-[360px] font-mono text-xs leading-relaxed", busy && "opacity-50")}
        aria-label={kind === "resume" ? "Tailored resume" : "Application email"}
      />
      <p className="text-[11px] text-gray-400">Edits save automatically when you click away.</p>
      <div className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3 sm:flex-row">
        <Input
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={kind === "resume" ? "e.g. Emphasise my AI and deployment work" : "e.g. Make it shorter and more casual"}
          className="h-9 bg-white text-sm"
          aria-label="Instructions for rewriting"
        />
        <Button variant="outline" size="sm" onClick={() => onGenerate(instructions)} disabled={busy} className="shrink-0">
          {busy ? <Spinner /> : "Rewrite"}
        </Button>
      </div>
    </div>
  )
}

function PdfTools({ busy, pdfHtml, onDesignPdf }: Props) {
  const [blocked, setBlocked] = useState(false)
  return (
    <div className="mt-4 rounded-lg border border-gray-200 p-3">
      <p className="text-sm font-medium text-gray-900">PDF resume</p>
      <p className="mb-3 text-xs text-gray-500">AI lays out your tailored resume as a clean, ATS-friendly PDF.</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={pdfHtml ? "outline" : "default"} onClick={onDesignPdf} disabled={busy.pdf}>
          {busy.pdf ? <><Spinner /> Designing…</> : pdfHtml ? "Redesign" : "Design PDF"}
        </Button>
        {pdfHtml && (
          <>
            <Button size="sm" onClick={() => setBlocked(!openHtml(pdfHtml, true))}>
              Download PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBlocked(!openHtml(pdfHtml, false))}>
              Preview
            </Button>
          </>
        )}
      </div>
      {pdfHtml && <p className="mt-2 text-[11px] text-gray-400">Choose “Save as PDF” in the print dialog.</p>}
      {blocked && <p className="mt-2 text-xs text-amber-700">Your browser blocked the popup. Allow popups for this site and try again.</p>}
    </div>
  )
}

function AnswersPanel({ app, busy, profileFilled, onRegenerate, onUpdate }: Props) {
  const [question, setQuestion] = useState("")
  const answers = app.answers ?? []
  const generating = busy.pack?.answers === "active"
  const customQuestions = answers.map((a) => a.question)

  const regenerateWith = (extra?: string) => {
    const questions = extra ? [...customQuestions, extra] : customQuestions
    onRegenerate("answers", { questions })
  }

  return (
    <div className="space-y-4">
      {!profileFilled && (
        <p className="rounded-md bg-amber-50 p-2.5 text-xs text-amber-800">
          Fill in your application profile (left side) so answers about notice period, salary and work authorisation use your real details instead of placeholders.
        </p>
      )}

      {answers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
          <Button onClick={() => regenerateWith()} disabled={generating}>
            {generating ? <><Spinner /> Drafting…</> : "Draft my answers"}
          </Button>
        </div>
      ) : (
        <ul className={cn("space-y-3", generating && "opacity-50")}>
          {answers.map((a, i) => (
            <li key={`${i}-${a.question}-${a.answer.slice(0, 60)}`} className="rounded-lg border border-gray-200 p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-900">{a.question}</p>
                <CopyButton text={a.answer} className="shrink-0" />
              </div>
              <Textarea
                defaultValue={a.answer}
                onBlur={(e) => {
                  if (e.target.value === a.answer) return
                  const next = answers.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x))
                  onUpdate({ answers: next })
                }}
                className="min-h-[110px] text-sm"
                aria-label={`Answer: ${a.question}`}
              />
              {/\[[^\]]+\]/.test(a.answer) && (
                <p className="mt-1 text-[11px] text-amber-700">Fill in the [bracketed] parts before submitting.</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3 sm:flex-row">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Add a question from the application form"
          className="h-9 bg-white text-sm"
          aria-label="New application question"
        />
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          disabled={generating || !question.trim()}
          onClick={() => {
            regenerateWith(question.trim())
            setQuestion("")
          }}
        >
          Add & answer
        </Button>
      </div>
      {answers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <CopyButton text={answers.map((a) => `${a.question}\n${a.answer}`).join("\n\n")} label="Copy all answers" />
          <button onClick={() => regenerateWith()} disabled={generating} className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50">
            Regenerate all
          </button>
        </div>
      )}
    </div>
  )
}

function ApplyPanel({ app, pdfHtml, onStatus, onSnooze, onUpdate, onDelete }: Props) {
  const job = app.job
  const [confirmDelete, setConfirmDelete] = useState(false)
  const applyUrl = app.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} careers apply`)}`
  const due = isFollowUpDue(app)
  const appliedDays = daysSince(app.appliedAt)

  const followUpMessage = `Hi,

I applied for the ${job.title} role at ${job.company || "your company"}${app.appliedAt ? ` on ${formatDate(app.appliedAt)}` : ""} and wanted to follow up. I'm still very interested in the position and would be happy to share anything else that would help.

Thank you for your time.

Best regards`

  const checklist = [
    { label: "Tailored resume", done: !!app.resume },
    { label: "PDF designed (Resume tab)", done: !!pdfHtml },
    { label: "Application email", done: !!app.email },
    { label: "Answers drafted", done: !!app.answers?.length },
    { label: "Submitted", done: ["applied", "interview", "offer", "rejected"].includes(app.status) },
  ]

  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Checklist</SectionTitle>
        <ul className="space-y-1.5">
          {checklist.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[11px]", c.done ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400")}>
                {c.done ? "✓" : ""}
              </span>
              <span className={c.done ? "text-gray-900" : "text-gray-500"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
        <p className="font-semibold text-gray-900">Submit the application</p>
        <p className="mt-1 text-sm text-gray-600">
          Open the job page, attach your PDF, and paste in your answers. You stay in control of what gets sent.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <a href={applyUrl} target="_blank" rel="noopener noreferrer">
              {app.sourceUrl ? "Open application page ↗" : "Find the application page ↗"}
            </a>
          </Button>
          {app.status !== "applied" && app.status !== "interview" && app.status !== "offer" && (
            <Button variant="outline" onClick={() => onStatus("applied")}>
              Mark as applied
            </Button>
          )}
        </div>
      </div>

      {app.status === "applied" && (
        <div className={cn("rounded-lg border p-4", due ? "border-amber-200 bg-amber-50" : "border-gray-200")}>
          <p className="font-semibold text-gray-900">{due ? "Time to follow up" : "Follow-up"}</p>
          <p className="mt-1 text-sm text-gray-600">
            Applied {appliedDays === 0 ? "today" : `${appliedDays} day${appliedDays === 1 ? "" : "s"} ago`}.{" "}
            {due ? "No reply yet, so a short, polite nudge is fair." : `Reminder set for ${formatDate(app.followUpAt)}.`}
          </p>
          {due && (
            <div className="mt-3 space-y-2">
              <Textarea readOnly value={followUpMessage} className="min-h-[150px] bg-white text-sm" aria-label="Follow-up message" />
              <div className="flex flex-wrap gap-2">
                <CopyButton text={followUpMessage} label="Copy follow-up" />
                <button onClick={onSnooze} className="text-xs font-medium text-blue-600 hover:underline">
                  Remind me in a week
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <SectionTitle>Status</SectionTitle>
          <select
            value={app.status}
            onChange={(e) => onStatus(e.target.value as ApplicationStatus)}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            aria-label="Application status"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <SectionTitle>Timeline</SectionTitle>
          <ul className="space-y-1 text-xs text-gray-600">
            {[...app.history].reverse().slice(0, 6).map((h, i) => (
              <li key={i}>
                <span className="font-medium text-gray-800">{STATUS_LABELS[h.status]}</span> · {formatDate(h.at)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <SectionTitle>Notes</SectionTitle>
        <Textarea
          defaultValue={app.notes}
          onBlur={(e) => e.target.value !== app.notes && onUpdate({ notes: e.target.value })}
          placeholder="Recruiter name, interview dates, anything to remember…"
          className="min-h-[90px] text-sm"
          aria-label="Notes"
        />
      </div>

      <div className="border-t border-gray-100 pt-4">
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-700">Delete this application and its pack?</span>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              Delete
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="text-xs text-red-600 hover:underline">
            Delete application
          </button>
        )}
      </div>
    </div>
  )
}
