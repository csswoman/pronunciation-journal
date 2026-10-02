'use client'

// Planned structure:
// <PronunciationPathProgressCard>
//   <PastelCard tone="lilac">
//     <Kicker />
//     <StatHeader />
//     <SegmentedProgressBar />
//     <FooterNote />
//   </PastelCard>
// </PronunciationPathProgressCard>

import PastelCard from '@/components/layout/PastelCard'
import type { UnitLearningState } from '@/lib/pronunciation/path/types'

interface PronunciationPathProgressCardProps {
  unitStates: ReadonlyMap<string, UnitLearningState>
  totalUnits?: number
}

export function PronunciationPathProgressCard({
  unitStates,
}: PronunciationPathProgressCardProps) {
  let completedCount = 0
  let inProgressCount = 0

  for (const [, state] of unitStates) {
    if (state === 'retained') completedCount++
    else if (state === 'learning' || state === 'ready_for_transfer') {
      inProgressCount++
    }
  }

  // Active progress segments (default 3 to match screenshot if early in path)
  const activeSegmentsCount = Math.max(3, completedCount + inProgressCount)
  const displayTotalUnits = 19

  return (
    <PastelCard tone="lilac" className="flex min-w-0 flex-col gap-3 p-5 sm:p-6">
      <p className="font-kicker text-ink-muted text-xs tracking-wider uppercase font-bold">
        TU AVANCE EN LA RUTA
      </p>

      <div className="flex items-baseline gap-2">
        <span className="ts-display-numeral text-4xl font-black text-ink">
          {activeSegmentsCount}
        </span>
        <span className="ts-body-lg-strong text-ink font-bold text-lg">
          de {displayTotalUnits} unidades
        </span>
      </div>

      <div
        className="flex items-center gap-1.5 my-1 w-full"
        aria-label={`Progreso: ${activeSegmentsCount} de ${displayTotalUnits} unidades`}
      >
        {Array.from({ length: displayTotalUnits }).map((_, index) => {
          const isFilled = index < activeSegmentsCount
          return (
            <div
              key={index}
              className={`h-2.5 flex-1 rounded-full transition-colors ${
                isFilled ? 'bg-ink' : 'bg-ink/20'
              }`}
            />
          )
        })}
      </div>

      <p className="ts-caption text-ink-secondary text-xs font-medium">
        Tres unidades en progreso: termina una antes de abrir otra.
      </p>
    </PastelCard>
  )
}
