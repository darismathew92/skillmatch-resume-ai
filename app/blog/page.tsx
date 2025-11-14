"use client"

import Link from "next/link"

const blogPosts = [
  {
    slug: "launch-announcement",
    title: "I Just Launched a Free AI Tool to Instantly Customize Your Resume",
    excerpt: "Job hunting is stressful enough — customizing your resume shouldn't make it harder. Learn how ResumeAlign helps you create tailored resumes in seconds.",
    date: "2025-01-15",
    readTime: "5 min read",
    category: "Product Launch",
  },
  {
    slug: "ats-optimization-guide",
    title: "The Complete Guide to ATS-Friendly Resumes in 2025",
    excerpt: "Learn how Applicant Tracking Systems work and discover proven strategies to optimize your resume for automatic screening.",
    date: "2025-01-14",
    readTime: "8 min read",
    category: "Resume Tips",
  },
  {
    slug: "resume-keywords",
    title: "How to Use Keywords in Your Resume (Without Keyword Stuffing)",
    excerpt: "Master the art of strategic keyword placement to pass ATS screening while keeping your resume natural and compelling for human readers.",
    date: "2025-01-13",
    readTime: "6 min read",
    category: "Resume Tips",
  },
  {
    slug: "tailoring-resume-tips",
    title: "5 Steps to Tailor Your Resume for Any Job in Under 10 Minutes",
    excerpt: "Stop sending generic resumes. Learn the exact process to customize your CV for each application quickly and effectively.",
    date: "2025-01-12",
    readTime: "7 min read",
    category: "Job Search",
  },
  {
    slug: "cover-email-mistakes",
    title: "7 Application Email Mistakes That Cost You Interviews",
    excerpt: "Your application email is often read before your resume. Avoid these common mistakes that make recruiters hit delete.",
    date: "2025-01-11",
    readTime: "5 min read",
    category: "Email Tips",
  },
]

export default function BlogPage() {
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

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 md:py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-900 text-balance">Resume Tips & Career Resources</h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2 text-pretty">
            Expert advice to help you craft better resumes, write compelling applications, and land more interviews
          </p>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="container mx-auto px-4 pb-12 md:pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-blue-200"
            >
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mb-3 flex-wrap">
                  <span className="px-2 md:px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium text-xs">
                    {post.category}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <time className="text-xs md:text-sm">{post.readTime}</time>
                </div>

                <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </h2>

                <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 line-clamp-3">{post.excerpt}</p>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <time className="text-xs md:text-sm text-gray-500">{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                  <span className="text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                    Read more →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 p-8 md:p-12 rounded-2xl shadow-2xl">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4 text-balance">Ready to Apply These Tips?</h2>
          <p className="text-base md:text-lg text-blue-100 mb-6 md:mb-8 text-pretty">
            Use ResumeAlign to create tailored, ATS-optimized resumes in minutes
          </p>
          <Link
            href="/app"
            className="inline-flex items-center justify-center px-8 md:px-10 py-3 md:py-4 text-base md:text-lg bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
          >
            <span className="mr-2 text-lg md:text-xl">✨</span>
            Start Customizing Now
          </Link>
        </div>
      </div>
    </div>
  )
}
