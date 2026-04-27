"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
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
  const [hasSavedCV, setHasSavedCV] = useState(false)
  const [jobDetails, setJobDetails] = useState({
    title: "",
    company: "",
    description: "",
    requirements: "",
  })
  const [customInstructions, setCustomInstructions] = useState<string>("")
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

    const savedCV = localStorage.getItem("savedCV")
    if (savedCV) {
      setUploadedCV(savedCV)
      setHasSavedCV(true)
      toast({
        title: "Resume loaded!",
        description: "Your previously saved resume has been loaded",
      })
    }

    const savedCustomizedResume = localStorage.getItem("customizedResume")
    if (savedCustomizedResume) {
      setCustomizedResume(savedCustomizedResume)
    }

    const savedEmail = localStorage.getItem("generatedEmail")
    if (savedEmail) {
      setGeneratedEmail(savedEmail)
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
      console.error("Failed to check rate limit:", error)
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

      console.log("PDF.js version:", pdfjsLib.version)
      console.log("Worker URL:", pdfjsLib.GlobalWorkerOptions.workerSrc)

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

      console.log("Extracted text length:", cleanedText.length)

      setUploadedCV(cleanedText)
      setHasSavedCV(true)

      localStorage.setItem("savedCV", cleanedText)

      analytics.trackCVUpload(file.size)

      toast({
        title: "CV uploaded & saved!",
        description: `Your resume has been saved for future use (${cleanedText.length} characters)`,
      })
    } catch (error) {
      console.error("Error parsing PDF:", error)
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

  const handleClearSavedCV = () => {
    localStorage.removeItem("savedCV")
    setUploadedCV("")
    setHasSavedCV(false)
    toast({
      title: "Resume cleared",
      description: "Your saved resume has been removed",
    })
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
          customInstructions: customInstructions.trim(),
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
          customInstructions: customInstructions.trim(),
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
      // Clipboard permission denied - provide fallback
      const textArea = document.createElement('textarea')
      textArea.value = generatedEmail
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      
      try {
        document.execCommand('copy')
        toast({
          title: "Copied!",
          description: "Email copied to clipboard",
        })
      } catch {
        toast({
          title: "Copy manually",
          description: "Please select and copy the email text manually",
          variant: "destructive",
        })
      } finally {
        document.body.removeChild(textArea)
      }
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
          customInstructions: customInstructions.trim(),
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 md:p-8">
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
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base text-gray-600 hover:text-blue-600 transition-colors min-h-[44px]"
          >
            <span className="text-xl">←</span>
            <span>Back to Home</span>
          </a>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {ENABLE_FREE_TIER_LIMITS && !isPro && (
              <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200 rounded-lg text-xs sm:text-sm font-medium min-h-[44px] flex items-center">
                {remainingFree} free left today
              </div>
            )}
            {isPro && (
              <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium shadow-lg min-h-[44px] flex items-center">
                ⭐ Unlimited Access
              </div>
            )}
            {ENABLE_FREE_TIER_LIMITS && !isPro && remainingFree === 0 && (
              <Button
                onClick={() => router.push("/unlock")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 min-h-[44px] text-sm sm:text-base px-4 sm:px-6"
              >
                Upgrade Now
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6 sm:mb-8 md:mb-10 text-center px-4">
          <h1 className="mb-3 sm:mb-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-balance leading-tight">
            Skillmatchresume
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto text-pretty leading-relaxed">
            Upload your resume and job details to generate a tailored CV and application email powered by AI
          </p>

          <div className="mt-6 sm:mt-8 flex justify-center">
            <a
              href="https://buymeacoffee.com/darismathew"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-[#FFDD00] hover:bg-[#FFED4E] text-gray-900 font-medium rounded-lg transition-all hover:scale-105 shadow-md hover:shadow-lg min-h-[44px] text-sm sm:text-base"
            >
              <span className="text-xl sm:text-2xl">☕</span>
              <span>Buy me a coffee</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-6">
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors shadow-lg">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <span className="text-2xl sm:text-3xl">📤</span>
                  Upload Your Resume
                </CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  Upload your current CV in PDF format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-40 sm:h-36 border-2 border-dashed rounded-lg cursor-pointer bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-300 active:bg-blue-100 transition-colors">
                      <div className="flex flex-col items-center justify-center py-6">
                        {isParsing ? (
                          <>
                            <span className="text-4xl sm:text-5xl mb-3 animate-spin">✨</span>
                            <p className="mb-2 text-sm sm:text-base text-blue-600 px-4 text-center font-semibold">
                              Parsing your PDF...
                            </p>
                          </>
                        ) : (
                          <>
                            <span className="text-4xl sm:text-5xl mb-3 text-gray-500">📤</span>
                            <p className="mb-2 text-sm sm:text-base text-gray-500 px-4 text-center">
                              <span className="font-semibold">Tap to upload</span> or drag and drop
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">PDF files only</p>
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
                    <div className="space-y-3">
                      <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm sm:text-base text-blue-800 font-medium leading-relaxed">
                            ✓ CV {hasSavedCV ? 'loaded' : 'uploaded'} successfully ({uploadedCV.length} characters)
                          </p>
                          <Button
                            onClick={handleClearSavedCV}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      {hasSavedCV && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800 leading-relaxed flex items-center gap-2">
                            <span className="text-base">💾</span>
                            <span>Your resume is saved! Just add job details to generate new applications.</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {!uploadedCV && !isParsing && (
                    <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm sm:text-base text-blue-800 leading-relaxed">
                        ℹ Please upload your CV to get started
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors shadow-lg">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl">Job Details</CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  Enter the job information you're applying for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-sm sm:text-base font-medium">
                    Job Title *
                  </Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., Senior UX Designer"
                    value={jobDetails.title}
                    onChange={(e) => setJobDetails({ ...jobDetails, title: e.target.value })}
                    className="h-12 sm:h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm sm:text-base font-medium">
                    Company Name
                  </Label>
                  <Input
                    id="company"
                    placeholder="e.g., Tech Corp"
                    value={jobDetails.company}
                    onChange={(e) => setJobDetails({ ...jobDetails, company: e.target.value })}
                    className="h-12 sm:h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm sm:text-base font-medium">
                    Job Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Paste the job description here..."
                    className="min-h-32 sm:min-h-36 text-base leading-relaxed"
                    value={jobDetails.description}
                    onChange={(e) => setJobDetails({ ...jobDetails, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-sm sm:text-base font-medium">
                    Key Requirements
                  </Label>
                  <Textarea
                    id="requirements"
                    placeholder="List key skills and requirements..."
                    className="min-h-24 sm:min-h-28 text-base leading-relaxed"
                    value={jobDetails.requirements}
                    onChange={(e) => setJobDetails({ ...jobDetails, requirements: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customInstructions" className="text-sm sm:text-base font-medium flex flex-wrap items-center gap-2">
                    <span>Additional Instructions</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs rounded-full font-medium">
                      ✨ AI Guide
                    </span>
                  </Label>
                  <Textarea
                    id="customInstructions"
                    placeholder="Examples:
• Keep resume under one page
• Emphasize leadership experience
• Include my ML project from 2023
• Focus on achievements with metrics"
                    className="min-h-32 sm:min-h-36 text-base leading-relaxed bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                  />
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-blue-600 text-base flex-shrink-0">💡</span>
                    <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                      <strong>Pro tip:</strong> Tell the AI what to highlight or include. These instructions apply to your resume, email, and PDF.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:gap-4 pt-2">
                  <Button
                    onClick={handleGenerateResume}
                    disabled={isGenerating || !uploadedCV}
                    className="w-full h-14 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg text-base sm:text-lg font-semibold"
                  >
                    <span className="flex items-center justify-center gap-2 w-full">
                      {isGenerating ? (
                        <>
                          <span className="text-xl animate-spin">✨</span>
                          <span>Generating Resume...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">✨</span>
                          <span>Generate Customized Resume</span>
                        </>
                      )}
                    </span>
                  </Button>
                  <Button
                    onClick={handleGenerateEmail}
                    disabled={isGeneratingEmail || !uploadedCV}
                    variant="outline"
                    className="w-full h-14 sm:h-12 border-2 border-purple-300 hover:bg-purple-50 text-base sm:text-lg font-semibold"
                  >
                    <span className="flex items-center justify-center gap-2 w-full">
                      {isGeneratingEmail ? (
                        <>
                          <span className="text-xl animate-spin">✉️</span>
                          <span>Generating Email...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">✉️</span>
                          <span>Generate Application Email</span>
                        </>
                      )}
                    </span>
                  </Button>
                  <Button
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF || !customizedResume}
                    className="w-full h-14 sm:h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg text-base sm:text-lg font-semibold"
                  >
                    <span className="flex items-center justify-center gap-2 w-full">
                      {isGeneratingPDF ? (
                        <>
                          <span className="text-xl animate-spin">✨</span>
                          <span>Designing PDF...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">✨</span>
                          <span>Generate Beautiful PDF</span>
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full border-2 border-blue-100 shadow-lg">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl">Generated Content</CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  Your AI-tailored resume and email will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="resume" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-14 sm:h-12 bg-gradient-to-r from-blue-100 to-purple-100">
                    <TabsTrigger value="resume" className="text-sm sm:text-base font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600">
                      Resume
                    </TabsTrigger>
                    <TabsTrigger value="pdf" className="text-sm sm:text-base font-medium data-[state=active]:bg-white data-[state=active]:text-purple-600">
                      PDF
                    </TabsTrigger>
                    <TabsTrigger value="email" className="text-sm sm:text-base font-medium data-[state=active]:bg-white data-[state=active]:text-pink-600">
                      Email
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="resume" className="mt-6">
                    {customizedResume ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="resumeText" className="text-sm sm:text-base font-medium">
                            Edit your resume before generating PDF
                          </Label>
                          <Textarea
                            id="resumeText"
                            value={customizedResume}
                            onChange={(e) => setCustomizedResume(e.target.value)}
                            className="min-h-[400px] sm:min-h-[500px] md:min-h-[600px] font-mono text-sm bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200 leading-relaxed"
                            placeholder="Your customized resume will appear here..."
                          />
                        </div>
                        <Button onClick={handleDownload} className="w-full h-12 sm:h-11 text-base font-semibold flex items-center justify-center gap-2">
                          <span className="text-lg inline-flex">💾</span>
                          <span>Download Resume</span>
                        </Button>
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                          <p className="text-sm sm:text-base text-blue-800 text-center font-medium leading-relaxed">
                            Want a beautifully designed PDF? Use the "PDF" tab above
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-80 sm:h-96 text-center px-6">
                        <div className="p-6 sm:p-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6">
                          <span className="text-5xl sm:text-6xl">✨</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 text-balance">
                          Ready to customize your resume?
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 text-pretty max-w-md leading-relaxed">
                          Fill in the job details and click "Generate Customized Resume" to create your tailored CV
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="pdf" className="mt-6">
                    {htmlResume ? (
                      <div className="space-y-4">
                        <div className="p-5 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-purple-200 shadow-inner">
                          <div className="flex items-start gap-4 mb-5">
                            <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex-shrink-0">
                              <span className="text-3xl sm:text-4xl">📄</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2 leading-tight">
                                Your Beautiful Resume is Ready!
                              </h3>
                              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                Preview your AI-designed resume or download it as a PDF
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Button onClick={handlePreviewPDF} variant="outline" className="w-full h-12 sm:h-11 border-2 border-purple-300 hover:bg-purple-50 text-base font-semibold flex items-center justify-center gap-2">
                              <span className="text-lg inline-flex">👁️</span>
                              <span>Preview</span>
                            </Button>
                            <Button onClick={handleDownloadPDF} className="w-full h-12 sm:h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base font-semibold flex items-center justify-center gap-2">
                              <span className="text-lg inline-flex">💾</span>
                              <span>Download</span>
                            </Button>
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm sm:text-base text-blue-800 leading-relaxed">
                            💡 Tip: Click "Download" and use "Save as PDF" in the print dialog
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-80 sm:h-96 text-center space-y-6 px-6">
                        <div className="p-6 sm:p-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100">
                          <span className="text-5xl sm:text-6xl">📄</span>
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 text-balance">
                            Create a Beautiful PDF Resume
                          </h3>
                          <p className="text-sm sm:text-base text-gray-500 text-pretty max-w-md leading-relaxed">
                            Generate a professionally designed PDF resume with AI-powered styling
                          </p>
                        </div>
                        <Button
                          onClick={handleGeneratePDF}
                          disabled={isGeneratingPDF || !customizedResume}
                          className="h-12 sm:h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base font-semibold px-6 flex items-center justify-center gap-2"
                        >
                          {isGeneratingPDF ? (
                            <>
                              <span className="text-lg animate-spin inline-flex">✨</span>
                              <span>Designing PDF...</span>
                            </>
                          ) : (
                            <>
                              <span className="text-lg inline-flex">✨</span>
                              <span>Generate Beautiful PDF</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="email" className="mt-6">
                    {generatedEmail ? (
                      <div className="space-y-4">
                        <div className="p-5 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto shadow-inner">
                          <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 leading-relaxed">
                            {generatedEmail}
                          </pre>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Button onClick={handleCopyEmail} variant="outline" className="w-full h-12 sm:h-11 border-2 border-purple-300 hover:bg-purple-50 text-base font-semibold flex items-center justify-center gap-2">
                            <span className="text-lg inline-flex">📋</span>
                            <span>Copy</span>
                          </Button>
                          <Button onClick={handleDownloadEmail} className="w-full h-12 sm:h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-base font-semibold flex items-center justify-center gap-2">
                            <span className="text-lg inline-flex">💾</span>
                            <span>Download</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-80 sm:h-96 text-center px-6">
                        <div className="p-6 sm:p-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-6">
                          <span className="text-5xl sm:text-6xl">✉️</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 text-balance">
                          Generate Your Application Email
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 text-pretty max-w-md leading-relaxed">
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
