'use client'

// Planned structure:
// <WeakFormCard>
//   <FormContrast />   strong vs weak IPA
//   <ListenButton />
//   <SelfGradeBar />
// </WeakFormCard>

import { speak } from '@/lib/phoneme-practice/tts'
import { ListenButton } from '@/components/ui/ListenButton'
import { PillButton } from '@/components/ui/PillButton'
import { weakFormPhrase } from '@/lib/practice/study-card/model'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  /** Caller guarantees `ipa_weak` is present (selectMode checks it). */
  entry: EssentialWord
  onGraded: (quality: number) => Promise<void>
}

const GOT_IT_QUALITY = 5
const MISSED_QUALITY = 2

export function WeakFormCard({ entry, onGraded }: Props) {
  const phrase = weakFormPhrase(entry.example_sentence, entry.word)

  return (
    <div className="flex w-full flex-col items-center gap-space-5 rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
        <p className="font-kicker m-0 text-fg-muted">Forma débil</p>
        <p className="m-0 text-body-lg font-medium text-fg">{entry.word}</p>
        <p className="ipa m-0 text-body text-fg-muted">
          fuerte /{entry.ipa_strong}/ · débil /{entry.ipa_weak}/
        </p>
      </div>

      <p className="m-0 max-w-[42ch] text-center text-body-lg text-fg">{phrase}</p>

      <ListenButton
        onPlay={() => speak(phrase, { rate: 0.95 })}
        label="Escuchar la forma débil"
        disabled={false}
      />

      <div className="flex gap-2">
        <PillButton variant="outline" size="sm" onClick={() => void onGraded(MISSED_QUALITY)}>
          Me costó
        </PillButton>
        <PillButton variant="primary" size="sm" onClick={() => void onGraded(GOT_IT_QUALITY)}>
          Lo dije bien
        </PillButton>
      </div>
    </div>
  )
}
