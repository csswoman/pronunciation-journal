import { History } from 'lucide-react'

import type { ActivitySessionSummary } from '@/lib/progress/activity-types'

import { ProgressCard, ProgressCardHeader } from './ProgressCard'

interface Props {
  sessions: ActivitySessionSummary[]
}

function formatWhen(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / 3_600_000)
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function ActivityHistoryCard({ sessions }: Props) {
  return (
    <ProgressCard>
      <ProgressCardHeader icon={<History size={16} />} title="Recent practice" />

      {sessions.length === 0 ? (
        <p className="py-3 text-center text-sm text-fg-muted">
          Complete a session to see your activity history here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{session.sourceLabel}</p>
                <p className="text-caption text-fg-muted">
                  {session.exercisesTotal} exercises · {session.accuracyPct}% · +{session.xpEarned} XP
                </p>
              </div>
              <span className="shrink-0 text-caption text-fg-subtle">{formatWhen(session.completedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </ProgressCard>
  )
}
