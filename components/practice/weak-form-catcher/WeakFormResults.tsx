'use client'

// Planned structure:
// <GameResultsPanel tone="mint" headline summary stats onRestart>
//   {missHistory.length > 0 && (
//     <GameReviewList title="Frases para repasar">
//       <WeakFormMissItem />
//     </GameReviewList>
//   )}
// </GameResultsPanel>

import GameResultsPanel from '@/components/practice/games/shared/GameResultsPanel'
import GameReviewList from '@/components/practice/games/shared/GameReviewList'
import type { WeakFormState } from '@/lib/games/weak-form-catcher/engine'

interface WeakFormResultsProps {
  state: WeakFormState
  onRestart: () => void
}

function headlineFor(hits: number): string {
  if (hits >= 8) return '¡Oído afinado!'
  if (hits >= 4) return 'Buen entrenamiento'
  return 'Sigue entrenando el oído'
}

export default function WeakFormResults({
  state,
  onRestart,
}: WeakFormResultsProps) {
  return (
    <GameResultsPanel
      tone="mint"
      headline={headlineFor(state.hits)}
      summary={`Completaste el entrenamiento con ${state.hits} ${state.hits === 1 ? 'acierto' : 'aciertos'}.`}
      stats={[
        { label: 'Puntos', value: state.score },
        { label: 'Aciertos', value: state.hits },
        { label: 'Racha máx.', value: state.maxStreak },
      ]}
      onRestart={onRestart}
    >
      {state.missHistory.length > 0 && (
        <GameReviewList title="Frases para repasar">
          {state.missHistory.map((miss, idx) => (
            <li key={idx} className="flex flex-col gap-0.5 py-2">
              <div className="font-sans text-body-sm font-bold text-ink">
                «{miss.phrase.reduced}» → <span className="font-semibold text-primary">{miss.phrase.full}</span>
              </div>
              <div className="font-sans text-caption text-ink-secondary">{miss.phrase.ruleEs}</div>
            </li>
          ))}
        </GameReviewList>
      )}
    </GameResultsPanel>
  )
}
