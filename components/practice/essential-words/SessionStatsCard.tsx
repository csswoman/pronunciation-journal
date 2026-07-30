// Planned structure:
// <SessionStatsCard>
//   <SessionHelpPopover />  — "?" cómo funciona
//   <StatColumn × 3 />   — Nuevas · Aprendiendo · Repaso (contadores de sesión)
//   <DeckLine />          — Palabras x/2800 · Vencidas · Nuevas x/10
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
        className={cn( 'type-stat text-h4 tracking-tight transition-colors duration-200', accent && value > 0 ? 'text-primary' : zero && value === 0 ? 'text-fg-subtle' : 'text-fg-muted', )}
      >
        {value}
      </span>
      <span className="font-kicker text-fg-subtle">
        {label}
      </span>
    </div>
  )
}

export function SessionStatsCard({ stats, counts }: Props) {
  const totalWords = new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(stats.totalWords)

  return (
    <section aria-label="Estado de la sesión" className="relative flex w-full flex-col gap-2">
      <div className="flex items-start gap-3">
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-3 sm:gap-5">
          <StatColumn label="Nuevas" value={counts.newRemaining} zero />
          <StatColumn label="Aprendiendo" value={counts.learningRemaining} accent zero />
          <StatColumn label="Repaso" value={counts.reviewRemaining} zero />
        </div>
        <SessionHelpPopover />
      </div>

      <ul aria-label="Resumen de palabras" className="m-0 flex list-none flex-wrap items-center justify-center gap-x-3 gap-y-1 p-0 text-caption text-fg-muted">
        <li>
          Palabras <span className="font-medium text-fg">{stats.learned}/{totalWords}</span>
        </li>
        <li>
          Vencidas <span className="font-medium text-fg">{stats.dueCount}</span>
        </li>
        <li>
          Nuevas <span className="font-medium text-fg">{stats.newToday}/{stats.newQuota}</span>
        </li>
      </ul>
    </section>
  )
}
