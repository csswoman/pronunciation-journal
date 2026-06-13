// Planned structure:
// <DeckProgressHeader>
//   <Stat × 3 />   — aprendidas x/1000 · vencidas hoy · nuevas hoy x/cupo
// </DeckProgressHeader>

import type { Core1000Stats } from '@/hooks/useCore1000Session'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-semibold text-[var(--text-primary)]">{value}</span>
      <span className="text-tiny uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{label}</span>
    </div>
  )
}

export function DeckProgressHeader({ stats }: { stats: Core1000Stats }) {
  return (
    <div className="flex w-full max-w-md items-center justify-around border-b border-[var(--border-subtle)] pb-4">
      <Stat label="Aprendidas" value={`${stats.learned}/${stats.totalWords}`} />
      <Stat label="Vencidas hoy" value={String(stats.dueCount)} />
      <Stat label="Nuevas hoy" value={`${stats.newToday}/${stats.newQuota}`} />
    </div>
  )
}
