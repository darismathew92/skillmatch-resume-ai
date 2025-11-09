import { track } from "@vercel/analytics"

export const analytics = {
  // Track resume generation
  trackResumeGeneration: (isPro: boolean) => {
    track("resume_generated", {
      user_type: isPro ? "pro" : "free",
    })
  },

  // Track email generation
  trackEmailGeneration: (isPro: boolean) => {
    track("email_generated", {
      user_type: isPro ? "pro" : "free",
    })
  },

  // Track PDF generation
  trackPDFGeneration: (isPro: boolean) => {
    track("pdf_generated", {
      user_type: isPro ? "pro" : "free",
    })
  },

  // Track PDF download
  trackPDFDownload: () => {
    track("pdf_downloaded")
  },

  // Track resume download
  trackResumeDownload: () => {
    track("resume_downloaded")
  },

  // Track email copy/download
  trackEmailCopy: () => {
    track("email_copied")
  },

  trackEmailDownload: () => {
    track("email_downloaded")
  },

  // Track payment initiated
  trackPaymentInitiated: () => {
    track("payment_initiated", {
      amount: 4.99,
    })
  },

  // Track payment completed
  trackPaymentCompleted: (email: string) => {
    track("payment_completed", {
      amount: 4.99,
      email: email,
    })
  },

  // Track upgrade button click
  trackUpgradeClick: (source: string) => {
    track("upgrade_clicked", {
      source: source,
    })
  },

  // Track CV upload
  trackCVUpload: (fileSize: number) => {
    track("cv_uploaded", {
      file_size_kb: Math.round(fileSize / 1024),
    })
  },

  // Track free tier limit reached
  trackFreeLimitReached: () => {
    track("free_limit_reached")
  },

  // Track access restored
  trackAccessRestored: () => {
    track("access_restored")
  },
}
