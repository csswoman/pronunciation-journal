'use client'

// Planned structure:
// <PhonemeLessonIntro>
//   <PhonemeIntroStage /> — IPA vivo + ejemplos audibles
//   <PhonemeIntroTray />  — tip + contraste + CTA
// </PhonemeLessonIntro>

import { useEffect, useRef, useState } from 'react'
import { PHONEMES } from '@/components/ipa/data'
import { PhonemeIntroStage } from '@/components/phoneme-practice/PhonemeIntroStage'
import { PhonemeIntroTray } from '@/components/phoneme-practice/PhonemeIntroTray'
import { IPA_EXTRA } from '@/lib/pronunciation/ipa-data'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import { formatIpaDisplay, stripIpaSlashes } from '@/lib/lexicon/format-ipa'
import type { IntroAudioState } from '@/components/phoneme-practice/PhonemeIntroStage'

interface Props {
  ipa: string
  onStart: () => void
  startLabel?: string
}

const TYPE_LABEL: Record<(typeof PHONEMES)[number]['type'], string> = {
  vowel: 'Vocal',
  consonant: 'Consonante',
  diphthong: 'Diptongo',
}

function resolvePhoneme(displayIpa: string, bare: string) {
  return PHONEMES.find((item) => item.symbol === displayIpa || item.rawSymbol === bare)
}

export function PhonemeLessonIntro({ ipa, onStart, startLabel = 'Practicar ahora' }: Props) {
  const [showLesson, setShowLesson] = useState(false)
  const [audioState, setAudioState] = useState<IntroAudioState>('idle')
  const playLockedRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const displayIpa = formatIpaDisplay(ipa)
  const bare = stripIpaSlashes(ipa)
  const phoneme = resolvePhoneme(displayIpa, bare)
  const extra = IPA_EXTRA[displayIpa] ?? IPA_EXTRA[ipa]
  const label = phoneme
    ? `${TYPE_LABEL[phoneme.type]} · ${phoneme.name}`
    : 'Sonido'
  const examples = phoneme?.examples.slice(0, 3) ?? []

  useEffect(() => {
    return () => {
      playLockedRef.current = false
      audioRef.current?.pause()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  function handlePlay() {
    if (playLockedRef.current) return
    playLockedRef.current = true
    setAudioState('idle')
    const result = playIpaSound(bare, {
      onStart: () => setAudioState('playing'),
      onEnd: () => {
        playLockedRef.current = false
        setAudioState('idle')
      },
      onError: () => {
        playLockedRef.current = false
        setAudioState('error')
      },
    })
    audioRef.current = result?.kind === 'audio' ? result.audio : null
    if (!result) playLockedRef.current = false
  }

  return (
    <div className="phoneme-intro flex flex-col">
      <PhonemeIntroStage
        audioState={audioState}
        bare={bare}
        examples={examples}
        ipa={displayIpa}
        label={label}
        onPlay={handlePlay}
      />
      <PhonemeIntroTray
        extra={extra}
        showLesson={showLesson}
        onToggleLesson={() => setShowLesson((v) => !v)}
        onStart={onStart}
        startLabel={startLabel}
      />
    </div>
  )
}
