import "server-only"
import { lookup } from "dns/promises"
import { isIP } from "net"

// Fetches a job posting page safely and turns it into text the AI can read.

const MAX_BYTES = 2_000_000
const MAX_REDIRECTS = 4
const TIMEOUT_MS = 10_000
const MAX_TEXT = 15_000

export class JobPageError extends Error {
  constructor(
    message: string,
    public code: "INVALID_URL" | "BLOCKED_URL" | "FETCH_FAILED" | "NEEDS_PASTE",
  ) {
    super(message)
  }
}

// ---------- SSRF protection: only public http(s) addresses ----------

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
      (a === 169 && b === 254) || // link-local, cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224 // multicast and reserved
    )
  }
  const v6 = ip.toLowerCase()
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7))
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80")
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new JobPageError("That doesn't look like a valid link.", "INVALID_URL")
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new JobPageError("Only http and https links are supported.", "INVALID_URL")
  }
  if (url.username || url.password) {
    throw new JobPageError("Links with credentials aren't allowed.", "BLOCKED_URL")
  }

  const host = url.hostname.replace(/^\[|\]$/g, "")
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new JobPageError("That address isn't allowed.", "BLOCKED_URL")
  }

  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => [])
  if (addresses.length === 0) {
    throw new JobPageError("Couldn't find that website.", "FETCH_FAILED")
  }
  if (addresses.some((a) => isPrivateIp(a.address))) {
    throw new JobPageError("That address isn't allowed.", "BLOCKED_URL")
  }
  return url
}

async function readCapped(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return ""
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > MAX_BYTES) {
      await reader.cancel()
      break
    }
    chunks.push(value)
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks))
}

// Follows redirects manually so every hop is checked against the rules above.
export async function fetchJobPage(rawUrl: string): Promise<{ html: string; finalUrl: string }> {
  let url = await assertPublicUrl(rawUrl.trim())

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let response: Response
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SkillmatchResumeBot/1.0; +https://skillmatchresume.vercel.app)",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-GB,en;q=0.9",
        },
      })
    } catch {
      throw new JobPageError("The job site didn't respond. Paste the job description instead.", "NEEDS_PASTE")
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (!location) break
      url = await assertPublicUrl(new URL(location, url).toString())
      continue
    }

    if (!response.ok) {
      throw new JobPageError(
        `The job site blocked us (status ${response.status}). Paste the job description instead.`,
        "NEEDS_PASTE",
      )
    }

    const type = response.headers.get("content-type") || ""
    if (!type.includes("html") && !type.includes("text")) {
      throw new JobPageError("That link isn't a web page. Paste the job description instead.", "NEEDS_PASTE")
    }

    return { html: await readCapped(response), finalUrl: url.toString() }
  }

  throw new JobPageError("Too many redirects. Paste the job description instead.", "NEEDS_PASTE")
}

// ---------- HTML to text ----------

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
  bull: "•",
  pound: "£",
  euro: "€",
}

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : match
    }
    return ENTITIES[code.toLowerCase()] ?? match
  })
}

export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg|nav|footer|header|form|iframe)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section)[^>]*>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n\s*\n\s*/g, "\n\n")
    .trim()
}

// ---------- schema.org JobPosting (most job boards embed this) ----------

export interface JobLdData {
  title?: string
  company?: string
  location?: string
  employmentType?: string
  salary?: string
  remote?: boolean
  description?: string
  datePosted?: string
}

function findJobPosting(node: unknown): Record<string, any> | null {
  if (!node || typeof node !== "object") return null
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findJobPosting(item)
      if (found) return found
    }
    return null
  }
  const obj = node as Record<string, any>
  const type = obj["@type"]
  if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) return obj
  if (obj["@graph"]) return findJobPosting(obj["@graph"])
  return null
}

function formatSalary(base: any): string {
  if (!base || typeof base !== "object") return typeof base === "string" ? base : ""
  const currency = base.currency || ""
  const value = base.value
  if (value && typeof value === "object") {
    const range =
      value.minValue && value.maxValue ? `${value.minValue}-${value.maxValue}` : String(value.value ?? value.minValue ?? "")
    return [currency, range, value.unitText ? `per ${String(value.unitText).toLowerCase()}` : ""].filter(Boolean).join(" ")
  }
  return [currency, value].filter(Boolean).join(" ")
}

export function extractJobLd(html: string): JobLdData | null {
  const blocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const block of blocks) {
    let parsed: unknown
    try {
      parsed = JSON.parse(block[1].trim())
    } catch {
      continue
    }
    const job = findJobPosting(parsed)
    if (!job) continue

    const place = Array.isArray(job.jobLocation) ? job.jobLocation[0] : job.jobLocation
    const address = place?.address
    const location =
      typeof address === "string"
        ? address
        : [address?.addressLocality, address?.addressRegion, address?.addressCountry?.name ?? address?.addressCountry]
            .filter((v) => typeof v === "string" && v)
            .join(", ")

    const company = typeof job.hiringOrganization === "string" ? job.hiringOrganization : job.hiringOrganization?.name

    return {
      title: typeof job.title === "string" ? decodeEntities(job.title) : undefined,
      company: typeof company === "string" ? decodeEntities(company) : undefined,
      location: location || undefined,
      employmentType: Array.isArray(job.employmentType) ? job.employmentType.join(", ") : job.employmentType,
      salary: formatSalary(job.baseSalary) || undefined,
      remote: job.jobLocationType === "TELECOMMUTE",
      description: typeof job.description === "string" ? htmlToText(decodeEntities(job.description)) : undefined,
      datePosted: job.datePosted,
    }
  }
  return null
}

// Builds the text the AI reads: structured data first (most reliable), then page text.
export function buildJobSourceText(html: string): { text: string; ld: JobLdData | null } {
  const ld = extractJobLd(html)
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]

  const parts: string[] = []
  if (ld) {
    parts.push(
      "STRUCTURED JOB DATA (from the page's schema.org markup):",
      [
        ld.title && `Title: ${ld.title}`,
        ld.company && `Company: ${ld.company}`,
        ld.location && `Location: ${ld.location}`,
        ld.remote && "Remote: yes",
        ld.employmentType && `Employment type: ${ld.employmentType}`,
        ld.salary && `Salary: ${ld.salary}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    if (ld.description) parts.push(`DESCRIPTION:\n${ld.description}`)
  }

  // Page text is only needed when the structured description is missing or thin
  if (!ld?.description || ld.description.length < 400) {
    const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html.match(/<body[\s\S]*<\/body>/i)?.[0] ?? html
    if (titleTag) parts.push(`PAGE TITLE: ${decodeEntities(titleTag).trim()}`)
    parts.push(`PAGE TEXT:\n${htmlToText(main)}`)
  }

  return { text: parts.join("\n\n").slice(0, MAX_TEXT), ld }
}
