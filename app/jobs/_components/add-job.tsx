"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Steps, type StepState } from "./ui-bits"

export interface AnalyseResult {
  ok: boolean
  needsPaste?: boolean
  message?: string
}

interface Props {
  disabled: boolean
  busy: boolean
  steps: { label: string; state: StepState }[] | null
  onAnalyse: (input: { url?: string; text?: string }) => Promise<AnalyseResult>
}

export function AddJob({ disabled, busy, steps, onAnalyse }: Props) {
  const [mode, setMode] = useState<"link" | "paste">("link")
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [message, setMessage] = useState<string>("")

  const canSubmit = !busy && !disabled && (mode === "link" ? url.trim().length > 8 : text.trim().length > 80)

  const submit = async () => {
    setMessage("")
    const result = await onAnalyse(mode === "link" ? { url: url.trim() } : { text: text.trim(), url: url.trim() || undefined })
    if (result.ok) {
      setUrl("")
      setText("")
      setMode("link")
      return
    }
    if (result.needsPaste) setMode("paste")
    setMessage(result.message || "Something went wrong. Please try again.")
  }

  return (
    <Card className="border-2 border-blue-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 align-middle text-[11px] text-white">2</span>
          Add a job
        </CardTitle>
        <CardDescription>Paste a job link. AI reads it and scores how well you fit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="inline-flex rounded-lg bg-gray-100 p-1 text-sm" role="tablist">
          {(["link", "paste"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800",
              )}
            >
              {m === "link" ? "Job link" : "Paste description"}
            </button>
          ))}
        </div>

        {mode === "link" ? (
          <Input
            type="url"
            inputMode="url"
            placeholder="https://company.com/careers/role"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()}
            disabled={busy}
            className="h-11 text-base"
            aria-label="Job link"
          />
        ) : (
          <>
            <Textarea
              placeholder="Paste the full job description here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={busy}
              className="min-h-[160px] text-sm"
              aria-label="Job description"
            />
            <Input
              type="url"
              placeholder="Application link (optional, used for the Apply button)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={busy}
              className="h-10 text-sm"
              aria-label="Application link"
            />
          </>
        )}

        <Button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {busy ? "Working…" : "Analyse job"}
        </Button>

        {disabled && <p className="text-xs text-amber-700">Add your CV above first so we can score your match.</p>}
        {message && <p className="rounded-md bg-amber-50 p-2.5 text-sm text-amber-800">{message}</p>}
        {steps && <Steps steps={steps} />}
      </CardContent>
    </Card>
  )
}
