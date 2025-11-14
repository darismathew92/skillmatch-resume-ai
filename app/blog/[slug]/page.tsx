"use client"

import Link from "next/link"
import { useParams } from 'next/navigation'

const blogContent: Record<string, any> = {
  "launch-announcement": {
    title: "I Just Launched a Free AI Tool to Instantly Customize Your Resume",
    date: "2025-01-15",
    readTime: "5 min read",
    category: "Product Launch",
    content: `
      <p>Job hunting is already stressful enough — customizing your resume for every single application shouldn't make it harder. That's why I built something to make the process faster, smarter, and completely hassle-free.</p>

      <p>Today, I'm excited to share a <strong>free AI Resume & Email Customizer</strong> designed for anyone applying to jobs and tired of repetitive editing.</p>

      <h2>How It Works</h2>
      <p>Using the tool is simple:</p>
      <ol>
        <li>Upload your current resume (PDF)</li>
        <li>Paste the job description you're applying to</li>
        <li>Get an instantly tailored, editable resume optimized for that specific role</li>
      </ol>

      <p>You can download the customized version through your browser's Save as PDF or Print to PDF options.</p>

      <div class="callout">
        <p><strong>Once your resume is ready, you can also generate:</strong></p>
        <ul>
          <li>A personalized application email</li>
          <li>A polished AI-styled PDF resume</li>
          <li>Content optimized for better ATS performance</li>
        </ul>
      </div>

      <p class="highlight">All of this — in just seconds.</p>

      <h2>Completely Free. No Login. No Signup.</h2>
      <p>The tool runs on advanced AI models, which makes it incredibly fast — processing your resume in seconds, not minutes.</p>

      <h2>Why I Built This</h2>
      <p>I've been through the tiring grind of customizing resumes for every single role. It's repetitive, time-consuming, and honestly discouraging.</p>
      <p>Now, AI can take over that part — and do it in seconds, not hours.</p>
      <p><strong>This tool is meant to give job seekers back their time and energy</strong>, so you can focus on preparing, interviewing, and landing the right opportunity.</p>
    `,
  },
  "ats-optimization-guide": {
    title: "The Complete Guide to ATS-Friendly Resumes in 2025",
    date: "2025-01-14",
    readTime: "8 min read",
    category: "Resume Tips",
    content: `
      <p>Over 90% of large companies use Applicant Tracking Systems (ATS) to screen resumes before they ever reach a human recruiter. If your resume isn't optimized for these systems, it might get rejected automatically — no matter how qualified you are.</p>

      <h2>What is an ATS?</h2>
      <p>An Applicant Tracking System is software that scans, parses, and ranks resumes based on keywords, formatting, and relevance to the job description. Think of it as the first gatekeeper in the hiring process.</p>

      <h2>Common ATS Mistakes That Get Resumes Rejected</h2>
      
      <h3>1. Complex Formatting</h3>
      <p>Tables, text boxes, headers, footers, and graphics confuse ATS software. Stick to simple, clean formatting with standard fonts like Arial, Calibri, or Times New Roman.</p>

      <h3>2. Missing Keywords</h3>
      <p>ATS systems scan for specific keywords from the job description. If your resume doesn't include relevant terms, it won't rank high enough to reach human eyes.</p>

      <h3>3. Wrong File Format</h3>
      <p>Always submit your resume as a .docx or PDF unless specifically requested otherwise. Some older ATS struggle with PDFs, but modern systems handle them fine.</p>

      <h3>4. Creative Section Titles</h3>
      <p>Use standard headings like "Work Experience," "Education," and "Skills" instead of creative alternatives like "My Journey" or "Where I've Been."</p>

      <div class="callout">
        <p><strong>Pro Tip:</strong> ResumeAlign automatically formats your resume to be ATS-friendly while maintaining professional aesthetics.</p>
      </div>

      <h2>How to Optimize Your Resume for ATS</h2>

      <h3>Step 1: Use the Right Keywords</h3>
      <p>Read the job description carefully and identify key skills, qualifications, and requirements. Include these exact terms in your resume where relevant.</p>

      <h3>Step 2: Keep Formatting Simple</h3>
      <ul>
        <li>Use standard fonts (10-12pt)</li>
        <li>Avoid columns and text boxes</li>
        <li>Use standard bullet points</li>
        <li>Don't embed images or logos</li>
        <li>Stick to standard section headings</li>
      </ul>

      <h3>Step 3: Spell Out Acronyms</h3>
      <p>Include both the acronym and full term: "Search Engine Optimization (SEO)" instead of just "SEO." ATS might search for either version.</p>

      <h3>Step 4: Tailor for Each Application</h3>
      <p>Generic resumes rarely score well in ATS. Customize your resume for each job by emphasizing relevant experience and using keywords from the specific job posting.</p>

      <h2>Testing Your Resume</h2>
      <p>Before submitting, copy your resume text and paste it into a plain text editor. If it looks jumbled or missing information, the ATS probably can't read it properly either.</p>

      <p class="highlight">The good news? With tools like ResumeAlign, you can generate ATS-optimized resumes tailored to each job in minutes, not hours.</p>
    `,
  },
  "resume-keywords": {
    title: "How to Use Keywords in Your Resume (Without Keyword Stuffing)",
    date: "2025-01-13",
    readTime: "6 min read",
    category: "Resume Tips",
    content: `
      <p>Keywords are essential for getting past ATS filters, but cramming your resume with buzzwords makes you look desperate — and unqualified. Here's how to strike the perfect balance.</p>

      <h2>Why Keywords Matter</h2>
      <p>Recruiters and ATS systems scan for specific terms related to skills, qualifications, and experience. Including the right keywords increases your chances of getting noticed, but context matters more than frequency.</p>

      <h2>Types of Keywords to Include</h2>

      <h3>1. Hard Skills</h3>
      <p>Technical abilities and specific tools: Python, Excel, Project Management, Data Analysis, SEO, Adobe Creative Suite</p>

      <h3>2. Soft Skills</h3>
      <p>Interpersonal abilities: Leadership, Communication, Problem-Solving, Teamwork, Adaptability</p>

      <h3>3. Industry Terms</h3>
      <p>Job-specific jargon: Agile Methodology, B2B Sales, Content Marketing, Supply Chain Management</p>

      <h3>4. Certifications & Qualifications</h3>
      <p>Relevant credentials: PMP, CPA, AWS Certified, Google Analytics Certified</p>

      <h2>How to Find the Right Keywords</h2>

      <h3>Step 1: Analyze the Job Description</h3>
      <p>Look for repeated terms and phrases in the "Requirements" and "Qualifications" sections. These are your primary keywords.</p>

      <h3>Step 2: Research Industry Standards</h3>
      <p>Review similar job postings to identify common terms used across your field.</p>

      <h3>Step 3: Check LinkedIn Profiles</h3>
      <p>Look at profiles of people in similar roles to see what keywords they emphasize.</p>

      <div class="callout">
        <p><strong>Smart Tip:</strong> ResumeAlign's AI automatically identifies and strategically places relevant keywords from job descriptions into your resume.</p>
      </div>

      <h2>Strategic Keyword Placement</h2>

      <h3>✅ DO:</h3>
      <ul>
        <li>Integrate keywords naturally into bullet points</li>
        <li>Use them in context with specific achievements</li>
        <li>Include variations (SEO, Search Engine Optimization)</li>
        <li>Place them in your skills section and experience descriptions</li>
      </ul>

      <h3>❌ DON'T:</h3>
      <ul>
        <li>List keywords without context</li>
        <li>Repeat the same keyword excessively</li>
        <li>Use keywords for skills you don't actually have</li>
        <li>Hide keywords in white text (ATS can detect this)</li>
      </ul>

      <h2>Example: Bad vs. Good Keyword Usage</h2>

      <p><strong>❌ Bad (Keyword Stuffing):</strong></p>
      <p class="example">"Skilled in project management, project planning, project execution, project delivery, and project coordination."</p>

      <p><strong>✅ Good (Strategic Placement):</strong></p>
      <p class="example">"Led project management for 5+ cross-functional initiatives, delivering projects 15% under budget through strategic planning and agile execution."</p>

      <p class="highlight">Remember: Keywords should enhance your resume, not replace your actual accomplishments.</p>
    `,
  },
  "tailoring-resume-tips": {
    title: "5 Steps to Tailor Your Resume for Any Job in Under 10 Minutes",
    date: "2025-01-12",
    readTime: "7 min read",
    category: "Job Search",
    content: `
      <p>Sending the same generic resume to every job is the fastest way to get rejected. But tailoring your resume doesn't have to take hours. Here's how to do it quickly and effectively.</p>

      <h2>Why Tailoring Matters</h2>
      <p>Recruiters spend an average of 6-8 seconds scanning each resume. A tailored resume immediately shows you're a strong match by highlighting relevant experience and using the right keywords.</p>

      <h2>5-Step Quick Tailoring Process</h2>

      <h3>Step 1: Read the Job Description Carefully (2 minutes)</h3>
      <p>Highlight or note:</p>
      <ul>
        <li>Required skills and qualifications</li>
        <li>Preferred experience</li>
        <li>Key responsibilities</li>
        <li>Repeated terms or phrases</li>
      </ul>

      <h3>Step 2: Adjust Your Professional Summary (1 minute)</h3>
      <p>Rewrite your opening statement to match the role. Mention the job title and 2-3 key qualifications they're seeking.</p>

      <p><strong>Example:</strong></p>
      <p class="example">"Results-driven Marketing Manager with 5+ years of experience in digital strategy and content marketing, specializing in B2B SaaS growth and data-driven campaign optimization."</p>

      <h3>Step 3: Reorder and Emphasize Relevant Experience (3 minutes)</h3>
      <p>Move your most relevant work experience to the top. Rewrite 2-3 bullet points per job to emphasize accomplishments that align with the new role.</p>

      <div class="callout">
        <p><strong>Pro Tip:</strong> Use the STAR method (Situation, Task, Action, Result) to make your bullets more impactful.</p>
      </div>

      <h3>Step 4: Update Your Skills Section (2 minutes)</h3>
      <p>Reorder skills to prioritize those mentioned in the job description. Add any relevant skills you have but forgot to include.</p>

      <h3>Step 5: Quick Final Check (2 minutes)</h3>
      <p>Scan your resume to ensure:</p>
      <ul>
        <li>Job title variations match (if applicable)</li>
        <li>Keywords from the job description appear naturally</li>
        <li>Formatting is clean and ATS-friendly</li>
        <li>No spelling or grammar errors</li>
      </ul>

      <h2>Speed Up the Process with AI</h2>
      <p>Manually tailoring resumes for dozens of applications is exhausting. That's where ResumeAlign comes in.</p>

      <p class="highlight">Upload your resume, paste the job description, and get a fully customized resume in seconds — not minutes or hours.</p>

      <h2>Tailoring Checklist</h2>
      <ul>
        <li>✅ Professional summary mentions the target role</li>
        <li>✅ Relevant experience is prioritized</li>
        <li>✅ Keywords from job description are included</li>
        <li>✅ Skills section reflects job requirements</li>
        <li>✅ Accomplishments are quantified with metrics</li>
        <li>✅ Formatting is clean and ATS-friendly</li>
      </ul>

      <p>With these steps, you can tailor your resume for any job in under 10 minutes — or let AI do it even faster.</p>
    `,
  },
  "cover-email-mistakes": {
    title: "7 Application Email Mistakes That Cost You Interviews",
    date: "2025-01-11",
    readTime: "5 min read",
    category: "Email Tips",
    content: `
      <p>Your application email is often the first thing a recruiter reads — even before opening your resume. Yet most job seekers treat it as an afterthought. Don't make these costly mistakes.</p>

      <h2>Mistake #1: Generic Subject Lines</h2>
      <p><strong>❌ Bad:</strong> "Job Application"</p>
      <p><strong>✅ Good:</strong> "Application for Senior Marketing Manager – [Your Name]"</p>
      <p>A specific subject line makes it easy for recruiters to find and prioritize your application.</p>

      <h2>Mistake #2: Starting with "To Whom It May Concern"</h2>
      <p>This screams "I didn't do my research." Take 30 seconds to find the hiring manager's name on LinkedIn or the company website.</p>
      <p>If you absolutely can't find it, use "Dear Hiring Manager" or "Dear [Department] Team."</p>

      <h2>Mistake #3: Repeating Your Resume</h2>
      <p>Don't summarize your entire work history. Instead, highlight 2-3 key accomplishments that directly relate to the role.</p>

      <div class="callout">
        <p><strong>Think of it this way:</strong> Your resume is a detailed document. Your email is a compelling preview.</p>
      </div>

      <h2>Mistake #4: Writing a Novel</h2>
      <p>Recruiters receive hundreds of emails. Keep yours to 150-250 words — short, scannable, and impactful.</p>

      <h2>Mistake #5: No Clear Call to Action</h2>
      <p><strong>❌ Weak:</strong> "I look forward to hearing from you."</p>
      <p><strong>✅ Strong:</strong> "I'd love to discuss how my experience in scaling SaaS products can contribute to your team. Are you available for a brief call this week?"</p>

      <h2>Mistake #6: Forgetting to Attach Files</h2>
      <p>This sounds obvious, but it happens all the time. Double-check that your resume (and portfolio, if relevant) is actually attached before hitting send.</p>

      <p><strong>Pro tip:</strong> Attach files first, then write your email. This way, you'll never forget.</p>

      <h2>Mistake #7: Poor Grammar and Typos</h2>
      <p>A single typo can destroy your credibility. Always proofread, or better yet, use a tool like Grammarly or let AI review it.</p>

      <h2>The Perfect Application Email Structure</h2>
      
      <h3>1. Strong Subject Line</h3>
      <p>Include the job title and your name</p>

      <h3>2. Personalized Greeting</h3>
      <p>Use the recruiter's name if possible</p>

      <h3>3. Compelling Opening</h3>
      <p>Mention why you're excited about the role and company</p>

      <h3>4. Brief Value Proposition</h3>
      <p>2-3 sentences highlighting your relevant experience and achievements</p>

      <h3>5. Clear Call to Action</h3>
      <p>Request a meeting or express interest in next steps</p>

      <h3>6. Professional Closing</h3>
      <p>Thank them and include your full contact information</p>

      <div class="callout">
        <p><strong>Short on time?</strong> ResumeAlign can generate personalized, professional application emails tailored to each job — in seconds.</p>
      </div>

      <h2>Final Checklist</h2>
      <ul>
        <li>✅ Subject line includes job title and your name</li>
        <li>✅ Greeting is personalized (if possible)</li>
        <li>✅ Email is concise (150-250 words)</li>
        <li>✅ Mentions specific achievements or skills</li>
        <li>✅ Includes a clear call to action</li>
        <li>✅ Resume is attached</li>
        <li>✅ No typos or grammar mistakes</li>
      </ul>

      <p class="highlight">Your application email is your first impression — make it count.</p>
    `,
  },
}

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  const post = blogContent[slug]

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Blog post not found</h1>
          <Link href="/blog" className="text-blue-600 hover:underline">
            ← Back to all posts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ResumeAlign
            </Link>
            <Link
              href="/app"
              className="px-4 md:px-6 py-2 text-sm md:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Try Now
            </Link>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 md:mb-8 font-medium text-sm md:text-base">
            ← Back to all posts
          </Link>

          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mb-3 md:mb-4 flex-wrap">
            <span className="px-2 md:px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">{post.category}</span>
            <span className="hidden sm:inline">•</span>
            <time>{post.readTime}</time>
            <span className="hidden sm:inline">•</span>
            <time className="text-xs md:text-sm">{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 text-gray-900 leading-tight text-balance">{post.title}</h1>

          <div 
            className="prose prose-sm md:prose-base lg:prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA Box */}
          <div className="mt-8 md:mt-12 p-6 md:p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-center">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4 text-balance">Ready to Put These Tips Into Action?</h3>
            <p className="text-sm md:text-base text-blue-100 mb-4 md:mb-6 text-pretty">Create your tailored, ATS-optimized resume in seconds with ResumeAlign</p>
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all"
            >
              <span className="mr-2">✨</span>
              Try ResumeAlign Free
            </Link>
          </div>

          {/* Author */}
          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200">
            <p className="text-sm md:text-base text-gray-600">
              Written by <span className="font-semibold text-gray-900">Daris Mathew</span> • Creator of ResumeAlign
            </p>
          </div>
        </div>
      </article>

      <style jsx global>{`
        .prose h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: #111827;
        }
        @media (min-width: 768px) {
          .prose h2 {
            font-size: 1.875rem;
            margin-top: 2.5rem;
            margin-bottom: 1rem;
          }
        }
        .prose h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }
        @media (min-width: 768px) {
          .prose h3 {
            font-size: 1.5rem;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
          }
        }
        .prose p {
          margin-bottom: 1rem;
          line-height: 1.7;
          color: #374151;
          font-size: 0.9375rem;
        }
        @media (min-width: 768px) {
          .prose p {
            margin-bottom: 1.25rem;
            line-height: 1.75;
            font-size: 1rem;
          }
        }
        .prose ul, .prose ol {
          margin-bottom: 1rem;
          padding-left: 1.25rem;
        }
        @media (min-width: 768px) {
          .prose ul, .prose ol {
            margin-bottom: 1.25rem;
            padding-left: 1.5rem;
          }
        }
        .prose li {
          margin-bottom: 0.375rem;
          line-height: 1.7;
          font-size: 0.9375rem;
        }
        @media (min-width: 768px) {
          .prose li {
            margin-bottom: 0.5rem;
            line-height: 1.75;
            font-size: 1rem;
          }
        }
        .prose strong {
          font-weight: 600;
          color: #111827;
        }
        .prose .callout {
          background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
          border-left: 4px solid #3b82f6;
          padding: 1rem;
          margin: 1.25rem 0;
          border-radius: 0.5rem;
        }
        @media (min-width: 768px) {
          .prose .callout {
            padding: 1.25rem;
            margin: 1.5rem 0;
          }
        }
        .prose .highlight {
          font-weight: 600;
          font-size: 1rem;
          color: #1f2937;
          margin: 1.25rem 0;
        }
        @media (min-width: 768px) {
          .prose .highlight {
            font-size: 1.125rem;
            margin: 1.5rem 0;
          }
        }
        .prose .example {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 0.875rem;
          border-radius: 0.5rem;
          font-family: monospace;
          font-size: 0.8125rem;
          margin: 0.625rem 0;
          overflow-x: auto;
        }
        @media (min-width: 768px) {
          .prose .example {
            padding: 1rem;
            font-size: 0.875rem;
            margin: 0.75rem 0;
          }
        }
      `}</style>
    </div>
  )
}
