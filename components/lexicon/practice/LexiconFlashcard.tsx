'use client'

// Planned structure:
// <LexiconFlashcard>
//   <CardFront />      — word + "Tap to reveal" hint
//   <CardBack />       — definition + example + audio + rating buttons
// </LexiconFlashcard>

import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { FlashcardRating } from '@/lib/word-bank/lexicon-review-types'

interface LexiconFlashcardProps {
  word: string
  partOfSpeech?: string
  definition: string
  example?: string | null
  translation?: string
  cardNumber: number
  totalCards: number
  onRate: (rating: FlashcardRating) => void
}

export function LexiconFlashcard({
  word,
  partOfSpeech,
  definition,
  example,
  translation,
  cardNumber,
  totalCards,
  onRate,
}: LexiconFlashcardProps) {
  const [revealed, setRevealed] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  function handleRate(rating: FlashcardRating) {
    setRevealed(false)
    setShowTranslation(false)
    onRate(rating)
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-fg-subtle">
        <span>Review words</span>
        <span className="font-bold tabular-nums px-2.5 py-1 rounded-full bg-[var(--primary)] text-[var(--on-primary)]">
          {cardNumber} / {totalCards}
        </span>
      </div>

      <div
        className="min-h-52 w-full cursor-pointer rounded-2xl border border-border-subtle bg-surface-raised p-6 transition-shadow hover:shadow-md flex flex-col gap-3"
        onClick={() => !revealed && setRevealed(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !revealed && setRevealed(true)}
        aria-label={revealed ? undefined : `Tap to reveal definition of ${word}`}
      >
        <div>
          <p className="text-2xl font-bold text-fg">{word}</p>
          {partOfSpeech && !revealed && (
            <p className="text-xs italic text-fg-subtle mt-0.5">{partOfSpeech}</p>
          )}
        </div>

        {!revealed ? (
          <p className="text-sm text-fg-muted mt-auto">Tap to reveal →</p>
        ) : (
          <>
            <p className="text-sm text-fg-muted leading-snug">
              {partOfSpeech && (
                <span className="text-fg-subtle italic mr-1">({partOfSpeech})</span>
              )}
              {definition}
            </p>
            {example && (
              <p className="text-[11px] italic text-fg-subtle leading-snug pl-2 border-l-2 border-border-default">
                "{example}"
              </p>
            )}
            {translation && (
              <div onClick={(e) => e.stopPropagation()}>
                {showTranslation ? (
                  <p className="text-xs text-fg-subtle">{translation}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTranslation(true)}
                    className="text-xs text-fg-subtle underline underline-offset-2 hover:text-fg transition-colors"
                  >
                    Show translation
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                speak([word, definition, example ? `For example: ${example}` : ''].filter(Boolean).join('. '), 0.9)
              }}
              className="self-start p-1.5 rounded-full text-fg-muted hover:text-fg hover:bg-surface-sunken transition-colors"
              aria-label={`Listen to ${word}`}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {revealed && (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleRate('forgot')}
            className="rounded-xl border border-error/40 bg-error-soft px-3 py-3 text-xs font-semibold text-error transition-colors hover:bg-error/20"
          >
            I don't know it
          </button>
          <button
            type="button"
            onClick={() => handleRate('normal')}
            className="rounded-xl border border-border-subtle bg-surface-raised px-3 py-3 text-xs font-semibold text-fg transition-colors hover:border-border-strong"
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => handleRate('known')}
            className="rounded-xl border border-primary/40 bg-primary-soft px-3 py-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            I already know it
          </button>
        </div>
      )}
    </div>
  )
}
