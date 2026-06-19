// Planned structure:
// <SessionStatsCard>
//   <StatColumn × 3 />   — Nuevas · Aprendiendo · Repaso (contadores de sesión)
//   <DeckLine />          — Aprendidas x/2800 · Vencidas hoy · Nuevas hoy x/10
// </SessionStatsCard>

import { cn } from '@/lib/cn'
import type { EssentialWordsStats, EssentialWordsCounts } from '@/hooks/useEssentialWordsSession'

interface Props {
  stats: EssentialWordsStats
  counts: EssentialWordsCounts
}

function StatColumn({
  label, value, accent, zero,
}: { label: string; value: number; accent?: boolean; zero?: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span
        className={cn(
          'font-display text-4xl font-bold leading-none tabular-nums tracking-tight',
          accent && value > 0
            ? 'text-primary'
            : zero && value === 0
              ? 'text-fg-subtle'
              : 'text-fg',
        )}
      >
        {value}
      </span>
      <span className="text-tiny font-medium uppercase tracking-[0.12em] text-fg-subtle">
        {label}
      </span>
    </div>
  )
}

export function SessionStatsCard({ stats, counts }: Props) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl bg-surface-raised px-6 py-5 shadow-sm">
      {/* Live session counters — typographic hero */}
      <div className="flex items-start divide-x divide-border-subtle">
        <StatColumn label="Nuevas" value={counts.newRemaining} zero />
        <StatColumn label="Aprendiendo" value={counts.learningRemaining} accent zero />
        <StatColumn label="Repaso" value={counts.reviewRemaining} zero />
      </div>

      {/* Persistent deck state — quiet caption line */}
      <p className="m-0 text-center text-caption text-fg-subtle">
        <span className="font-medium text-fg-muted">{stats.learned}</span>/{stats.totalWords} aprendidas
        {' · '}
        <span className="font-medium text-fg-muted">{stats.dueCount}</span> vencidas hoy
        {' · '}
        <span className="font-medium text-fg-muted">{stats.newToday}</span>/{stats.newQuota} nuevas hoy
      </p>
    </div>
  )
}
