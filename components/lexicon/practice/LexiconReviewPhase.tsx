'use client'

// Planned structure:
// <LexiconReviewPhase>
//   <LexiconFlashcard />   — one card at a time
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

  async function handleRate(rating: FlashcardRating) {
    if (busy) return
    const entry = entries[index]
    if (!entry) return

    setBusy(true)
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
      // Proceed without saving — don't block the user.
      const next: WordRating[] = [...ratings, { entry, rating }]
      const nextIndex = index + 1
      if (nextIndex >= entries.length) {
        onComplete(next)
      } else {
        setRatings(next)
        setIndex(nextIndex)
      }
    } finally {
      setBusy(false)
    }
  }

  const current = entries[index]
  if (!current) return null

  return (
    <main className="flex w-full items-center justify-center px-10 py-10">
      <LexiconFlashcard
        key={current.id}
        word={current.text}
        partOfSpeech={posMap?.get(current.source_ref ?? '') || undefined}
        definition={current.meaning ?? ''}
        example={current.example}
        translation={current.translation ?? undefined}
        cardNumber={index + 1}
        totalCards={entries.length}
        onRate={handleRate}
      />
    </main>
  )
}
