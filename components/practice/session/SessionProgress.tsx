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
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-tertiary)]">
          Progress
        </span>
        <span className="text-[10px] font-semibold tabular-nums text-[var(--text-tertiary)]">
          {pct}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Exercise ${Math.min(current + 1, total)} of ${total}`}
        className="h-1 rounded-full overflow-hidden bg-[var(--border-subtle)]"
      >
        <div
          className="h-full rounded-full transition-[width] duration-300 bg-[var(--primary)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
