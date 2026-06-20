'use client'

// Planned structure:
// <WordIntroStep>           — sequences the new-word presentation cards
//   <StudyCard />           — one card at a time; "Practicar" advances
// Presentation is non-evaluated (no answer_history); it precedes word_review.

import { useEffect, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { StudyCard, type ListenTarget } from '@/components/practice/study-card/StudyCard'
import type { StudyCardModel } from '@/lib/practice/study-card/model'

interface Props {
  cards: StudyCardModel[]
  onComplete: () => void
}

export function WordIntroStep({ cards, onComplete }: Props) {
  const [index, setIndex] = useState(0)

  // Empty intro: nothing to present, hand control straight back to the session.
  useEffect(() => {
    if (cards.length === 0) onComplete()
  }, [cards.length, onComplete])

  if (cards.length === 0) return null

  const card = cards[index]

  const onListen = (target: ListenTarget) => {
    if (target === 'word') speak(card.word)
    else if (target === 'weak' && card.weakForm) speak(card.weakForm.phrase, { rate: 0.95 })
    else if (card.sentence) speak(card.sentence, { rate: 0.95 })
  }

  const advance = () => {
    if (index + 1 < cards.length) setIndex(index + 1)
    else onComplete()
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-4">
      <StudyCard key={index} model={card} onContinue={advance} onListen={onListen} />
    </div>
  )
}
