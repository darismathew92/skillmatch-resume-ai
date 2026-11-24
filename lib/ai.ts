import "server-only"
import { generateObject, generateText, type LanguageModel } from "ai"
import { groq } from "@ai-sdk/groq"
import type { z } from "zod"

export const AI_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b"

export function getModel(): LanguageModel {
  return groq(AI_MODEL)
}

// Pulls the first JSON object out of model text, tolerating ```json fences
// and stray prose before or after it.
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim()
  const start = cleaned.indexOf("{")
  if (start === -1) throw new Error("No JSON object in model output")

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1))
    }
  }
  throw new Error("Unterminated JSON object in model output")
}

interface StructuredOptions<T extends z.ZodTypeAny> {
  schema: T
  system?: string
  prompt: string
  // Plain-language description of the JSON shape, used by the text fallback
  shapeHint: string
  maxOutputTokens?: number
  temperature?: number
  model?: LanguageModel
}

// Typed output from the model.
// First tries native structured output (JSON schema). If the model or provider
// doesn't support it, or the output fails validation, falls back to asking for
// plain JSON and validating it with the same Zod schema.
export async function generateStructured<T extends z.ZodTypeAny>(opts: StructuredOptions<T>): Promise<z.infer<T>> {
  const model = opts.model ?? getModel()

  try {
    const { object } = await generateObject({
      model,
      schema: opts.schema,
      system: opts.system,
      prompt: opts.prompt,
      maxOutputTokens: opts.maxOutputTokens,
      temperature: opts.temperature,
    })
    return opts.schema.parse(object)
  } catch (error) {
    console.warn("[ai] structured output failed, retrying as plain JSON:", error instanceof Error ? error.message : error)
  }

  const { text } = await generateText({
    model,
    system: opts.system,
    prompt: `${opts.prompt}

Respond with ONLY one JSON object, no markdown, no commentary. Shape:
${opts.shapeHint}`,
    maxOutputTokens: opts.maxOutputTokens,
    temperature: opts.temperature,
  })

  return opts.schema.parse(extractJson(text))
}
