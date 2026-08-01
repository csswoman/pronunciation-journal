'use client'

// Thin Core-1000 wrapper over the source-agnostic <StudyCard>: maps a EssentialWord
// to the shared StudyCardModel and wires its three listen targets to TTS.
// Presentation lives in components/practice/study-card/StudyCard.tsx.

import { speak } from '@/lib/phoneme-practice/tts'
import type { EssentialWord } from '@/lib/essential-words/types'
import {
  essentialWordToStudyCard,
  weakFormPhrase,
} from '@/lib/practice/study-card/model'
import { StudyCard, type ListenTarget } from '@/components/practice/study-card/StudyCard'

interface Props {
  entry: EssentialWord
  onContinue: () => void
  onArchive: () => void
}

export function WordStudyCard({ entry, onContinue, onArchive }: Props) {
  const model = essentialWordToStudyCard(entry)

  const onListen = (target: ListenTarget) => {
    if (target === 'word') speak(entry.word)
    else if (target === 'weak') speak(weakFormPhrase(entry.example_sentence, entry.word), { rate: 0.95 })
    else speak(entry.example_sentence, { rate: 0.95 })
  }

  return (
    <StudyCard
      model={model}
      onContinue={onContinue}
      onArchive={onArchive}
      onListen={onListen}
    />
  )
}
