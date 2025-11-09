export interface DailyUsage {
  date: string // YYYY-MM-DD format
  count: number
}

const FREE_DAILY_LIMIT = 5

export function getDailyUsage(): DailyUsage {
  if (typeof window === "undefined") {
    return { date: getTodayDate(), count: 0 }
  }

  const stored = localStorage.getItem("dailyUsage")
  if (!stored) {
    return { date: getTodayDate(), count: 0 }
  }

  try {
    const usage = JSON.parse(stored) as DailyUsage
    const today = getTodayDate()

    // Reset if it's a new day
    if (usage.date !== today) {
      return { date: today, count: 0 }
    }

    return usage
  } catch {
    return { date: getTodayDate(), count: 0 }
  }
}

export function incrementDailyUsage(): DailyUsage {
  const usage = getDailyUsage()
  const newUsage = { ...usage, count: usage.count + 1 }
  localStorage.setItem("dailyUsage", JSON.stringify(newUsage))
  return newUsage
}

export function getRemainingFreeGenerations(): number {
  const usage = getDailyUsage()
  return Math.max(0, FREE_DAILY_LIMIT - usage.count)
}

export function hasFreeGenerationsLeft(): boolean {
  return getRemainingFreeGenerations() > 0
}

export function hasUnlimitedAccess(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("hasUnlimitedAccess") === "true"
}

export function canGenerate(): { allowed: boolean; reason?: string } {
  if (hasUnlimitedAccess()) {
    return { allowed: true }
  }

  if (hasFreeGenerationsLeft()) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: "You've used all 5 free generations today. Upgrade for unlimited access or try again tomorrow!",
  }
}

function getTodayDate(): string {
  const now = new Date()
  return now.toISOString().split("T")[0] // YYYY-MM-DD
}
