'use client'

// Planned structure:
// <MemoryCard>
//   <CardInner flipped={isFlipped || isMatched}>
//     <CardFront />
//     <CardBack content={content} kind={kind} />
//   </CardInner>
// </MemoryCard>

import type { MemoryCard as MemoryCardType } from '@/lib/games/memory-match/engine'

interface MemoryCardProps {
  card: MemoryCardType
  disabled: boolean
  onFlip: (cardId: string) => void
}

export default function MemoryCard({
  card,
  disabled,
  onFlip,
}: MemoryCardProps) {
  const isShown = card.isFlipped || card.isMatched

  return (
    <button
      type="button"
      disabled={disabled || isShown}
      onClick={() => onFlip(card.id)}
      className={`relative h-24 sm:h-28 w-full rounded-2xl border-2 font-sans transition-all duration-300 transform-gpu cursor-pointer ${
        card.isMatched
          ? 'bg-accent-mint/15 border-accent-mint text-accent-mint scale-95 opacity-80'
          : isShown
          ? 'bg-surface-card border-primary text-fg shadow-md'
          : 'bg-surface-elevated border-border/60 text-fg-muted hover:border-primary/50 shadow-xs hover:scale-102 active:scale-98'
      }`}
    >
      <div className="flex flex-col items-center justify-center h-full p-2 text-center">
        {isShown ? (
          <>
            {card.kind === 'ipa' && (
              <span className="font-mono text-tiny font-bold text-accent-lilac uppercase mb-0.5">
                IPA
              </span>
            )}
            <span
              className={`font-bold text-pretty ${
                card.kind === 'word'
                  ? 'font-heading text-lg sm:text-xl text-primary'
                  : 'text-body-sm text-fg'
              }`}
            >
              {card.content}
            </span>
          </>
        ) : (
          <span className="font-mono text-2xl font-extrabold text-border/60">
            ?
          </span>
        )}
      </div>
    </button>
  )
}
