// Planned structure:
// <SessionStatsCard>
//   <SessionHelpPopover />  — "?" cómo funciona (esquina superior derecha)
//   <StatColumn × 3 />   — Nuevas · Aprendiendo · Repaso (contadores de sesión)
//   <DeckLine />          — Aprendidas x/2800 · Vencidas hoy · Nuevas hoy x/10
// </SessionStatsCard>

import { cn } from '@/lib/cn'
import type { EssentialWordsStats, EssentialWordsCounts } from '@/hooks/useEssentialWordsSession'
import { SessionHelpPopover } from './SessionHelpPopover'

interface Props {
  stats: EssentialWordsStats
  counts: EssentialWordsCounts
}

function StatColumn({
  label, value, accent, zero,
}: { label: string; value: number; accent?: boolean; zero?: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5">
      <span
        className={cn(
          'text-xl font-semibold leading-none tabular-nums tracking-tight transition-colors duration-200',
          accent && value > 0
            ? 'text-primary'
            : zero && value === 0
              ? 'text-fg-subtle'
              : 'text-fg-muted',
        )}
      >
        {value}
      </span>
      <span className="text-tiny font-medium text-fg-subtle">
        {label}
      </span>
    </div>
  )
}

export function SessionStatsCard({ stats, counts }: Props) {
  return (
    <div className="relative flex w-full flex-col gap-3 rounded-xl border border-border-subtle bg-transparent px-4 py-3">
      <div className="absolute right-1.5 top-1.5">
        <SessionHelpPopover />
      </div>

      <div className="flex items-start divide-x divide-border-subtle">
        <StatColumn label="Nuevas" value={counts.newRemaining} zero />
        <StatColumn label="Aprendiendo" value={counts.learningRemaining} accent zero />
        <StatColumn label="Repaso" value={counts.reviewRemaining} zero />
      </div>

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
