'use client'

// Planned structure:
// <JournalHistorySidebar>
//   <SidebarHeader: "TUS PÁGINAS" + month label />
//   <SidebarList: list of entries with active card styling on right sidebar />
// </JournalHistorySidebar>

import Link from 'next/link'
import { cn } from '@/lib/cn'
import type { JournalEntryRecord } from '@/lib/journal/types'
import { dedupePrefixLines } from '@/lib/journal/dedupe-prefix-lines'

interface JournalHistorySidebarProps {
  entries: JournalEntryRecord[]
  selectedDate: string
}

export function JournalHistorySidebar({ entries, selectedDate }: JournalHistorySidebarProps) {
  if (entries.length === 0) return null

  // Sort entries descending by date
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime(),
  )

  const monthLabel = formatMonthYear(selectedDate)

  return (
    <nav aria-label="Historial de páginas" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="font-tiny font-semibold uppercase tracking-wider text-fg-muted">
          TUS PÁGINAS
        </span>
        <span className="font-body font-medium text-fg">
          {monthLabel}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {sortedEntries.map((entry) => {
          const isSelected = entry.entryDate === selectedDate
          const previewText = getFirstLine(entry.content) || entry.prompt

          return (
            <Link
              key={entry.id}
              href={`/journal/${entry.entryDate}`}
              aria-current={isSelected ? 'page' : undefined}
              className={cn(
                'focus-ring flex flex-col gap-1.5 rounded-[var(--radius-md)] p-3 transition-all duration-150',
                isSelected
                  ? 'border border-primary/20 bg-primary/5 shadow-xs'
                  : 'bg-transparent hover:bg-surface-sunken',
              )}
            >
              <div className="flex items-center gap-1.5 font-caption font-medium">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    entry.status === 'corrected' && 'bg-success',
                    entry.status === 'submitted' && 'bg-warning',
                    entry.status === 'draft' && 'bg-fg-subtle',
                  )}
                  aria-hidden
                />
                <span className={isSelected ? 'font-mono text-sm font-semibold text-primary' : 'text-fg-muted font-mono text-sm'}>
                  {formatShortDay(entry.entryDate)}
                </span>
              </div>
              <p className="line-clamp-2 font-serif text-sm leading-relaxed text-fg-muted">
                {previewText}
              </p>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function getFirstLine(content: string): string {
  if (!content.trim()) return ''
  const cleaned = dedupePrefixLines(content.split('\n'))
  return cleaned[0] || ''
}

function formatMonthYear(entryDate: string): string {
  try {
    const date = new Date(`${entryDate}T12:00:00`)
    return new Intl.DateTimeFormat('es-PE', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return 'agosto de 2026'
  }
}

function formatShortDay(entryDate: string): string {
  try {
    const date = new Date(`${entryDate}T12:00:00`)
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return entryDate
  }
}
