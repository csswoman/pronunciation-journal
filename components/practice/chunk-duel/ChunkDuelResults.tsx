'use client'

// Planned structure:
// <GameResultsPanel tone="butter" headline summary stats onRestart>
//   {missHistory.length > 0 && (
//     <GameReviewList title="Bloques para estudiar">
//       <ChunkMissItem />
//     </GameReviewList>
//   )}
// </GameResultsPanel>

import GameResultsPanel from '@/components/practice/games/shared/GameResultsPanel'
import GameReviewList from '@/components/practice/games/shared/GameReviewList'
import type { DuelState } from '@/lib/games/chunk-duel/engine'

interface ChunkDuelResultsProps {
  state: DuelState
  onRestart: () => void
}

function headlineFor(hits: number): string {
  if (hits >= 8) return '¡Gran velocidad! ⚡'
  if (hits >= 5) return '¡Buen duelo! ⏱️'
  return 'Práctica completada'
}

export default function ChunkDuelResults({
  state,
  onRestart,
}: ChunkDuelResultsProps) {
  return (
    <GameResultsPanel
      tone="butter"
      headline={headlineFor(state.hits)}
      summary={`Ganaste ${state.hits} de ${state.totalRounds} rondas frente al fantasma.`}
      stats={[
        { label: 'Puntos', value: state.score },
        { label: 'Rondas ganadas', value: state.hits },
        { label: 'Racha máx.', value: state.maxStreak },
      ]}
      onRestart={onRestart}
    >
      {state.missHistory.length > 0 && (
        <GameReviewList title="Bloques para estudiar">
          {state.missHistory.map((miss, idx) => (
            <li key={idx} className="flex flex-col gap-0.5 py-2">
              <div className="flex items-center justify-between font-sans text-body-sm font-bold text-ink">
                <span>{miss.chunk.chunk}</span>
                <span className="font-sans text-caption font-normal text-ink-secondary">
                  ({miss.chunk.meaning})
                </span>
              </div>
              <div className="font-sans text-caption italic text-ink-secondary">
                «{miss.chunk.example}»
              </div>
            </li>
          ))}
        </GameReviewList>
      )}
    </GameResultsPanel>
  )
}
