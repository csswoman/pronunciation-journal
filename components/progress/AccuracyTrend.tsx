import { Target } from 'lucide-react'

import type { AccuracyStats } from '@/lib/progress/queries'

interface Props {
  stats: AccuracyStats
}

function qualityLabel(accuracy: number): { text: string; color: string } {
  if (accuracy >= 85) return { text: 'Excellent', color: 'var(--primary)' }
  if (accuracy >= 70) return { text: 'Good', color: 'var(--primary)' }
  if (accuracy >= 50) return { text: 'Improving', color: 'color-mix(in oklch, var(--primary) 70%, oklch(0.6 0.15 60))' }
  return { text: 'Keep going', color: 'color-mix(in oklch, var(--primary) 50%, oklch(0.6 0.15 30))' }
}

export function AccuracyTrend({ stats }: Props) {
  const hasData = stats.totalAnswers7 > 0
  const quality = hasData ? qualityLabel(stats.accuracy7) : null

  // Arc parameters
  const radius = 40
  const strokeWidth = 8
  // Half-circle: from 180° to 0° (left to right)
  const circumference = Math.PI * radius  // semicircle arc length
  const dash = hasData ? (stats.accuracy7 / 100) * circumference : 0

  return (
    <div
      className="flex flex-col gap-5 rounded-3xl p-6"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--line-divider)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: 'color-mix(in oklch, var(--primary) 13%, transparent)',
            color: 'var(--primary)',
          }}
        >
          <Target size={18} />
        </div>
        <span className="text-sm font-semibold text-fg">7-Day Accuracy</span>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center gap-1">
        <div className="relative" style={{ width: 100, height: 56 }}>
          <svg width="100" height="56" viewBox="0 0 100 56">
            {/* Track arc: semicircle */}
            <path
              d="M 6 50 A 44 44 0 0 1 94 50"
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{ stroke: 'var(--line-divider)' }}
            />
            {/* Fill arc */}
            {hasData && (
              <path
                d="M 6 50 A 44 44 0 0 1 94 50"
                fill="none"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                style={{ stroke: quality?.color ?? 'var(--primary)', transition: 'stroke-dasharray 0.5s ease' }}
              />
            )}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
            <span className="text-3xl font-black tracking-tight text-fg">
              {hasData ? `${stats.accuracy7}%` : '—'}
            </span>
          </div>
        </div>

        {quality && (
          <span
            className="text-xs font-semibold"
            style={{ color: quality.color }}
          >
            {quality.text}
          </span>
        )}
      </div>

      <p className="text-center text-xs text-fg-muted">
        {hasData
          ? `Based on ${stats.totalAnswers7.toLocaleString()} answer${stats.totalAnswers7 !== 1 ? 's' : ''} this week`
          : 'No answers recorded in the last 7 days'}
      </p>
    </div>
  )
}
