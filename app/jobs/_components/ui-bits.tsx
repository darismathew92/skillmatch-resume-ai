"use client"

import { useState } from "react"
import type { ApplicationStatus } from "@/lib/applications"
import { STATUS_LABELS } from "@/lib/applications"
import { cn } from "@/lib/utils"

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Clipboard API blocked: fall back to a hidden textarea
    const area = document.createElement("textarea")
    area.value = text
    area.style.position = "fixed"
    area.style.left = "-9999px"
    document.body.appendChild(area)
    area.select()
    try {
      return document.execCommand("copy")
    } catch {
      return false
    } finally {
      document.body.removeChild(area)
    }
  }
}

export function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle")
  return (
    <button
      type="button"
      onClick={async () => {
        setState((await copyText(text)) ? "done" : "failed")
        setTimeout(() => setState("idle"), 1800)
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors min-h-[32px]",
        className,
      )}
    >
      {state === "done" ? "✓ Copied" : state === "failed" ? "Select & copy manually" : label}
    </button>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
    />
  )
}

export function scoreTone(score: number) {
  if (score >= 80) return { ring: "#16a34a", text: "text-green-700", bg: "bg-green-50", border: "border-green-200" }
  if (score >= 65) return { ring: "#2563eb", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" }
  if (score >= 45) return { ring: "#d97706", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" }
  return { ring: "#dc2626", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" }
}

export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const stroke = size / 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, score))
  const tone = scoreTone(clamped)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Match score ${clamped} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold leading-none", tone.text)} style={{ fontSize: size * 0.3 }}>
          {clamped}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-gray-500">match</span>
      </div>
    </div>
  )
}

export function ScorePill({ score }: { score: number }) {
  const tone = scoreTone(score)
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", tone.bg, tone.text, tone.border)}>
      {score}%
    </span>
  )
}

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  saved: "bg-gray-100 text-gray-700 border-gray-200",
  ready: "bg-blue-50 text-blue-700 border-blue-200",
  applied: "bg-purple-50 text-purple-700 border-purple-200",
  interview: "bg-amber-50 text-amber-800 border-amber-200",
  offer: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function Chip({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "green" | "red" | "blue" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-50 text-green-800 ring-1 ring-green-200",
    red: "bg-red-50 text-red-700 ring-1 ring-red-200",
    blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  }
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>
}

export type StepState = "pending" | "active" | "done" | "error"

export function Steps({ steps }: { steps: { label: string; state: StepState }[] }) {
  return (
    <ol className="space-y-2" aria-live="polite">
      {steps.map((step) => (
        <li key={step.label} className="flex items-center gap-2.5 text-sm">
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
              step.state === "done" && "bg-green-500 text-white",
              step.state === "active" && "bg-blue-100 text-blue-700",
              step.state === "pending" && "bg-gray-100 text-gray-400",
              step.state === "error" && "bg-red-500 text-white",
            )}
          >
            {step.state === "done" ? "✓" : step.state === "error" ? "!" : step.state === "active" ? <Spinner className="h-3 w-3" /> : "•"}
          </span>
          <span className={cn(step.state === "pending" ? "text-gray-400" : "text-gray-800", step.state === "active" && "font-medium")}>
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</h3>
}
