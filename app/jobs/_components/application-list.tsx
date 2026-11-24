"use client"

import { useMemo, useState } from "react"
import type { ApplicationStatus, JobApplication } from "@/lib/applications"
import { daysSince, isFollowUpDue, STATUS_LABELS, STATUS_ORDER } from "@/lib/applications"
import { cn } from "@/lib/utils"
import { ScorePill, Spinner, StatusBadge } from "./ui-bits"

type Filter = "all" | "followup" | ApplicationStatus
type Sort = "recent" | "score"

interface Props {
  apps: JobApplication[]
  selectedId: string | null
  busyIds: Set<string>
  onSelect: (id: string) => void
}

export function ApplicationList({ apps, selectedId, busyIds, onSelect }: Props) {
  const [filter, setFilter] = useState<Filter>("all")
  const [sort, setSort] = useState<Sort>("recent")
  const [query, setQuery] = useState("")

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: apps.length, followup: apps.filter((a) => isFollowUpDue(a)).length }
    for (const s of STATUS_ORDER) c[s] = apps.filter((a) => a.status === s).length
    return c
  }, [apps])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return apps
      .filter((a) => (filter === "all" ? true : filter === "followup" ? isFollowUpDue(a) : a.status === filter))
      .filter((a) => !q || `${a.job.title} ${a.job.company} ${a.job.location}`.toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "score" ? (b.match?.score ?? -1) - (a.match?.score ?? -1) : b.updatedAt.localeCompare(a.updatedAt),
      )
  }, [apps, filter, sort, query])

  const filters: Filter[] = ["all", "followup", ...STATUS_ORDER]

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="space-y-3 border-b border-gray-100 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-gray-900">Your applications</p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
            aria-label="Sort applications"
          >
            <option value="recent">Recently updated</option>
            <option value="score">Best match</option>
          </select>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or company"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          aria-label="Search applications"
        />
        <div className="flex flex-wrap gap-1.5">
          {filters
            .filter((f) => f === "all" || counts[f] > 0)
            .map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  f === "followup" && filter !== f && "bg-amber-100 text-amber-800 hover:bg-amber-200",
                )}
              >
                {f === "all" ? "All" : f === "followup" ? "Follow up" : STATUS_LABELS[f]} · {counts[f]}
              </button>
            ))}
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-500">
          No jobs yet. Add a job link above and it will appear here with your match score.
        </div>
      ) : visible.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-500">Nothing matches this filter.</div>
      ) : (
        <ul className="max-h-[560px] divide-y divide-gray-100 overflow-y-auto">
          {visible.map((app) => {
            const due = isFollowUpDue(app)
            const age = daysSince(app.appliedAt)
            return (
              <li key={app.id}>
                <button
                  onClick={() => onSelect(app.id)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors hover:bg-blue-50/50",
                    selectedId === app.id && "bg-blue-50 ring-1 ring-inset ring-blue-200",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{app.job.title || "Untitled role"}</p>
                      <p className="truncate text-sm text-gray-500">
                        {app.job.company || "Unknown company"}
                        {app.job.location ? ` · ${app.job.location}` : ""}
                      </p>
                    </div>
                    {busyIds.has(app.id) ? (
                      <Spinner className="mt-1 text-blue-600" />
                    ) : app.match ? (
                      <ScorePill score={app.match.score} />
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={app.status} />
                    {due && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Follow up due
                      </span>
                    )}
                    {app.status === "applied" && age !== null && !due && (
                      <span className="text-xs text-gray-400">applied {age === 0 ? "today" : `${age}d ago`}</span>
                    )}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
