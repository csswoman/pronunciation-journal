'use client'

// Planned structure:
// <FalseFriendsIntroStep>   — sequences the pair-presentation cards
//   <FalseFriendCard />     — one pair at a time; the last card starts practice
// Presentation is non-evaluated (no answer_history); it precedes the exercises.

import { useEffect, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { FalseFriendCard } from '@/components/practice/study-card/FalseFriendCard'
import type { FalseFriendIntro } from '@/lib/practice/study-card/model'

interface Props {
  pairs: FalseFriendIntro[]
  onComplete: () => void
}

export function FalseFriendsIntroStep({ pairs, onComplete }: Props) {
  const [index, setIndex] = useState(0)

  // Nothing to present: hand control straight back to the session.
  useEffect(() => {
    if (pairs.length === 0) onComplete()
  }, [pairs.length, onComplete])

  if (pairs.length === 0) return null

  const isLast = index + 1 >= pairs.length

  const advance = () => {
    if (isLast) onComplete()
    else setIndex(index + 1)
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-4">
      <FalseFriendCard
        key={index}
        model={pairs[index]}
        onContinue={advance}
        onListen={(word) => speak(word)}
        continueLabel={isLast ? 'Practicar' : 'Siguiente'}
      />
    </div>
  )
}
