"use client"

import { Toaster } from "@/components/ui/toaster"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-balance">
            Skillmatchresume
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 text-pretty max-w-md mx-auto px-2">
            Align your resume for every job application with the power of AI. Get a tailored CV and professional
            application email in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4 sm:px-0">
            <a
              href="/app"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105 shadow-lg active:scale-100"
            >
              <span className="mr-2 text-xl">✨</span>
              Get Started Free
            </a>
            <a
              href="https://buymeacoffee.com/darismathew"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg bg-[#FFDD00] hover:bg-[#FFED4E] text-gray-900 font-semibold rounded-lg transition-all hover:scale-105 shadow-lg active:scale-100"
            >
              <span className="mr-2 text-xl">☕</span>
              Buy me a coffee
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl">📤</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-gray-900">Upload Your Resume</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Simply upload your current CV in PDF format. Our AI will extract and analyze your experience, skills,
                and qualifications.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl">🎯</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-gray-900">Add Job Details</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Paste the job description and requirements. The AI will understand what the employer is looking for and
                tailor your resume accordingly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100 sm:col-span-2 md:col-span-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl">✨</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-gray-900">Get AI-Tailored Results</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Receive a customized resume, beautifully designed PDF, and a professional application email - all
                optimized for your target job.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-12 sm:py-16 my-8 sm:my-16">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900">Why Use Skillmatchresume?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <div className="flex gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-base sm:text-lg">⚡</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-gray-900">Save Time</h3>
                  <p className="text-sm sm:text-base text-gray-600">Generate customized resumes in minutes instead of hours</p>
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-base sm:text-lg">🎯</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-gray-900">Job-Specific Optimization</h3>
                  <p className="text-sm sm:text-base text-gray-600">Tailored to match each job's unique requirements</p>
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-base sm:text-lg">🤖</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-gray-900">AI-Powered</h3>
                  <p className="text-sm sm:text-base text-gray-600">Advanced AI tailors your resume to match job requirements</p>
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-base sm:text-lg">💼</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-gray-900">Professional Output</h3>
                  <p className="text-sm sm:text-base text-gray-600">Get beautifully designed PDFs and polished application emails</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-gray-900">Get in Touch</h2>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 px-4">Have questions or feedback? We'd love to hear from you!</p>
          <a
            href="mailto:darismathew92@gmail.com?subject=Skillmatchresume Inquiry"
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105 shadow-lg active:scale-100 mx-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="sm:hidden">Contact Us</span>
            <span className="hidden sm:inline">darismathew92@gmail.com</span>
          </a>
        </div>
      </div>

      {/* Blog Section */}
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">Resume Tips & Job Hunting Resources</h2>
              <p className="text-base sm:text-lg text-gray-600">Expert advice to help you land your dream job</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
              <a 
                href="/blog/ats-optimization-guide"
                className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 sm:p-6 rounded-xl hover:shadow-lg transition-all border-2 border-blue-200 hover:border-blue-300 active:bg-blue-100"
              >
                <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">📊</div>
                <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 text-gray-900">ATS Optimization Guide</h3>
                <p className="text-gray-600 text-sm mb-3 sm:mb-4">Learn how to make your resume pass Applicant Tracking Systems</p>
                <span className="text-blue-600 font-medium text-sm">Read more →</span>
              </a>

              <a 
                href="/blog/resume-keywords"
                className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 sm:p-6 rounded-xl hover:shadow-lg transition-all border-2 border-purple-200 hover:border-purple-300 active:bg-purple-100"
              >
                <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">🔑</div>
                <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 text-gray-900">Resume Keywords Guide</h3>
                <p className="text-gray-600 text-sm mb-3 sm:mb-4">Master keyword optimization without stuffing</p>
                <span className="text-purple-600 font-medium text-sm">Read more →</span>
              </a>

              <a 
                href="/blog/tailoring-resume-tips"
                className="bg-gradient-to-br from-pink-50 to-pink-100 p-5 sm:p-6 rounded-xl hover:shadow-lg transition-all border-2 border-pink-200 hover:border-pink-300 sm:col-span-2 md:col-span-1 active:bg-pink-100"
              >
                <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">⚡</div>
                <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 text-gray-900">Quick Tailoring Tips</h3>
                <p className="text-gray-600 text-sm mb-3 sm:mb-4">Customize any resume in under 10 minutes</p>
                <span className="text-pink-600 font-medium text-sm">Read more →</span>
              </a>
            </div>

            <div className="text-center">
              <a
                href="/blog"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-600 active:scale-95 transition-all"
              >
                View All Articles
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 p-8 sm:p-10 md:p-12 rounded-2xl shadow-2xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Ready to Land Your Dream Job?</h2>
          <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 px-2">
            Start customizing your resume with AI today. It's free to use and takes just minutes.
          </p>
          <a
            href="/app"
            className="inline-flex items-center justify-center px-8 sm:px-10 py-3.5 sm:py-4 text-base sm:text-lg bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-lg active:scale-100"
          >
            <span className="mr-2 text-xl">✨</span>
            Start Customizing Now
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-6 sm:py-8 text-center text-gray-600 border-t border-gray-200">
        <p className="mb-2 text-sm sm:text-base">Made with ❤️ by Daris Mathew</p>
        <a
          href="https://buymeacoffee.com/darismathew"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
        >
          Support this project ☕
        </a>
      </footer>

      {/* Toaster */}
      <Toaster />
    </div>
  )
}
