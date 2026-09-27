'use client'

// Planned structure:
// <MemoryBoard>
//   <CardsGrid>
//     <MemoryCard key={card.id} card={card} onFlip={onFlip} />
//   </CardsGrid>
// </MemoryBoard>

import type { MemoryCard as MemoryCardType } from '@/lib/games/memory-match/engine'
import MemoryCard from './MemoryCard'

interface MemoryBoardProps {
  cards: MemoryCardType[]
  isResolvingMismatch: boolean
  onFlip: (cardId: string) => void
}

export default function MemoryBoard({
  cards,
  isResolvingMismatch,
  onFlip,
}: MemoryBoardProps) {
  const colCount = cards.length <= 12 ? 3 : 4

  return (
    <div
      className="grid gap-3 w-full p-4 rounded-3xl bg-surface-base border border-border/60 shadow-inner"
      style={{
        gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
      }}
    >
      {cards.map((card) => (
        <MemoryCard
          key={card.id}
          card={card}
          disabled={isResolvingMismatch}
          onFlip={onFlip}
        />
      ))}
    </div>
  )
}
