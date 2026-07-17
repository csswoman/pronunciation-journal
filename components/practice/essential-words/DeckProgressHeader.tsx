// Planned structure:
// <DeckProgressHeader>
//   <Stat × 3 />   — aprendidas x/1000 · vencidas hoy · nuevas hoy x/cupo
// </DeckProgressHeader>

import type { EssentialWordsStats } from '@/hooks/useEssentialWordsSession'

// Persistent deck state. Rendered as a quiet inline line (label: value · …)
// so it reads as ambient context, distinct from the live session HUD below it.
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-fg-subtle">
      {label} <span className="font-semibold tabular-nums text-fg-muted">{value}</span>
    </span>
  )
}

export function DeckProgressHeader({ stats }: { stats: EssentialWordsStats }) {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption">
      <Stat label="Aprendidas" value={`${stats.learned}/${stats.totalWords}`} />
      <span aria-hidden className="text-border-strong">·</span>
      <Stat label="Vencidas hoy" value={String(stats.dueCount)} />
      <span aria-hidden className="text-border-strong">·</span>
      <Stat label="Nuevas hoy" value={`${stats.newToday}/${stats.newQuota}`} />
    </div>
  )
}
