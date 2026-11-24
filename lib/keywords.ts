// Deterministic keyword coverage: which of the job's skills actually appear in the CV.
// This anchors the AI's judgement with something checkable and explainable.

// Each group lists spellings that mean the same skill
const ALIASES: string[][] = [
  ["javascript", "js", "ecmascript"],
  ["typescript", "ts"],
  ["node.js", "nodejs"],
  ["next.js", "nextjs"],
  ["react", "react.js", "reactjs"],
  ["vue", "vue.js", "vuejs"],
  ["postgresql", "postgres", "psql"],
  ["mysql", "mariadb"],
  ["mongodb", "mongo"],
  ["ci/cd", "cicd", "continuous integration", "github actions", "gitlab ci", "jenkins"],
  ["aws", "amazon web services"],
  ["gcp", "google cloud", "google cloud platform"],
  ["azure", "microsoft azure"],
  ["kubernetes", "k8s"],
  ["docker", "containers", "containerisation", "containerization"],
  ["rest api", "restful", "rest apis", "restful apis", "rest-api"],
  ["llm", "llms", "large language models", "openai", "gpt", "claude", "gemini"],
  ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
  ["machine learning", "ml"],
  ["tailwind", "tailwind css", "tailwindcss"],
  ["c#", "csharp"],
  [".net", "dotnet"],
  ["golang"],
  ["css", "css3"],
  ["html", "html5"],
  ["vps", "linux server", "linux servers"],
  ["git", "github", "gitlab"],
]

function normalise(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim()
}

function variantsOf(skill: string): string[] {
  const key = normalise(skill)
  const group = ALIASES.find((g) => g.includes(key))
  const base = group ? [...group] : [key]
  // "React Native" -> also accept "react native"; strip trailing version numbers like "Python 3"
  const noVersion = key.replace(/\s*\d+(\.\d+)*$/, "")
  if (noVersion && noVersion !== key) base.push(noVersion)
  return Array.from(new Set(base))
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function appearsIn(haystack: string, term: string): boolean {
  if (term.length < 2) return false
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}(?![a-z0-9])`, "i")
  return pattern.test(haystack)
}

// Skill names that are also everyday words ("go live", "next steps", "rest of").
// These only count when written with their usual capitalisation in the CV.
const AMBIGUOUS: Record<string, RegExp> = {
  go: /(^|[^A-Za-z0-9])(Go|Golang|golang)(?![A-Za-z0-9])/,
  next: /(^|[^A-Za-z0-9])Next(\.js)?(?![A-Za-z0-9])/,
  rest: /(^|[^A-Za-z0-9])REST(ful)?(?![A-Za-z0-9])/,
  node: /(^|[^A-Za-z0-9])Node(\.js)?(?![A-Za-z0-9])/,
}

export function keywordCoverage(cvText: string, skills: string[]) {
  const haystack = normalise(cvText)
  const seen = new Set<string>()
  const matched: string[] = []
  const missing: string[] = []

  for (const raw of skills) {
    const skill = raw.trim()
    const key = normalise(skill)
    if (!skill || key.length < 2 || seen.has(key)) continue
    seen.add(key)
    const found = AMBIGUOUS[key] ? AMBIGUOUS[key].test(cvText) : variantsOf(skill).some((v) => appearsIn(haystack, v))
    if (found) matched.push(skill)
    else missing.push(skill)
  }

  const total = matched.length + missing.length
  return {
    coverage: total === 0 ? 0 : Math.round((matched.length / total) * 100),
    matched,
    missing,
  }
}

// Final score: mostly the AI's holistic judgement, anchored by keyword coverage.
// With no skills listed, the AI score stands alone.
export function blendScore(aiScore: number, coverage: number, skillCount: number): number {
  const ai = Math.max(0, Math.min(100, Math.round(aiScore)))
  if (skillCount === 0) return ai
  return Math.round(ai * 0.7 + coverage * 0.3)
}
