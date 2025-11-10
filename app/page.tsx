"use client"

export default function HomePage() {
  // The application logic (state, handlers) is removed as per the update instructions.
  // The component now solely focuses on rendering marketing content.

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-balance">
            ResumeAlign
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 text-pretty max-w-md mx-auto">
            Align your resume for every job application with the power of AI. Get a tailored CV and professional
            application email in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/app"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105 shadow-lg"
            >
              <span className="mr-2 text-xl">✨</span>
              Get Started Free
            </a>
            <a
              href="https://buymeacoffee.com/darismathew"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#FFDD00] hover:bg-[#FFED4E] text-gray-900 font-semibold rounded-lg transition-all hover:scale-105 shadow-lg"
            >
              <span className="mr-2 text-xl">☕</span>
              Buy me a coffee
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">📤</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Upload Your Resume</h3>
              <p className="text-gray-600">
                Simply upload your current CV in PDF format. Our AI will extract and analyze your experience, skills,
                and qualifications.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Add Job Details</h3>
              <p className="text-gray-600">
                Paste the job description and requirements. The AI will understand what the employer is looking for and
                tailor your resume accordingly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Get AI-Tailored Results</h3>
              <p className="text-gray-600">
                Receive a customized resume, beautifully designed PDF, and a professional application email - all
                optimized for your target job.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl my-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Why Use ResumeAlign?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">⚡</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Save Time</h3>
                <p className="text-gray-600">Generate customized resumes in minutes instead of hours</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🎯</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">ATS Optimized</h3>
                <p className="text-gray-600">Formatted to pass Applicant Tracking Systems</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🤖</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">AI-Powered</h3>
                <p className="text-gray-600">Advanced AI tailors your resume to match job requirements</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">💼</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Professional Output</h3>
                <p className="text-gray-600">Get beautifully designed PDFs and polished application emails</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 p-12 rounded-2xl shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Land Your Dream Job?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Start customizing your resume with AI today. It's free to use and takes just minutes.
          </p>
          <a
            href="/app"
            className="inline-flex items-center justify-center px-10 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
          >
            <span className="mr-2 text-xl">✨</span>
            Start Customizing Now
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 border-t border-gray-200">
        <p className="mb-2">Made with ❤️ by Daris Mathew</p>
        <a
          href="https://buymeacoffee.com/darismathew"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Support this project ☕
        </a>
      </footer>

      {/* The application logic section below has been removed as per the update. */}
    </div>
  )
}
