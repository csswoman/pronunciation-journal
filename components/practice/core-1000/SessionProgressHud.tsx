// Planned structure:
// <SessionProgressHud>
//   <CountPill × 3 />   — New · Learning · Review
// </SessionProgressHud>

import { cn } from '@/lib/cn'
import type { EssentialWordsCounts } from '@/hooks/useEssentialWordsSession'

interface Props {
  counts: EssentialWordsCounts
}

function CountPill({
  label, value, accent,
}: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={cn(
          'text-sm font-semibold tabular-nums',
          accent && value > 0
            ? 'text-[var(--accent)]'
            : 'text-[var(--text-primary)]',
        )}
      >
        {value}
      </span>
      <span className="text-tiny uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
        {label}
      </span>
    </div>
  )
}

export function SessionProgressHud({ counts }: Props) {
  return (
    <div className="flex w-full max-w-md items-center justify-around border-b border-[var(--border-subtle)] pb-4">
      <CountPill label="Nuevas" value={counts.newRemaining} />
      <CountPill label="Aprendiendo" value={counts.learningRemaining} accent />
      <CountPill label="Repaso" value={counts.reviewRemaining} />
    </div>
  )
}
