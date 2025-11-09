export function generateFingerprint(): string {
  if (typeof window === "undefined") return ""

  const components = [
    navigator.language,
    navigator.platform,
    navigator.hardwareConcurrency?.toString() || "",
    screen.colorDepth.toString(),
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.maxTouchPoints?.toString() || "0",
  ]

  const fingerprint = components.join("|")

  // Simple hash function
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36)
}

export function getStoredFingerprint(): string {
  if (typeof window === "undefined") return ""

  let fingerprint = localStorage.getItem("deviceFingerprint")

  if (!fingerprint) {
    fingerprint = generateFingerprint()
    localStorage.setItem("deviceFingerprint", fingerprint)
  }

  return fingerprint
}
