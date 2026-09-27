'use client'

// Planned structure:
// <SwipeVerdictLine>
//   <ModalContainer>
//     <VerdictTitle isCorrect />
//     <ExplanationText explanation />
//     <ContinueButton />
//   </ModalContainer>
// </SwipeVerdictLine>

import type { SwipeCard } from '@/lib/games/false-friends-swipe/deck-builder'

interface SwipeVerdictLineProps {
  card: SwipeCard
  isCorrect: boolean
  onDismiss: () => void
}

export default function SwipeVerdictLine({
  card,
  isCorrect,
  onDismiss,
}: SwipeVerdictLineProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <div className="w-full max-w-md p-6 rounded-3xl bg-surface-card border border-border shadow-xl text-center space-y-4 animate-in fade-in zoom-in duration-200">
        <span
          className={`inline-block px-3 py-1 rounded-full font-mono text-tiny font-bold uppercase tracking-wider ${
            isCorrect
              ? 'bg-accent-mint/10 text-accent-mint'
              : 'bg-accent-rose/10 text-accent-rose'
          }`}
        >
          {isCorrect ? '¡Acertaste! 🎉' : '¡Cuidado con la trampa! ⚠️'}
        </span>

        <h3 className="font-heading text-2xl font-extrabold text-fg">
          {card.word}
        </h3>

        <div className="p-4 rounded-2xl bg-surface-base border border-border/50 font-sans text-body-sm text-fg leading-relaxed">
          {card.explanation}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-3.5 rounded-2xl bg-ink text-surface-base font-sans text-body font-bold hover:opacity-90 transition-opacity"
        >
          Siguiente palabra 🚀
        </button>
      </div>
    </div>
  )
}
