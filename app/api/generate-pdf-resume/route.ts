import { generateText } from "ai"
import { checkRateLimit, getClientIdentifier, incrementUsage, cleanupOldEntries } from "@/lib/rate-limit"
import { ENABLE_FREE_TIER_LIMITS } from "@/lib/config"

export const maxDuration = 30

const MAX_CV_SIZE = 50000
const MAX_JOB_DESC_SIZE = 10000

const FIXED_CSS_TEMPLATE = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.65; 
      color: #1f2937; 
      background: #f9fafb;
      font-size: 10.5pt;
      -webkit-font-smoothing: antialiased;
      padding: 0;
      margin: 0;
    }
    
    .container { 
      max-width: 900px;
      margin: 0 auto; 
      padding: 48px 56px;
      background: white;
      min-height: 100vh;
    }
    
    .header { 
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .header h1 { 
      font-size: 28pt; 
      margin-bottom: 6px; 
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #111827;
      line-height: 1.2;
    }
    
    .header .title { 
      font-size: 13pt; 
      color: #6b7280;
      font-weight: 500; 
      margin-top: 6px;
      letter-spacing: 0.3px;
    }
    
    .contact { 
      display: flex; 
      flex-wrap: wrap;
      gap: 16px; 
      margin-top: 16px; 
      font-size: 9.5pt; 
      color: #4b5563;
    }
    
    .contact-item { 
      display: inline-flex; 
      align-items: center; 
      gap: 4px;
    }
    
    .section { 
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    
    .section-title { 
      font-size: 15pt; 
      color: #111827; 
      font-weight: 700; 
      margin-bottom: 14px; 
      padding-bottom: 8px; 
      border-bottom: 2px solid #111827;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      page-break-after: avoid;
    }
    
    .content { 
      font-size: 10pt; 
      line-height: 1.7;
      color: #374151;
    }
    
    .experience-item, .education-item { 
      margin-bottom: 20px;
      padding-bottom: 18px;
      border-bottom: 1px solid #e5e7eb;
      page-break-inside: avoid;
    }
    
    .experience-item:last-child, .education-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .item-header { 
      margin-bottom: 10px;
    }
    
    .item-title { 
      font-weight: 700; 
      font-size: 11.5pt; 
      color: #111827; 
      margin-bottom: 4px;
    }
    
    .item-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      color: #6b7280;
      font-size: 10pt;
    }
    
    .item-subtitle { 
      font-weight: 500;
      font-style: italic;
    }
    
    .item-period { 
      font-size: 9.5pt; 
      font-style: italic;
    }
    
    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .skill-item { 
      background: #f3f4f6; 
      padding: 6px 14px; 
      border-radius: 4px; 
      font-size: 9.5pt;
      font-weight: 500;
      color: #374151;
      display: inline-block;
    }
    
    ul { 
      margin-left: 20px; 
      margin-top: 8px; 
    }
    
    li { 
      margin-bottom: 6px;
      font-size: 10pt;
      line-height: 1.65;
      color: #4b5563;
    }
    
    .summary-text {
      background: #f9fafb;
      padding: 16px;
      border-radius: 4px;
      border-left: 3px solid #111827;
      font-size: 10.5pt;
      line-height: 1.7;
      color: #374151;
    }
    
    /* Fixed print styles to match screen display exactly */
    @media print { 
      body { 
        background: white;
        margin: 0;
        padding: 0;
      }
      .container { 
        max-width: none; 
        padding: 48px 56px;
        margin: 0;
        box-shadow: none;
      }
      .header {
        page-break-after: avoid;
      }
      .section {
        page-break-inside: avoid;
      }
      .experience-item, .education-item {
        page-break-inside: avoid;
      }
    }
    
    @media screen and (max-width: 768px) {
      .container { padding: 32px 24px; }
      .header h1 { font-size: 22pt; }
      .contact { flex-direction: column; gap: 8px; }
    }
`

function cleanHtmlOutput(text: string): string {
  let cleaned = text.replace(/```html\s*/gi, "").replace(/```\s*/g, "")
  cleaned = cleaned.trim()

  if (!cleaned.toLowerCase().startsWith("<!doctype")) {
    const doctypeMatch = cleaned.match(/<!doctype[^>]*>/i)
    if (doctypeMatch) {
      const doctypeIndex = cleaned.indexOf(doctypeMatch[0])
      cleaned = cleaned.substring(doctypeIndex)
    }
  }

  return cleaned
}

function generateHtmlWithTemplate(resumeText: string, jobDetails: any): string {
  const sections = parseResumeSections(resumeText)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sections.name || "Resume"}</title>
  <style>
    ${FIXED_CSS_TEMPLATE}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${sections.name || "Professional Resume"}</h1>
      ${sections.title ? `<div class="title">${sections.title}</div>` : ""}
      ${sections.contact ? `<div class="contact">${sections.contact}</div>` : ""}
    </div>
    
    ${
      sections.summary
        ? `
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="summary-text">${sections.summary}</div>
    </div>`
        : ""
    }
    
    ${
      sections.experience
        ? `
    <div class="section">
      <div class="section-title">Experience</div>
      <div class="content">${sections.experience}</div>
    </div>`
        : ""
    }
    
    ${
      sections.skills
        ? `
    <div class="section">
      <div class="section-title">Skills</div>
      <div class="skills-container">${sections.skills}</div>
    </div>`
        : ""
    }
    
    ${
      sections.education
        ? `
    <div class="section">
      <div class="section-title">Education</div>
      <div class="content">${sections.education}</div>
    </div>`
        : ""
    }
    
    ${
      sections.certifications
        ? `
    <div class="section">
      <div class="section-title">Certifications</div>
      <div class="content">${sections.certifications}</div>
    </div>`
        : ""
    }
  </div>
</body>
</html>`
}

