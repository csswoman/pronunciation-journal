'use client'

// Planned structure:
// <ChunkDuelResults>
//   <PastelCard tone="butter">
//     <HeaderTitle font-heading />
//     <MetricsGrid score hits maxStreak />
//     <MissedChunksList />
//     <ActionButtons onRestart onHome />
//   </PastelCard>
// </ChunkDuelResults>

import Link from 'next/link'
import PastelCard from '@/components/layout/PastelCard'
import type { DuelState } from '@/lib/games/chunk-duel/engine'

interface ChunkDuelResultsProps {
  state: DuelState
  onRestart: () => void
}

export default function ChunkDuelResults({
  state,
  onRestart,
}: ChunkDuelResultsProps) {
  return (
    <div className="w-full max-w-lg mx-auto py-8">
      <PastelCard tone="butter" className="p-6 sm:p-8 rounded-3xl text-ink space-y-6">
        <div className="text-center space-y-2">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink/70">
            DUELO FINALIZADO
          </span>
          <h2 className="font-heading text-3xl font-extrabold text-ink">
            ¡Gran velocidad! ⚡
          </h2>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-ink/5 border border-ink/10">
            <div className="font-mono text-tiny font-bold text-ink/60 uppercase">Puntos</div>
            <div className="font-heading text-2xl font-extrabold text-ink">{state.score}</div>
          </div>
          <div className="p-3 rounded-2xl bg-ink/5 border border-ink/10">
            <div className="font-mono text-tiny font-bold text-ink/60 uppercase">Rondas ganadas</div>
            <div className="font-sans text-2xl font-bold text-ink">{state.hits}</div>
          </div>
          <div className="p-3 rounded-2xl bg-ink/5 border border-ink/10">
            <div className="font-mono text-tiny font-bold text-ink/60 uppercase">Racha máx.</div>
            <div className="font-sans text-2xl font-bold text-ink">{state.maxStreak}×</div>
          </div>
        </div>

        {/* Missed Chunks */}
        {state.missHistory.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="font-sans text-body-sm font-bold text-ink">
              Bloques para estudiar:
            </h4>
            <div className="space-y-2">
              {state.missHistory.map((miss, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-ink/5 border border-ink/10 text-body-sm space-y-1">
                  <div className="font-bold text-ink flex items-center justify-between">
                    <span>{miss.chunk.chunk}</span>
                    <span className="text-caption text-ink/60">({miss.chunk.meaning})</span>
                  </div>
                  <div className="text-caption italic text-ink/80">«{miss.chunk.example}»</div>
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
