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
          accent && value > 0 ? 'text-primary' : 'text-fg',
        )}
      >
        {value}
      </span>
      <span className="text-tiny uppercase tracking-[0.12em] text-fg-subtle">
        {label}
      </span>
    </div>
  )
}

export function SessionProgressHud({ counts }: Props) {
  return (
    <div className="flex w-full items-center justify-around">
      <CountPill label="Nuevas" value={counts.newRemaining} />
      <CountPill label="Aprendiendo" value={counts.learningRemaining} accent />
      <CountPill label="Repaso" value={counts.reviewRemaining} />
    </div>
  )
}
