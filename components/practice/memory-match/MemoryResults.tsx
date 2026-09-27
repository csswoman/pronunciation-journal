'use client'

// Planned structure:
// <MemoryResults>
//   <PastelCard tone="coral">
//     <HeaderTitle font-heading />
//     <StarsDisplay stars={stars} />
//     <MetricsGrid attempts score totalPairs />
//     <ActionButtons onRestart onHome />
//   </PastelCard>
// </MemoryResults>

import Link from 'next/link'
import PastelCard from '@/components/layout/PastelCard'
import type { MemoryState } from '@/lib/games/memory-match/engine'

interface MemoryResultsProps {
  state: MemoryState
  onRestart: () => void
}

export default function MemoryResults({
  state,
  onRestart,
}: MemoryResultsProps) {
  const minAttempts = state.totalPairs
  const extraAttempts = state.attempts - minAttempts
  const stars = extraAttempts <= 2 ? 3 : extraAttempts <= 5 ? 2 : 1

  return (
    <div className="w-full max-w-lg mx-auto py-8">
      <PastelCard tone="coral" className="p-6 sm:p-8 rounded-3xl text-ink space-y-6">
        <div className="text-center space-y-2">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink/70">
            ¡TABLERO RESUELTO!
          </span>
          <h2 className="font-heading text-3xl font-extrabold text-ink">
            {stars === 3 ? '¡Memoria Impecable! ⭐⭐⭐' : stars === 2 ? '¡Excelente trabajo! ⭐⭐' : '¡Bien completado! ⭐'}
          </h2>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-ink/5 border border-ink/10">
            <div className="font-mono text-tiny font-bold text-ink/60 uppercase">Puntos</div>
            <div className="font-heading text-2xl font-extrabold text-ink">{state.score}</div>
          </div>
          <div className="p-3 rounded-2xl bg-ink/5 border border-ink/10">
            <div className="font-mono text-tiny font-bold text-ink/60 uppercase">Intentos</div>
            <div className="font-sans text-2xl font-bold text-ink">{state.attempts}</div>
          </div>
          <div className="p-3 rounded-2xl bg-ink/5 border border-ink/10">
            <div className="font-mono text-tiny font-bold text-ink/60 uppercase">Parejas</div>
            <div className="font-sans text-2xl font-bold text-ink">{state.totalPairs}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-ink text-surface-base font-sans text-body-sm font-bold hover:opacity-95 transition-opacity text-center"
          >
            Jugar otra vez
          </button>
          <Link
            href="/practice/games"
            className="flex-1 py-3.5 px-4 rounded-2xl bg-ink/10 text-ink font-sans text-body-sm font-bold hover:bg-ink/15 transition-colors text-center"
          >
            Volver a Juegos
          </Link>
        </div>
      </PastelCard>
    </div>
  )
}
