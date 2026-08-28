'use client'

// Planned structure:
// <LexiconReviewPhase>
//   <LexiconFlashcard />   — one card at a time with undo support
// </LexiconReviewPhase>

import { useState } from 'react'
import { LexiconFlashcard } from './LexiconFlashcard'
import { applyFlashcardRating } from '@/lib/word-bank/srs-queries'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { FlashcardRating, WordRating } from '@/lib/word-bank/lexicon-review-types'

interface LexiconReviewPhaseProps {
  entries: WordBankEntry[]
  posMap?: Map<string, string>
  userId: string
  onComplete: (ratings: WordRating[]) => void
}

export function LexiconReviewPhase({ entries, posMap, userId, onComplete }: LexiconReviewPhaseProps) {
  const [index, setIndex] = useState(0)
  const [ratings, setRatings] = useState<WordRating[]>([])
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleRate(rating: FlashcardRating) {
    if (busy) return
    const entry = entries[index]
    if (!entry) return

    setBusy(true)
    setSaveError(null)
    try {
      const updated = await applyFlashcardRating(userId, {
        sourceRef: entry.source_ref ?? entry.id,
        text: entry.text,
        definition: entry.meaning ?? '',
        example: entry.example,
        difficulty: entry.difficulty ?? 0,
      }, rating)

      const next: WordRating[] = [...ratings, { entry: updated, rating }]
      const nextIndex = index + 1

      if (nextIndex >= entries.length) {
        onComplete(next)
      } else {
        setRatings(next)
        setIndex(nextIndex)
      }
    } catch (err) {
      console.error('[LexiconReviewPhase] applyFlashcardRating failed', err)
      setSaveError('No se pudo guardar esta valoración. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  function handleUndo() {
    if (index === 0 || ratings.length === 0 || busy) return
    setRatings((prev) => prev.slice(0, -1))
    setIndex((i) => Math.max(0, i - 1))
  }

  const current = entries[index]
  if (!current) return null

  return (
    <main className="flex w-full items-center justify-center px-[var(--layout-page-inline)] pt-8 sm:pt-12 pb-16">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        {saveError && (
          <p role="alert" className="rounded-lg border border-error bg-error-soft px-3 py-2 text-body-sm text-error">
            {saveError}
          </p>
        )}
        <LexiconFlashcard
          key={current.id}
          word={current.text}
          ipa={current.ipa ?? undefined}
          partOfSpeech={posMap?.get(current.source_ref ?? '') || undefined}
          definition={current.meaning ?? ''}
          example={current.example}
          translation={current.translation ?? undefined}
          cardNumber={index + 1}
          totalCards={entries.length}
          canUndo={index > 0}
          disabled={busy}
          onUndo={handleUndo}
          onRate={handleRate}
        />
      </div>
    </main>
  )
}
