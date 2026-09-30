// Planned structure:
// <ThisWeekCard>
//   <Kicker> ("ESTA SEMANA")
//   <StatsGrid>
//     <StatBox> (ejercicios)
//     <StatBox> (por día)
//     <FullStatBox> (palabras nuevas)
//   </StatsGrid>
//   <LinkToProgress> ("Ver progreso completo →")
// </ThisWeekCard>

import Link from 'next/link'
import { ArrowRight } from '@/components/icons'
import type { WeeklySummaryStats } from '@/lib/progress/queries'

interface Props {
  stats: WeeklySummaryStats
  showLink?: boolean
}

export function ThisWeekCard({ stats, showLink = true }: Props) {
  const exercises = Math.max(0, stats.exercises7 ?? 0)
  const avgPerDay = Math.round(exercises / 7)
  const newWords = Math.max(0, stats.newWords7 ?? 0)
  const newWordsLabel = newWords === 1
    ? 'palabra nueva · añade otra hoy'
    : 'palabras nuevas · añade otra hoy'

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border-subtle bg-surface p-5 shadow-xs">
      <span className="font-sans text-caption font-extrabold uppercase tracking-wider text-fg-muted">
        Esta semana
      </span>

      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col justify-center rounded-2xl bg-bg-sidebar dark:bg-surface-sunken p-3.5 border border-border-subtle/30">
            <span className="font-display text-[32px] sm:text-[36px] font-extrabold leading-none text-fg tabular-nums">
              {exercises}
            </span>
            <span className="font-sans text-caption font-medium text-fg-muted mt-1.5 truncate">
              ejercicios
            </span>
          </div>

          <div className="flex flex-col justify-center rounded-2xl bg-bg-sidebar dark:bg-surface-sunken p-3.5 border border-border-subtle/30">
            <span className="font-display text-[32px] sm:text-[36px] font-extrabold leading-none text-fg tabular-nums">
              {avgPerDay}
            </span>
            <span className="font-sans text-caption font-medium text-fg-muted mt-1.5 truncate">
              por día
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-2 rounded-2xl bg-bg-sidebar dark:bg-surface-sunken p-3.5 border border-border-subtle/30">
          <span className="font-display text-[28px] sm:text-[32px] font-extrabold leading-none text-fg tabular-nums">
            {newWords}
          </span>
          <span className="font-sans text-caption font-medium text-fg-muted truncate">
            {newWordsLabel}
          </span>
        </div>
      </div>

      {showLink ? (
        <Link
          href="/progress"
          className="focus-ring mt-0.5 inline-flex items-center gap-1.5 self-start font-display text-body-sm font-bold text-fg transition-colors hover:text-primary"
        >
          <span>Ver progreso completo</span>
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
        </Link>
      ) : null}
    </div>
  )
}

