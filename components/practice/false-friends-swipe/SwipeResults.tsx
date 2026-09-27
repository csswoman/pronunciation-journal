'use client'

// Planned structure:
// <SwipeResults>
//   <PastelCard tone="lilac">
//     <HeaderTitle font-heading />
//     <MetricsGrid score hits rescueSuccesses />
//     <FalseFriendsList />
//     <ActionButtons onRestart onHome />
//   </PastelCard>
// </SwipeResults>

import Link from 'next/link'
import PastelCard from '@/components/layout/PastelCard'
import type { SwipeState } from '@/lib/games/false-friends-swipe/engine'

interface SwipeResultsProps {
  state: SwipeState
  onRestart: () => void
}

export default function SwipeResults({
  state,
  onRestart,
}: SwipeResultsProps) {
  return (
    <div className="w-full max-w-lg mx-auto py-8">
      <PastelCard tone="lilac" className="p-6 sm:p-8 rounded-3xl text-ink space-y-6">
        <div className="text-center space-y-2">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink/70">
            RESULTADOS
          </span>
          <h2 className="font-heading text-3xl font-extrabold text-ink">
            ¡Falsos amigos desactivados! 🛡️
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
            <div className="font-mono text-tiny font-bold text-ink/60 uppercase">Rescatados</div>
            <div className="font-sans text-2xl font-bold text-ink">{state.rescueSuccesses}</div>
          </div>
        </div>

        {/* Missed False Friends */}
        {state.missHistory.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="font-sans text-body-sm font-bold text-ink">
              Falsos amigos a tener en cuenta:
            </h4>
            <div className="space-y-2">
              {state.missHistory.map((miss, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-ink/5 border border-ink/10 text-body-sm space-y-0.5">
                  <div className="font-bold text-ink">
                    «{miss.card.word}» = <span className="text-primary">{miss.card.friend.actualMeaning}</span>
                  </div>
                  <div className="text-caption text-ink/70">
                    No confundir con «{miss.card.friend.looksLike}» (se dice {miss.card.friend.correctWord})
                  </div>
                </div>
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
