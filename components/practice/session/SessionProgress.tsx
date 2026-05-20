'use client'

interface Props {
  current: number
  total: number
}

export function SessionProgress({ current, total }: Props) {
  const safeTotal = Math.max(total, 1)
  const pct = Math.min(100, Math.round((current / safeTotal) * 100))
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-fg-subtle">
        <span>
          Exercise {Math.min(current + 1, total)} of {total}
        </span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div
        className="h-1.5 rounded-[var(--radius-full)] overflow-hidden"
        style={{ background: 'var(--border-subtle)' }}
      >
        <div
          className="h-full rounded-[var(--radius-full)] transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            background: 'var(--gradient-primary)',
          }}
        />
      </div>
    </div>
  )
}
