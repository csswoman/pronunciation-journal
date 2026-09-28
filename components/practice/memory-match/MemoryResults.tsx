'use client'

// Planned structure:
// <GameResultsPanel tone="coral" headline summary stats onRestart />

import GameResultsPanel from '@/components/practice/games/shared/GameResultsPanel'
import type { MemoryState } from '@/lib/games/memory-match/engine'

interface MemoryResultsProps {
  state: MemoryState
  onRestart: () => void
}

function headlineFor(attempts: number, totalPairs: number): string {
  const extraAttempts = attempts - totalPairs
  if (extraAttempts <= 2) return '¡Memoria impecable! ⭐⭐⭐'
  if (extraAttempts <= 5) return '¡Excelente trabajo! ⭐⭐'
  return '¡Tablero resuelto! ⭐'
}

export default function MemoryResults({
  state,
  onRestart,
}: MemoryResultsProps) {
  return (
    <GameResultsPanel
      tone="coral"
      headline={headlineFor(state.attempts, state.totalPairs)}
      summary={`Encontraste las ${state.totalPairs} parejas en ${state.attempts} intentos.`}
      stats={[
        { label: 'Puntos', value: state.score },
        { label: 'Intentos', value: state.attempts },
        { label: 'Parejas', value: state.totalPairs },
      ]}
      onRestart={onRestart}
    />
  )
}
