'use client'

// Planned structure:
// <SwipeCardStack>
//   <CardDisplay card={card} timeProgress={timeY} />
//   <SwipeActionButtons onChooseTrap={onAnswer('trap')} onChooseTrue={onAnswer('true')} />
// </SwipeCardStack>

import { useEffect } from 'react'
import type { SwipeCard } from '@/lib/games/false-friends-swipe/deck-builder'
import { Volume2 } from '@/components/icons'
import { speak } from '@/lib/phoneme-practice/tts'

interface SwipeCardStackProps {
  card: SwipeCard
  cardTimeY: number
  currentIndex: number
  totalCards: number
  onAnswer: (choice: 'true' | 'trap') => void
}

export default function SwipeCardStack({
  card,
  cardTimeY,
  currentIndex,
  totalCards,
  onAnswer,
}: SwipeCardStackProps) {
  // Keyboard navigation: Left Arrow = Trap, Right Arrow = True
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        onAnswer('trap')
      } else if (e.key === 'ArrowRight') {
        onAnswer('true')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onAnswer])

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {/* Time Progress Bar */}
      <div className="w-full h-2 rounded-full bg-surface-card border border-border/30 overflow-hidden">
        <div
          style={{ width: `${Math.min(100, cardTimeY)}%` }}
          className="h-full bg-accent-amber transition-all duration-75"
        />
      </div>

      {/* Main Card */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-surface-card border-2 border-border shadow-lg text-center space-y-4">
        <div className="flex items-center justify-between text-caption font-bold text-fg-muted">
          <span>{currentIndex + 1} / {totalCards}</span>
          <button
            type="button"
            onClick={() => speak(card.word, { rate: 0.9 })}
            className="p-1.5 rounded-xl bg-surface-base hover:bg-surface-elevated text-primary transition-colors"
            title="Escuchar pronunciación"
          >
            <Volume2 size={18} />
          </button>
        </div>

        <div className="space-y-1 py-2">
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary">
            {card.word}
          </h2>
          <div className="font-sans text-xl text-fg font-bold">
            = {card.displayedMeaning}
          </div>
        </div>

        <p className="font-sans text-caption text-fg-muted italic">
          ¿Esta traducción es real o es una trampa de falso amigo?
        </p>
      </div>

      {/* Swipe Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={() => onAnswer('trap')}
          className="py-4 px-4 rounded-2xl bg-accent-rose/10 border-2 border-accent-rose/30 hover:border-accent-rose text-accent-rose font-sans text-body-sm font-bold shadow-xs hover:scale-102 active:scale-98 transition-all cursor-pointer text-center"
        >
          ← 🚫 ¡TRAMPA!
        </button>

        <button
          type="button"
          onClick={() => onAnswer('true')}
          className="py-4 px-4 rounded-2xl bg-accent-mint/10 border-2 border-accent-mint/30 hover:border-accent-mint text-accent-mint font-sans text-body-sm font-bold shadow-xs hover:scale-102 active:scale-98 transition-all cursor-pointer text-center"
        >
          VERDAD ✅ →
        </button>
      </div>
    </div>
  )
}
