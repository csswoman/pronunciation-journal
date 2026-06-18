'use client'

// Planned structure:
// <SrsHistoryPanel>
//   <section> (card wrapper)
//     <h2> "SRS History"
//     <div> (groups)
//       <details> per group (open={i === 0})
//         <summary> title + count
//         <ul> items
//           <li> label | sublabel | interval badge | next-review

import type { SrsHistoryGroup } from '@/lib/review/types'

interface Props {
  groups: SrsHistoryGroup[]
}

function daysUntil(isoDate: string | null): number | null {
  if (!isoDate) return null
  return Math.round((new Date(isoDate).getTime() - Date.now()) / 86_400_000)
}

function formatNextReview(isoDate: string | null): string {
  const diff = daysUntil(isoDate)
  if (diff === null) return 'not scheduled'
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  return `in ${diff}d`
}

function NextReviewBadge({ isoDate }: { isoDate: string | null }) {
  const diff = daysUntil(isoDate)
  const label = formatNextReview(isoDate)
  const isUrgent = diff !== null && diff <= 0
  return (
    <span
      className={
        isUrgent
          ? 'inline-flex items-center rounded-full bg-error-soft px-2 py-0.5 font-caption text-error'
          : 'inline-flex items-center rounded-full bg-surface-hover px-2 py-0.5 font-caption text-fg-muted'
      }
    >
      {label}
    </span>
  )
}

export function SrsHistoryPanel({ groups }: Props) {
  if (groups.length === 0) return null

  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5">
      <h2 className="font-display text-base font-medium text-fg">SRS History</h2>
      <div className="flex flex-col gap-4">
        {groups.map((group, i) => (
          <details key={group.domain} open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1 font-body-sm font-medium text-fg-secondary marker:hidden [&::-webkit-details-marker]:hidden">
              <span>{group.title}</span>
              <span className="font-caption text-fg-muted">{group.items.length} items</span>
            </summary>
            <ul className="mt-2 flex flex-col divide-y divide-border-subtle">
              {group.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <span
                      className={
                        item.domain === 'sounds'
                          ? 'font-ipa text-primary'
                          : 'font-body-sm text-fg'
                      }
                    >
                      {item.label}
                    </span>
                    {item.sublabel ? (
                      <span className="ml-2 font-caption text-fg-muted">{item.sublabel}</span>
                    ) : null}
                  </div>
                  {item.domain !== 'sentences' ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <NextReviewBadge isoDate={item.nextReviewAt} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  )
}
