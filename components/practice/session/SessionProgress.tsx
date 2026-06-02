'use client'

interface Props {
  current: number
  total: number
}

export function SessionProgress({ current, total }: Props) {
  const safeTotal = Math.max(total, 1)
  const pct = Math.min(100, Math.round((current / safeTotal) * 100))
  const displayIndex = Math.min(current + 1, total)

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-fg-tertiary">
          Exercise {displayIndex} of {total}
        </span>
        <span className="text-[10px] font-semibold tabular-nums text-fg-tertiary">
          {pct}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Exercise ${displayIndex} of ${total}`}
        className="h-1.5 rounded-full overflow-hidden bg-border-subtle"
      >
        <div
          className="h-full w-full rounded-full bg-primary origin-left transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
    </div>
  )
}
