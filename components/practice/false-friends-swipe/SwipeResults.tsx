'use client'

// Planned structure:
// <GameResultsPanel tone="lilac" headline summary stats onRestart>
//   {missHistory.length > 0 && (
//     <GameReviewList title="Falsos amigos a tener en cuenta">
//       <SwipeMissItem />
//     </GameReviewList>
//   )}
// </GameResultsPanel>

import GameResultsPanel from '@/components/practice/games/shared/GameResultsPanel'
import GameReviewList from '@/components/practice/games/shared/GameReviewList'
import type { SwipeState } from '@/lib/games/false-friends-swipe/engine'

interface SwipeResultsProps {
  state: SwipeState
  onRestart: () => void
}

function headlineFor(hits: number): string {
  if (hits >= 15) return '¡Falsos amigos desactivados! 🛡️'
  if (hits >= 10) return '¡Buen reflejo! 👍'
  return 'Práctica completada'
}

export default function SwipeResults({
  state,
  onRestart,
}: SwipeResultsProps) {
  return (
    <GameResultsPanel
      tone="lilac"
      headline={headlineFor(state.hits)}
      summary={`Completaste el mazo con ${state.hits} aciertos y ${state.rescueSuccesses} rescates.`}
      stats={[
        { label: 'Puntos', value: state.score },
        { label: 'Aciertos', value: state.hits },
        { label: 'Rescatados', value: state.rescueSuccesses },
      ]}
      onRestart={onRestart}
    >
      {state.missHistory.length > 0 && (
        <GameReviewList title="Falsos amigos a tener en cuenta">
          {state.missHistory.map((miss, idx) => (
            <li key={idx} className="flex flex-col gap-0.5 py-2">
              <div className="font-sans text-body-sm font-bold text-ink">
                «{miss.card.word}» = <span className="font-semibold text-primary">{miss.card.friend.actualMeaning}</span>
              </div>
              <div className="font-sans text-caption text-ink-secondary">
                No confundir con «{miss.card.friend.looksLike}» (se dice {miss.card.friend.correctWord})
              </div>
            </li>
          ))}
        </GameReviewList>
      )}
    </GameResultsPanel>
  )
}
