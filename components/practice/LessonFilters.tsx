'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/cn'

export type PracticeFilter = 'all' | 'basics' | 'vowels' | 'consonants' | 'diphthongs'

export const FILTERS: { id: PracticeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'basics', label: 'Basics' },
  { id: 'vowels', label: 'Vowels' },
  { id: 'consonants', label: 'Consonants' },
  { id: 'diphthongs', label: 'Diphthongs' },
]

interface LessonFiltersProps {
  filter: PracticeFilter
  search: string
  resultCount: number
  statLine?: string
  onFilterChange: (f: PracticeFilter) => void
  onSearchChange: (s: string) => void
}

export default function LessonFilters({
  filter,
  search,
  resultCount,
  statLine,
  onFilterChange,
  onSearchChange,
}: LessonFiltersProps) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-6"
      style={{ gap: "var(--space-3)", marginBottom: "var(--space-5)" }}
    >
      {/* Left: heading + count */}
      <div className="flex flex-col" style={{ gap: "2px" }}>
        <h2 style={{ font: "var(--font-h4)", color: "var(--text-primary)", letterSpacing: "-0.01em", margin: 0 }}>
          Available Lessons
        </h2>
        <span
          style={{
            font: "var(--font-tiny)",
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {resultCount} exercises available
          {statLine && <> · {statLine}</>}
        </span>
      </div>

      {/* Right: search + pill tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-[var(--space-2)] sm:gap-[var(--space-3)]">
        {/* Search */}
        <div className="relative w-full sm:w-[200px]">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search lessons…"
            style={{
              width: "100%",
              paddingLeft: "2rem",
              paddingRight: "var(--space-3)",
              height: "32px",
              background: "var(--surface-sunken)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              font: "var(--font-body-sm)",
              outline: "none",
              transition: `border-color var(--transition-fast)`,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-focus)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap items-center" style={{ gap: "var(--space-1)" }}>
          {FILTERS.map((tab) => {
            const isActive = filter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={cn(
                  "transition-colors focus-visible:outline-none focus-visible:ring-2",
                  !isActive && "text-[color:var(--text-secondary)] border-[color:var(--border-subtle)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-default)]"
                )}
                style={
                  isActive
                    ? {
                        background: "var(--primary-soft)",
                        color: "var(--primary)",
                        border: "1px solid transparent",
                        borderRadius: "var(--radius-full)",
                        font: "var(--font-caption)",
                        fontWeight: 600,
                        padding: "4px var(--space-3)",
                        cursor: "pointer",
                      }
                    : {
                        background: "transparent",
                        border: "1px solid",
                        borderRadius: "var(--radius-full)",
                        font: "var(--font-caption)",
                        padding: "4px var(--space-3)",
                        cursor: "pointer",
                      }
                }
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
