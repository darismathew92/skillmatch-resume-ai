"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { hasUnlimitedAccess } from "@/lib/free-tier"
import { getStoredFingerprint } from "@/lib/fingerprint"
import { analytics } from "@/lib/analytics"
import { ENABLE_FREE_TIER_LIMITS } from "@/lib/config"

export default function ResumeCustomizer() {
  const router = useRouter()
  const [remainingFree, setRemainingFree] = useState(5)
  const [isPro, setIsPro] = useState(false)
  const [uploadedCV, setUploadedCV] = useState<string>("")
  const [isParsing, setIsParsing] = useState(false)
  const [jobDetails, setJobDetails] = useState({
    title: "",
    company: "",
    description: "",
    requirements: "",
  })
  const [customizedResume, setCustomizedResume] = useState<string>("")
  const [generatedEmail, setGeneratedEmail] = useState<string>("")
  const [htmlResume, setHtmlResume] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const pro = hasUnlimitedAccess()
    setIsPro(pro)

    if (!pro && ENABLE_FREE_TIER_LIMITS) {
      checkServerRateLimit()
    }
  }, [router])

  const checkServerRateLimit = async () => {
    try {
      const fingerprint = getStoredFingerprint()
      const response = await fetch("/api/check-rate-limit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fingerprint": fingerprint,
        },
        body: JSON.stringify({
          hasUnlimitedAccess: false,
        }),
      })

      const data = await response.json()
      if (data.remaining !== undefined) {
        setRemainingFree(data.remaining)
      }
    } catch (error) {
      console.error("[v0] Failed to check rate limit:", error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      })
      return
    }

    setIsParsing(true)

    try {
      const pdfjsLib = await import("pdfjs-dist")

      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      console.log("[v0] PDF.js version:", pdfjsLib.version)
      console.log("[v0] Worker URL:", pdfjsLib.GlobalWorkerOptions.workerSrc)

      const arrayBuffer = await file.arrayBuffer()

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      let fullText = ""

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(" ")
        fullText += pageText + "\n"
      }

      const cleanedText = fullText
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        .trim()

      console.log("[v0] Extracted text length:", cleanedText.length)

      setUploadedCV(cleanedText)

      localStorage.setItem("uploadedCV", cleanedText)

      analytics.trackCVUpload(file.size)

      toast({
        title: "CV uploaded successfully",
        description: `Extracted ${cleanedText.length} characters from your PDF`,
      })
    } catch (error) {
      console.error("[v0] Error parsing PDF:", error)
      toast({
        title: "Error parsing PDF",
        description:
          error instanceof Error ? error.message : "Failed to extract text from PDF. Please try another file.",
        variant: "destructive",
      })
    } finally {
      setIsParsing(false)
    }
  }

  const handleGenerateResume = async () => {
    if (!uploadedCV) {
      toast({
        title: "No CV uploaded",
        description: "Please upload your CV first",
        variant: "destructive",
      })
      return
    }

    if (!jobDetails.title || !jobDetails.description) {
      toast({
        title: "Missing job details",
        description: "Please fill in at least the job title and description",
        variant: "destructive",
      })
      return
    }

    if (ENABLE_FREE_TIER_LIMITS && !isPro && remainingFree <= 0) {
      analytics.trackFreeLimitReached()
      toast({
        title: "Upgrade Required",
        description: "Daily free limit reached. Upgrade for unlimited access or try again tomorrow!",
        variant: "destructive",
        duration: 6000,
      })
      setTimeout(() => router.push("/unlock"), 1500)
      return
    }

    setIsGenerating(true)

    try {
      const fingerprint = getStoredFingerprint()
      const response = await fetch("/api/customize-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fingerprint": fingerprint,
        },
        body: JSON.stringify({
          cvData: uploadedCV,
          jobDetails,
          hasUnlimitedAccess: isPro,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === "RATE_LIMIT_EXCEEDED") {
          analytics.trackFreeLimitReached()
          setRemainingFree(0)
          toast({
            title: "Daily Limit Reached",
            description: data.message,
            variant: "destructive",
            duration: 6000,
          })
          setTimeout(() => router.push("/unlock"), 1500)
          return
        }

        if (data.error === "RATE_LIMIT") {
          toast({
            title: "⏳ AI Service Busy",
            description: data.message || "AI has reached its daily limit. Please try again later.",
            variant: "destructive",
            duration: 8000,
          })
        } else if (data.error === "AI_UNAVAILABLE" || data.error === "AI_ERROR") {
          toast({
            title: "🚫 AI Unavailable",
            description: data.message || "AI service is temporarily unavailable. Please try again later.",
            variant: "destructive",
            duration: 8000,
          })
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to generate customized resume",
            variant: "destructive",
          })
        }
        return
      }

      if (!isPro && ENABLE_FREE_TIER_LIMITS) {
        await checkServerRateLimit()
      }

      setCustomizedResume(data.customizedResume)
      localStorage.setItem("customizedResume", data.customizedResume)

      analytics.trackResumeGeneration(isPro)

      toast({
        title: "Resume customized!",
        description: "Your tailored resume is ready",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate customized resume",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateEmail = async () => {
    if (!uploadedCV) {
      toast({
        title: "No CV uploaded",
        description: "Please upload your CV first",
        variant: "destructive",
      })
      return
    }

    if (!jobDetails.title || !jobDetails.description) {
      toast({
        title: "Missing job details",
        description: "Please fill in at least the job title and description",
        variant: "destructive",
      })
      return
    }

    if (ENABLE_FREE_TIER_LIMITS && !isPro && remainingFree <= 0) {
      analytics.trackFreeLimitReached()
      toast({
        title: "Upgrade Required",
        description: "Daily free limit reached. Upgrade for unlimited access or try again tomorrow!",
        variant: "destructive",
        duration: 6000,
      })
      setTimeout(() => router.push("/unlock"), 1500)
      return
    }

    setIsGeneratingEmail(true)

    try {
      const fingerprint = getStoredFingerprint()
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fingerprint": fingerprint,
        },
        body: JSON.stringify({
          cvData: uploadedCV,
          jobDetails,
          hasUnlimitedAccess: isPro,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === "RATE_LIMIT_EXCEEDED") {
          analytics.trackFreeLimitReached()
          setRemainingFree(0)
          toast({
            title: "Daily Limit Reached",
            description: data.message,
            variant: "destructive",
            duration: 6000,
          })
          setTimeout(() => router.push("/unlock"), 1500)
          return
        }

        if (data.error === "RATE_LIMIT") {
          toast({
            title: "⏳ AI Service Busy",
            description: data.message || "AI has reached its daily limit. Please try again later.",
            variant: "destructive",
            duration: 8000,
          })
        } else if (data.error === "AI_UNAVAILABLE" || data.error === "AI_ERROR") {
          toast({
            title: "🚫 AI Unavailable",
            description: data.message || "AI service is temporarily unavailable. Please try again later.",
            variant: "destructive",
            duration: 8000,
          })
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to generate email",
            variant: "destructive",
          })
        }
        return
      }

      if (!data.email) {
        throw new Error("No email content received")
      }

      if (!isPro && ENABLE_FREE_TIER_LIMITS) {
        await checkServerRateLimit()
      }

      setGeneratedEmail(data.email)
      localStorage.setItem("generatedEmail", data.email)

      analytics.trackEmailGeneration(isPro)

      toast({
        title: "Email generated!",
        description: "Your application email is ready",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate email",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingEmail(false)
    }
  }

  const handleCopyEmail = async () => {
    if (!generatedEmail) return

    try {
      await navigator.clipboard.writeText(generatedEmail)

      analytics.trackEmailCopy()

      toast({
        title: "Copied!",
        description: "Email copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy email",
        variant: "destructive",
      })
    }
  }

  const handleDownloadEmail = () => {
    if (!generatedEmail) return

    const blob = new Blob([generatedEmail], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `application-email-${jobDetails.company || "job"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    analytics.trackEmailDownload()

    toast({
      title: "Downloaded!",
      description: "Your application email has been downloaded",
    })
  }

  const handleSaveToLocalStorage = () => {
    if (customizedResume) {
      localStorage.setItem("customizedResume", customizedResume)
      toast({
        title: "Saved!",
        description: "Customized resume saved to local storage",
      })
    }
  }

  const handleDownload = () => {
    if (!customizedResume) return

    const blob = new Blob([customizedResume], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `customized-resume-${jobDetails.company || "job"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    analytics.trackResumeDownload()

    toast({
      title: "Downloaded!",
      description: "Your customized resume has been downloaded",
    })
  }

  const handleGeneratePDF = async () => {
    if (!customizedResume) {
      toast({
        title: "No customized resume",
        description: "Please generate a customized resume first",
        variant: "destructive",
      })
      return
    }

    if (ENABLE_FREE_TIER_LIMITS && !isPro && remainingFree <= 0) {
      analytics.trackFreeLimitReached()
      toast({
        title: "Upgrade Required",
        description: "Daily free limit reached. Upgrade for unlimited access or try again tomorrow!",
        variant: "destructive",
        duration: 6000,
      })
      setTimeout(() => router.push("/unlock"), 1500)
      return
    }

    setIsGeneratingPDF(true)

    try {
      const fingerprint = getStoredFingerprint()
      const response = await fetch("/api/generate-pdf-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fingerprint": fingerprint,
        },
        body: JSON.stringify({
          customizedResume: customizedResume,
          jobDetails,
          hasUnlimitedAccess: isPro,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === "RATE_LIMIT_EXCEEDED") {
          analytics.trackFreeLimitReached()
          setRemainingFree(0)
          toast({
            title: "Daily Limit Reached",
            description: data.message,
            variant: "destructive",
            duration: 6000,
          })
          setTimeout(() => router.push("/unlock"), 1500)
          return
        }

        if (data.error === "RATE_LIMIT") {
          toast({
            title: "⏳ AI Service Busy",
            description: data.message || "AI has reached its daily limit. Please try again later.",
            variant: "destructive",
            duration: 8000,
          })
        } else if (data.error === "AI_UNAVAILABLE" || data.error === "AI_ERROR") {
          toast({
            title: "🚫 AI Unavailable",
            description: data.message || "AI service is temporarily unavailable. Please try again later.",
            variant: "destructive",
            duration: 8000,
          })
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to generate PDF resume",
            variant: "destructive",
          })
        }
        return
      }

      if (!isPro && ENABLE_FREE_TIER_LIMITS) {
        await checkServerRateLimit()
      }

      setHtmlResume(data.htmlResume)

      analytics.trackPDFGeneration(isPro)

      toast({
        title: "Beautiful resume generated!",
        description: "Your AI-designed resume is ready to download as PDF",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF resume",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!htmlResume) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Please allow popups to download PDF",
        variant: "destructive",
      })
      return
    }

    printWindow.document.write(htmlResume)
    printWindow.document.close()

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }

    analytics.trackPDFDownload()

    toast({
      title: "Print dialog opened",
      description: "Use 'Save as PDF' in the print dialog to download your resume",
    })
  }

  const handlePreviewPDF = () => {
    if (!htmlResume) return

    const previewWindow = window.open("", "_blank")
    if (!previewWindow) {
      toast({
        title: "Error",
        description: "Please allow popups to preview",
        variant: "destructive",
      })
      return
    }

    previewWindow.document.write(htmlResume)
    previewWindow.document.close()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-3 sm:p-4 md:p-8">
      <Script
        src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
        data-name="bmc-button"
        data-slug="darismathew"
        data-color="#FFDD00"
        data-emoji=""
        data-font="Cookie"
        data-text="Buy me a coffee"
        data-outline-color="#000000"
        data-font-color="#000000"
        data-coffee-color="#ffffff"
        strategy="lazyOnload"
      />

      <div className="mx-auto max-w-7xl">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="text-lg">←</span>
            <span>Back to Home</span>
          </a>

          <div className="flex items-center gap-3">
            {ENABLE_FREE_TIER_LIMITS && !isPro && (
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                {remainingFree} free generations left today
              </div>
            )}
            {isPro && (
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium">
                ⭐ Unlimited Access
              </div>
            )}
            {ENABLE_FREE_TIER_LIMITS && !isPro && remainingFree === 0 && (
              <Button
                onClick={() => router.push("/unlock")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Upgrade Now
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6 sm:mb-8 md:mb-10 text-center">
          <h1 className="mb-2 sm:mb-3 text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-balance">
            AI Resume Customizer
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto text-pretty px-4">
            Upload your resume and job details to generate a tailored CV and application email powered by AI
          </p>

          <div className="mt-4 sm:mt-6 flex justify-center">
            <a
              href="https://buymeacoffee.com/darismathew"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#FFDD00] hover:bg-[#FFED4E] text-gray-900 font-medium rounded-lg transition-all hover:scale-105 shadow-md hover:shadow-lg"
            >
              <span className="text-xl">☕</span>
              <span className="text-sm sm:text-base">Buy me a coffee</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-6">
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <span className="text-blue-600">📤</span>
                  Upload Your Resume
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Upload your current CV in PDF format</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 active:bg-gray-200 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-4 pb-5 sm:pt-5 sm:pb-6">
                        {isParsing ? (
                          <>
                            <span className="text-3xl sm:text-4xl mb-2 animate-spin">✨</span>
                            <p className="mb-1 sm:mb-2 text-xs sm:text-sm text-blue-600 px-2 text-center font-semibold">
                              Parsing your PDF...
                            </p>
                          </>
                        ) : (
                          <>
                            <span className="text-3xl sm:text-4xl mb-2 text-gray-500">📤</span>
                            <p className="mb-1 sm:mb-2 text-xs sm:text-sm text-gray-500 px-2 text-center">
                              <span className="font-semibold">Tap to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PDF files only</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        disabled={isParsing}
                      />
                    </label>
                  </div>
                  {uploadedCV && (
                    <div className="p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-green-800">
                        ✓ CV uploaded successfully ({uploadedCV.length} characters extracted)
                      </p>
                    </div>
                  )}
                  {!uploadedCV && !isParsing && (
                    <div className="p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-800">ℹ Please upload your CV to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Job Details</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Enter the job information you're applying for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="jobTitle" className="text-sm">
                    Job Title *
                  </Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., Senior UX Designer"
                    value={jobDetails.title}
                    onChange={(e) => setJobDetails({ ...jobDetails, title: e.target.value })}
                    className="h-11 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="company" className="text-sm">
                    Company Name
                  </Label>
                  <Input
                    id="company"
                    placeholder="e.g., Tech Corp"
                    value={jobDetails.company}
                    onChange={(e) => setJobDetails({ ...jobDetails, company: e.target.value })}
                    className="h-11 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="description" className="text-sm">
                    Job Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Paste the job description here..."
                    className="min-h-28 sm:min-h-32 text-base sm:text-sm"
                    value={jobDetails.description}
                    onChange={(e) => setJobDetails({ ...jobDetails, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="requirements" className="text-sm">
                    Key Requirements
                  </Label>
                  <Textarea
                    id="requirements"
                    placeholder="List key skills and requirements..."
                    className="min-h-20 sm:min-h-24 text-base sm:text-sm"
                    value={jobDetails.requirements}
                    onChange={(e) => setJobDetails({ ...jobDetails, requirements: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 pt-3 sm:pt-4">
                  <Button
                    onClick={handleGenerateResume}
                    disabled={isGenerating || !uploadedCV}
                    className="w-full h-12 sm:h-11"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <span className="mr-2 text-lg animate-spin">✨</span>
                        Generating Resume...
                      </>
                    ) : (
                      <>
                        <span className="mr-2 text-lg">✨</span>
                        Generate Customized Resume
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleGenerateEmail}
                    disabled={isGeneratingEmail || !uploadedCV}
                    variant="outline"
                    className="w-full h-12 sm:h-11 bg-transparent"
                    size="lg"
                  >
                    {isGeneratingEmail ? (
                      <>
                        <span className="mr-2 text-lg animate-spin">✉️</span>
                        Generating Email...
                      </>
                    ) : (
                      <>
                        <span className="mr-2 text-lg">✉️</span>
                        Generate Application Email
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF || !customizedResume}
                    className="w-full h-12 sm:h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="lg"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <span className="mr-2 text-lg animate-spin">✨</span>
                        Designing PDF...
                      </>
                    ) : (
                      <>
                        <span className="mr-2 text-lg">✨</span>
                        Generate Beautiful PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full border-2">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Generated Content</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your AI-tailored resume and email will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="resume" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-12">
                    <TabsTrigger value="resume" className="text-sm sm:text-base">
                      Resume
                    </TabsTrigger>
                    <TabsTrigger value="pdf" className="text-sm sm:text-base">
                      PDF
                    </TabsTrigger>
                    <TabsTrigger value="email" className="text-sm sm:text-base">
                      Email
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="resume" className="mt-4 sm:mt-6">
                    {customizedResume ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="resumeText" className="text-sm font-medium">
                            Edit your resume before generating PDF
                          </Label>
                          <Textarea
                            id="resumeText"
                            value={customizedResume}
                            onChange={(e) => setCustomizedResume(e.target.value)}
                            className="min-h-[400px] sm:min-h-[600px] font-mono text-xs sm:text-sm bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200"
                            placeholder="Your customized resume will appear here..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Button onClick={handleDownload} className="w-full h-11">
                            <span className="mr-2">💾</span>
                            Download
                          </Button>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs sm:text-sm text-blue-800 text-center">
                            Want a beautifully designed PDF? Use the "PDF" tab above
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-80 sm:h-96 text-center px-4">
                        <div className="p-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6">
                          <span className="text-5xl">✨</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to customize your resume?</h3>
                        <p className="text-base text-gray-500 text-balance max-w-md">
                          Fill in the job details and click "Generate Customized Resume" to create your tailored CV
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="pdf" className="mt-4 sm:mt-6">
                    {htmlResume ? (
                      <div className="space-y-4">
                        <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 rounded-full bg-blue-100 flex-shrink-0">
                              <span className="text-2xl">📄</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-base text-gray-900 mb-1">
                                Your Beautiful Resume is Ready!
                              </h3>
                              <p className="text-sm text-gray-600">
                                Preview your AI-designed resume or download it as a PDF
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Button onClick={handlePreviewPDF} variant="outline" className="w-full h-11 bg-transparent">
                              <span className="mr-2">👁️</span>
                              Preview
                            </Button>
                            <Button onClick={handleDownloadPDF} className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                              <span className="mr-2">💾</span>
                              Download
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-800">
                            Tip: Click "Download" and use "Save as PDF" in the print dialog
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-80 sm:h-96 text-center space-y-6 px-4">
                        <div className="p-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                          <span className="text-5xl">📄</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Create a Beautiful PDF Resume</h3>
                          <p className="text-base text-gray-500 text-balance max-w-md">
                            Generate a professionally designed PDF resume with AI-powered styling
                          </p>
                        </div>
                        <Button
                          onClick={handleGeneratePDF}
                          disabled={isGeneratingPDF || !customizedResume}
                          className="h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {isGeneratingPDF ? (
                            <>
                              <span className="mr-2 text-lg animate-spin">✨</span>
                              Designing PDF...
                            </>
                          ) : (
                            <>
                              <span className="mr-2 text-lg">✨</span>
                              Generate Beautiful PDF
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="email" className="mt-4 sm:mt-6">
                    {generatedEmail ? (
                      <div className="space-y-4">
                        <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg border-2 border-gray-200 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-xs sm:text-sm font-mono text-gray-800 leading-relaxed">
                            {generatedEmail}
                          </pre>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Button onClick={handleCopyEmail} variant="outline" className="w-full h-11 bg-transparent">
                            <span className="mr-2">📋</span>
                            Copy
                          </Button>
                          <Button onClick={handleDownloadEmail} className="w-full h-11">
                            <span className="mr-2">💾</span>
                            Download
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-80 sm:h-96 text-center px-4">
                        <div className="p-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-6">
                          <span className="text-5xl">✉️</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Generate Your Application Email</h3>
                        <p className="text-base text-gray-500 text-balance max-w-md">
                          Create a personalized, professional email to accompany your job application
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
