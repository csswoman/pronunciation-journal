'use client'

// Thin Core-1000 wrapper over the source-agnostic <StudyCard>: maps a EssentialWord
// to the shared StudyCardModel and wires its three listen targets to TTS.
// Wrapped in <SessionSurface> for a single study card on the immersive screen.

import { speak } from '@/lib/phoneme-practice/tts'
import type { EssentialWord } from '@/lib/essential-words/types'
import {
  essentialWordToStudyCard,
  weakFormPhrase,
} from '@/lib/practice/study-card/model'
import { StudyCard, type ListenTarget } from '@/components/practice/study-card/StudyCard'
import { SessionSurface } from './session-chrome'

interface Props {
  entry: EssentialWord
  contextLine?: string
  onContinue: () => void
  onOmit: () => void
}

export function WordStudyCard({ entry, contextLine, onContinue, onOmit }: Props) {
  const model = essentialWordToStudyCard(entry)

  const onListen = (target: ListenTarget) => {
    if (target === 'word') speak(entry.word)
    else if (target === 'weak') speak(weakFormPhrase(entry.example_sentence, entry.word), { rate: 0.95 })
    else speak(entry.example_sentence, { rate: 0.95 })
  }

  return (
    <SessionSurface className="w-full gap-layout-stack">
      <StudyCard
        model={model}
        variant="immersive"
        contextLine={contextLine}
        continueLabel="Continuar con la práctica"
        onContinue={onContinue}
        onOmit={onOmit}
        onListen={onListen}
        onListenText={(text) => speak(text, { rate: 0.95 })}
      />
    </SessionSurface>
  )
}