function parseResumeSections(text: string) {
  const lines = text.split("\n")
  const sections: any = {}

  sections.name = lines[0]?.trim() || ""
  sections.title = lines[1]?.trim() || ""

  const contactLine = lines.find((l) => l.includes("@") || l.includes("http") || l.includes("+"))
  if (contactLine) {
    const parts = contactLine.split("|").map((p) => p.trim())
    sections.contact = parts.map((p) => `<span class="contact-item">${escapeHtml(p)}</span>`).join("")
  }

  let currentSection = ""
  let currentContent: string[] = []

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!line || line.match(/^[─-]+$/)) continue

    if (line.match(/^(PROFESSIONAL SUMMARY|EXPERIENCE|SKILLS|EDUCATION|CERTIFICATIONS)/i)) {
      if (currentSection && currentContent.length > 0) {
        sections[currentSection.toLowerCase()] = formatSection(currentSection, currentContent)
      }
      currentSection = line.replace(/[:\s]+$/, "")
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }

  if (currentSection && currentContent.length > 0) {
    sections[currentSection.toLowerCase()] = formatSection(currentSection, currentContent)
  }

  return sections
}

function formatSection(sectionName: string, content: string[]): string {
  const text = content.join("\n")

  if (sectionName.match(/SKILLS/i)) {
    const skills = content.filter((l) => l.trim())
    return skills.map((s) => `<div class="skill-item">${escapeHtml(s.replace(/^[•\-*]\s*/, ""))}</div>`).join("")
  }

  return `<div>${escapeHtml(text).replace(/\n/g, "<br>")}</div>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { customizedResume, jobDetails, hasUnlimitedAccess } = body

    if (ENABLE_FREE_TIER_LIMITS && !hasUnlimitedAccess) {
      cleanupOldEntries()
      const identifier = getClientIdentifier(req)
      const rateCheck = checkRateLimit(identifier)

      if (!rateCheck.allowed) {
        return Response.json(
          {
            error: "RATE_LIMIT_EXCEEDED",
            message: rateCheck.reason,
            remaining: 0,
          },
          { status: 429 },
        )
      }
    }

    if (!customizedResume || !jobDetails) {
      return Response.json({ error: "Missing required fields: customizedResume and jobDetails" }, { status: 400 })
    }

    const resumeText = typeof customizedResume === "string" ? customizedResume : JSON.stringify(customizedResume)

    if (resumeText.length > MAX_CV_SIZE) {
      return Response.json({ error: "Resume data too large. Maximum size is 50KB" }, { status: 413 })
    }

    console.log("Starting AI-powered PDF resume generation")

    try {
      const prompt = `You are an expert resume formatter. Transform this resume text into a CLEAN, PROFESSIONAL HTML document using the EXACT CSS and HTML structure provided.

Customized Resume Text:
${resumeText}

Job Title: ${jobDetails.title}
Company: ${jobDetails.company || "Not specified"}

**YOU MUST USE THIS EXACT CSS (DO NOT MODIFY):**
${FIXED_CSS_TEMPLATE}

**HTML STRUCTURE YOU MUST FOLLOW:**
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Name] - Resume</title>
  <style>
  [USE THE EXACT CSS PROVIDED ABOVE]
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>[Full Name]</h1>
      <div class="title">[Professional Title]</div>
      <div class="contact">
        <span class="contact-item">[Email]</span>
        <span class="contact-item">[Phone]</span>
        <span class="contact-item">[LinkedIn/Website]</span>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="summary-text">[Summary text]</div>
    </div>
    
    <div class="section">
      <div class="section-title">Experience</div>
      <div class="content">
        <div class="experience-item">
          <div class="item-header">
            <div class="item-title">[Job Title]</div>
            <div class="item-meta">
              <span class="item-subtitle">[Company Name]</span>
              <span class="item-period">[Date Range]</span>
            </div>
          </div>
          <ul>
            <li>[Achievement bullet point]</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Skills</div>
      <div class="skills-container">
        <div class="skill-item">[Skill]</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Education</div>
      <div class="content">
        <div class="education-item">
          <div class="item-title">[Degree]</div>
          <div class="item-meta">
            <span class="item-subtitle">[School Name]</span>
            <span class="item-period">[Date]</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>

