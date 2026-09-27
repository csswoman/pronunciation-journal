'use client'

// Planned structure:
// <InvadersResults>
//   <PastelCard tone="sky">
//     <HeaderTitle font-heading />
//     <MetricsGrid score hits maxStreak />
//     <ContrastMissesList />
//     <ActionButtons onRestart onHome />
//   </PastelCard>
// </InvadersResults>

import Link from 'next/link'
import PastelCard from '@/components/layout/PastelCard'
import type { InvadersState } from '@/lib/games/phoneme-invaders/engine'

interface InvadersResultsProps {
  state: InvadersState
  onRestart: () => void
}

export default function InvadersResults({
  state,
  onRestart,
}: InvadersResultsProps) {
  // Group misses by contrast
  const contrastStats = state.missHistory.reduce<Record<string, number>>((acc, miss) => {
    if (miss.contrast) {
      acc[miss.contrast] = (acc[miss.contrast] || 0) + 1
    }
    return acc
  }, {})

  return (
    <div className="w-full max-w-lg mx-auto py-8">
      <PastelCard tone="sky" className="p-6 sm:p-8 rounded-3xl text-ink space-y-6">
        <div className="text-center space-y-2">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink/70">
            PARTIDA FINALIZADA
          </span>
          <h2 className="font-heading text-3xl font-extrabold text-ink">
            ¡Buen entrenamiento! 🚀
          </h2>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-ink/5 border border-ink/10">
            <div className="font-mono text-tiny font-bold text-ink/60 uppercase">Puntos</div>
            <div className="font-heading text-2xl font-extrabold text-ink">{state.score}</div>
          </div>
          <div className="p-3 rounded-2xl bg-ink/5 border border-ink/10">
            <div className="font-mono text-tiny font-bold text-ink/60 uppercase">Aciertos</div>
            <div className="font-sans text-2xl font-bold text-ink">{state.hits}</div>
          </div>
          <div className="p-3 rounded-2xl bg-ink/5 border border-ink/10">
            <div className="font-mono text-tiny font-bold text-ink/60 uppercase">Racha máx.</div>
            <div className="font-sans text-2xl font-bold text-ink">{state.maxStreak}×</div>
          </div>
        </div>

        {/* Contrast Errors breakdown */}
        {Object.keys(contrastStats).length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="font-sans text-body-sm font-bold text-ink">
              Contrastes para reforzar:
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(contrastStats).map(([contrast, count]) => (
                <span
                  key={contrast}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-ink/10 font-mono text-caption font-bold text-ink"
                >
                  <span className="text-primary font-bold">/{contrast}/</span>
                  <span className="text-ink/60">({count} fallos)</span>
                </span>
              ))}
            </div>
          </div>
        )}

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
