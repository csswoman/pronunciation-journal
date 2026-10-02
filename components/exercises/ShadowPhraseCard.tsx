'use client'

// Planned structure:
// <ShadowPhraseCard>
//   <Phrase />            — phrase + IPA
//   <ListenButton />      — normal speed (pulses while playing)
//   <ListenButton />      — 0.5× slow (pulses while playing)

import { useState } from 'react'
import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'
import { stripIPASlashes } from '@/lib/ai-practice/modes/pronunciation'
import { cn } from '@/lib/cn'

type Speed = 'normal' | 'slow'

const OUTLINE_ON_TONE =
  'border-2 border-ink bg-transparent px-4 py-2 text-body-md font-bold text-ink hover:bg-ink/10'
const PLAYING = 'animate-pulse bg-ink text-white hover:bg-ink'

export function ShadowPhraseCard({ phrase, phraseIpa }: { phrase: string; phraseIpa?: string }) {
  const [playing, setPlaying] = useState<Speed | null>(null)

  const play = (speed: Speed) => {
    setPlaying(speed)
    const done = () => setPlaying(null)
    speak(phrase, {
      rate: speed === 'slow' ? 0.5 : 1,
      onEnd: done,
      onError: done,
    })
  }

  return (
    <div className="flex min-w-0 flex-col items-center gap-3 rounded-3xl bg-lilac px-4 py-7 text-center text-ink">
      <p className="m-0 max-w-md font-display text-h2 font-bold leading-snug text-balance">{phrase}</p>
      {phraseIpa ? (
        <p className="font-ipa m-0 max-w-md text-body-md leading-relaxed text-ink!">
          /{stripIPASlashes(phraseIpa)}/
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <ListenButton
          onPlay={() => play('normal')}
          label="Escuchar"
          aria-pressed={playing === 'normal'}
          className={cn(OUTLINE_ON_TONE, playing === 'normal' && PLAYING)}
        />
        <ListenButton
          onPlay={() => play('slow')}
          label="0.5×  Lento"
          aria-pressed={playing === 'slow'}
          className={cn(OUTLINE_ON_TONE, playing === 'slow' && PLAYING)}
        />
      </div>
    </div>
  )
}
