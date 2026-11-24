"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cleanCvText, readCvPdf, type SavedCv } from "@/lib/cv"
import { cn } from "@/lib/utils"
import { Spinner } from "./ui-bits"

interface Props {
  cv: SavedCv
  onChange: (cv: SavedCv) => void
  onClear: () => void
}

// Step 1 of the workflow: the CV every match and application is built from.
export function CvCard({ cv, onChange, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<"view" | "paste">("view")
  const [pasted, setPasted] = useState("")
  const [reading, setReading] = useState(false)
  const [error, setError] = useState("")
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError("")
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload your CV as a PDF, or paste it as text.")
      return
    }
    setReading(true)
    try {
      onChange({ text: await readCvPdf(file), name: file.name })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that PDF. Try another file or paste the text.")
    } finally {
      setReading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const savePasted = () => {
    const text = cleanCvText(pasted)
    if (text.replace(/\s/g, "").length < 100) {
      setError("That looks too short for a CV. Paste the full text.")
      return
    }
    onChange({ text, name: "Pasted CV" })
    setPasted("")
    setMode("view")
    setError("")
  }

  const firstLine = cv.text.split("\n").find((l) => l.trim())?.slice(0, 80) ?? ""

  return (
    <div className="rounded-xl border-2 border-blue-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-semibold text-gray-900">
          <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] text-white">1</span>
          Your CV
        </p>
        {cv.text && mode === "view" && (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">✓ Ready</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
        aria-label="Upload CV as PDF"
      />

      {mode === "paste" ? (
        <div className="space-y-2">
          <Textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Paste your full CV text here…"
            className="min-h-[160px] text-sm"
            aria-label="CV text"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={savePasted} disabled={!pasted.trim()}>
              Save CV
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMode("view")}>
              Cancel
            </Button>
          </div>
        </div>
      ) : cv.text ? (
        <div className="space-y-2">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="truncate text-sm font-medium text-gray-900">{cv.name || "Saved CV"}</p>
            <p className="truncate text-xs text-gray-500">
              {firstLine} · {cv.text.length.toLocaleString()} characters
            </p>
          </div>
          {preview && (
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-200 p-3 text-[11px] leading-relaxed text-gray-700">
              {cv.text}
            </pre>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
            <button onClick={() => setPreview(!preview)} className="text-blue-600 hover:underline">
              {preview ? "Hide text" : "Check what we read"}
            </button>
            <button onClick={() => inputRef.current?.click()} className="text-blue-600 hover:underline" disabled={reading}>
              {reading ? "Reading…" : "Replace PDF"}
            </button>
            <button onClick={() => setMode("paste")} className="text-blue-600 hover:underline">
              Paste text
            </button>
            <button onClick={onClear} className="text-red-600 hover:underline">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              handleFile(e.dataTransfer.files?.[0])
            }}
            disabled={reading}
            className={cn(
              "flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
              dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/40",
            )}
          >
            {reading ? (
              <span className="flex items-center gap-2 text-sm text-blue-700">
                <Spinner /> Reading your CV…
              </span>
            ) : (
              <>
                <span className="text-2xl">📄</span>
                <span className="mt-1 text-sm font-medium text-gray-900">Upload your CV (PDF)</span>
                <span className="text-xs text-gray-500">Click or drop the file here</span>
              </>
            )}
          </button>
          <button onClick={() => setMode("paste")} className="text-xs font-medium text-blue-600 hover:underline">
            Or paste it as text
          </button>
        </div>
      )}

      {error && <p className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      <p className="mt-2 text-[11px] text-gray-400">Saved only in this browser.</p>
    </div>
  )
}
