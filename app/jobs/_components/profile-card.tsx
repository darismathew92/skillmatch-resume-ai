"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ApplicationProfile } from "@/lib/job-types"

const FIELDS: { key: keyof ApplicationProfile; label: string; placeholder: string }[] = [
  { key: "fullName", label: "Full name", placeholder: "Your name" },
  { key: "location", label: "Location", placeholder: "City, country" },
  { key: "noticePeriod", label: "Notice period / start date", placeholder: "e.g. Available in 2 weeks" },
  { key: "salaryExpectation", label: "Salary expectation", placeholder: "e.g. ₹12 LPA, or £40k" },
  { key: "workAuthorization", label: "Work authorisation", placeholder: "e.g. Indian citizen, remote only" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/…" },
  { key: "portfolio", label: "Portfolio / GitHub", placeholder: "yoursite.com" },
]

// Facts used in application answers, so the AI never has to guess them.
export function ProfileCard({ profile, onSave }: { profile: ApplicationProfile; onSave: (p: ApplicationProfile) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [saved, setSaved] = useState(false)

  useEffect(() => setDraft(profile), [profile])

  const filled = FIELDS.filter((f) => profile[f.key].trim()).length

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left" aria-expanded={open}>
        <div>
          <p className="font-semibold text-gray-900">Application profile</p>
          <p className="text-xs text-gray-500">
            {filled}/{FIELDS.length} filled · used for notice period, salary and similar answers
          </p>
        </div>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label htmlFor={`profile-${f.key}`} className="text-xs">
                {f.label}
              </Label>
              <Input
                id={`profile-${f.key}`}
                value={draft[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          ))}
          <div className="space-y-1">
            <Label htmlFor="profile-notes" className="text-xs">
              Anything else the AI should know
            </Label>
            <Textarea
              id="profile-notes"
              value={draft.extraNotes}
              placeholder="e.g. Open to relocating to the UK; prefer AI-focused roles"
              onChange={(e) => setDraft({ ...draft, extraNotes: e.target.value })}
              className="min-h-[70px] text-sm"
            />
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              onSave(draft)
              setSaved(true)
              setTimeout(() => setSaved(false), 1500)
            }}
          >
            {saved ? "✓ Saved" : "Save profile"}
          </Button>
          <p className="text-[11px] text-gray-400">Stored only in this browser.</p>
        </div>
      )}
    </div>
  )
}
