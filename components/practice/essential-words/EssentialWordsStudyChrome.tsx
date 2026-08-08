'use client'

// Planned structure:
// <EssentialWordsStudyChrome>
//   exit + progress bar + step counter
// </EssentialWordsStudyChrome>

import { X } from '@/components/icons'
import { cn } from '@/lib/cn'

interface Props {
  current: number
  total: number
  onExit: () => void
  className?: string
}

export function EssentialWordsStudyChrome({ current, total, onExit, className }: Props) {
  const safeTotal = Math.max(total, 1);
  const pct = Math.min(100, Math.round((current / safeTotal) * 100));

  return (
    <div className={cn('flex w-full items-center gap-3', className)}>
      <button
        type="button"
        onClick={onExit}
        aria-label="Salir de la práctica"
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-fg-subtle transition-colors duration-150 ease-out-quart focus-ring hover:bg-surface-raised hover:text-fg-muted"
      >
        <X size={16} aria-hidden />
      </button>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-label={`Paso ${current} de ${safeTotal}`}
        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-sunken"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out-quart"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 font-caption tabular-nums text-fg-muted">
        {current} / {safeTotal}
      </span>
    </div>
  );
}
