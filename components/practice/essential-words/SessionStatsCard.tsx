// Planned structure:
// <SessionStatsCard>
//   <StatColumn × 3 />        — Nuevas · Aprendiendo · Repaso (contadores de sesión)
//   <SessionHelpPopover />    — "?" cómo funciona + stats de la cuenta (Palabras, Vencidas, Cupo diario)
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
        className={cn( 'type-stat text-h4 tracking-tight transition-colors duration-200', accent && value > 0 ? 'text-info' : zero && value === 0 ? 'text-fg-subtle' : 'text-fg-muted', )}
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
  return (
    <section aria-label="Estado de la sesión" className="relative flex w-full items-start justify-center">
      <div className="grid w-full max-w-xs grid-cols-3 gap-layout-stack sm:gap-space-5">
        <StatColumn label="Nuevas" value={counts.newRemaining} zero />
        <StatColumn label="Aprendiendo" value={counts.learningRemaining} accent zero />
        <StatColumn label="Repaso" value={counts.reviewRemaining} zero />
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2">
        <SessionHelpPopover stats={stats} />
      </div>
    </section>
  )
}
