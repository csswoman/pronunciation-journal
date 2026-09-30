'use client'

// Planned structure:
// <MemoryMatchSession>
//   {status === 'completed' ? (
//     <MemoryResults state={state} onRestart={() => isPlaying(false)} />
//   ) : !isPlaying ? (
//     <MemorySetup onStart={startGame} />
//   ) : (
//     <GameContainer>
//       <BoardHeader attempts={state.attempts} score={state.score} />
//       <MemoryBoard cards={state.cards} isResolvingMismatch={state.isResolvingMismatch} onFlip={flipCard} />
//     </GameContainer>
//   )}
// </MemoryMatchSession>

import { useMemoryMatchLoop } from '@/hooks/games/useMemoryMatchLoop'
import type { MemoryWordItem } from '@/lib/games/memory-match/schema'
import MemorySetup from './MemorySetup'
import MemoryBoard from './MemoryBoard'
import MemoryResults from './MemoryResults'

interface MemoryMatchSessionProps {
  words: MemoryWordItem[]
}

export default function MemoryMatchSession({ words }: MemoryMatchSessionProps) {
  const { state, isPlaying, startGame, flipCard } = useMemoryMatchLoop(words)

  if (state.status === 'completed') {
    return <MemoryResults state={state} onRestart={() => startGame(state.mode, state.totalPairs)} />
  }

  if (!isPlaying) {
    return <MemorySetup onStart={startGame} />
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 py-4">
      {/* Board Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-card border border-border/40 text-fg shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
              PUNTOS
            </span>
            <div className="font-heading text-xl font-extrabold text-fg">
              {state.score}
            </div>
          </div>
          <div className="h-8 w-px bg-border/40" />
          <div>
            <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
              INTENTOS
            </span>
            <div className="font-sans text-lg font-bold text-fg">
              {state.attempts}
            </div>
          </div>
        </div>

        <div className="font-mono text-caption font-bold text-primary px-3 py-1 rounded-full bg-primary/10">
          {state.matchedPairIds.length} / {state.totalPairs} parejas
        </div>
      </div>

      <MemoryBoard
        cards={state.cards}
        isResolvingMismatch={state.isResolvingMismatch}
        onFlip={flipCard}
      />
    </div>
  )
}
