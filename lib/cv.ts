// CV handling in the browser: read text from a PDF, and save it locally.
// The CV never leaves the device except as text inside an AI request.

const CV_KEY = "savedCV"
const CV_NAME_KEY = "savedCVName"
const MAX_CV_CHARS = 50_000 // the API rejects anything larger

export interface SavedCv {
  text: string
  name: string
}

export function loadCv(): SavedCv {
  try {
    return { text: localStorage.getItem(CV_KEY) || "", name: localStorage.getItem(CV_NAME_KEY) || "" }
  } catch {
    return { text: "", name: "" }
  }
}

export function saveCv(cv: SavedCv): boolean {
  try {
    localStorage.setItem(CV_KEY, cv.text)
    localStorage.setItem(CV_NAME_KEY, cv.name)
    return true
  } catch {
    return false
  }
}

export function clearCv(): void {
  try {
    localStorage.removeItem(CV_KEY)
    localStorage.removeItem(CV_NAME_KEY)
  } catch {
    // nothing to clear
  }
}

// Tidies extracted or pasted text while keeping line breaks, which help the AI
// see the CV's structure (headings, roles, bullet points).
export function cleanCvText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_CV_CHARS)
}

export async function readCvPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist")
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    let text = ""
    for (const item of content.items) {
      if (!("str" in item)) continue
      text += item.str + (item.hasEOL ? "\n" : " ")
    }
    pages.push(text)
  }

  const cleaned = cleanCvText(pages.join("\n"))
  if (cleaned.replace(/\s/g, "").length < 100) {
    throw new Error("We couldn't read text from this PDF. If it's a scanned image, paste your CV as text instead.")
  }
  return cleaned
}
