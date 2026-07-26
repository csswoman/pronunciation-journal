'use client'

// Planned structure:
// <PhonemePlayButton>
//   <Icon /> + optional caption (IPA / label)
// </PhonemePlayButton>

import { useRef, useState } from 'react'
import { Volume2 } from '@/components/icons'
import { speak } from '@/lib/phoneme-practice/tts'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import { cn } from '@/lib/cn'

type Props = {
  /** Accessible name, e.g. "Escuchar done" */
  ariaLabel: string
  /** Speak this English word via TTS */
  word?: string
  /** Play IPA sample (bare or /slashed/) */
  ipa?: string
  voice?: SpeechSynthesisVoice
  /** Optional visible caption under the icon (usually IPA) */
  caption?: string
  size?: 'md' | 'lg'
  className?: string
}

export function PhonemePlayButton({
  ariaLabel,
  word,
  ipa,
  voice,
  caption,
  size = 'md',
  className,
}: Props) {
  const [playing, setPlaying] = useState(false)
  const lockedRef = useRef(false)

  function finish() {
    lockedRef.current = false
    setPlaying(false)
  }

  function handlePlay() {
    if (lockedRef.current) return
    lockedRef.current = true

    if (word) {
      const utt = speak(word, {
        voice,
        rate: 0.9,
        onStart: () => setPlaying(true),
        onEnd: finish,
        onError: finish,
      })
      if (!utt) finish()
      return
    }

    if (ipa) {
      const result = playIpaSound(ipa, {
        onStart: () => setPlaying(true),
        onEnd: finish,
        onError: finish,
      })
      if (!result) finish()
      return
    }

    finish()
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      aria-label={ariaLabel}
      aria-pressed={playing}
      className={cn( 'phoneme-play-btn', size === 'lg' && 'phoneme-play-btn--lg', playing && 'phoneme-play-btn--playing', className, )}
    >
      <Volume2
        size={size === 'lg' ? 24 : 20}
        className="phoneme-play-btn__icon"
        aria-hidden
      />
      {caption && <span className="phoneme-play-btn__caption">{caption}</span>}
    </button>
  )
}