**CRITICAL REQUIREMENTS:**
1. Use the EXACT CSS template provided - DO NOT modify colors, fonts, spacing, or layout
2. Follow the EXACT HTML structure shown above - use the same class names
3. Fill in the content from the resume text in the appropriate sections
4. Return ONLY pure HTML starting with <!DOCTYPE html> and ending with </html>
5. NO explanatory text, commentary, or notes before/after the HTML
6. NO markdown code blocks or backticks
7. DO NOT include company name "${jobDetails.company || ""}" or job title "${jobDetails.title}" in the output

OUTPUT ONLY PURE HTML - NO TEXT BEFORE OR AFTER!`

      const { text } = await generateText({
        model: "meta/llama-3.1-8b",
        prompt,
        maxTokens: 6000,
        temperature: 0.3,
        providerOptions: {
          gateway: {
            order: ["groq", "fireworks", "together"], // Try Groq first (free), then fallback to paid providers
          },
        },
      })

      if (ENABLE_FREE_TIER_LIMITS && !hasUnlimitedAccess) {
        const identifier = getClientIdentifier(req)
        incrementUsage(identifier)
      }

      const cleanedHtml = cleanHtmlOutput(text)
      console.log("AI PDF resume generation complete")
      return Response.json({ htmlResume: cleanedHtml })
    } catch (aiError: any) {
      console.log(`AI generation failed, falling back to template`)

      if (ENABLE_FREE_TIER_LIMITS && !hasUnlimitedAccess) {
        const identifier = getClientIdentifier(req)
        incrementUsage(identifier)
      }

      const html = generateHtmlWithTemplate(resumeText, jobDetails)
      return Response.json({ htmlResume: html, fallback: true, reason: "ai_error" })
    }
  } catch (error) {
    console.error("[v0] Error generating PDF resume:", error)
    return Response.json(
      { error: "Failed to generate PDF resume", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
