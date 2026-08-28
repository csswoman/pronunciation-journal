'use client'

// Planned structure:
// <PhonemePlayButton>
//   <SpeakerIcon />
//   <OptionalCaption />
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
      className={cn(
        'group flex cursor-pointer flex-col items-center justify-center gap-1 rounded-full border border-border-default bg-surface-sunken/60 text-fg transition-all duration-150 hover:border-primary/60 hover:bg-surface-sunken hover:text-primary active:scale-95 focus-ring shadow-xs select-none',
        size === 'lg' ? 'size-16' : 'size-12',
        playing && 'border-primary bg-primary-soft text-primary ring-2 ring-primary/30',
        className,
      )}
    >
      <Volume2
        size={size === 'lg' ? 24 : 18}
        className={cn(
          'transition-transform duration-150 group-hover:scale-110',
          playing && 'scale-110 animate-pulse text-primary',
        )}
        aria-hidden
      />
      {caption && (
        <span className="font-ipa text-tiny font-semibold leading-none text-fg-muted group-hover:text-primary">
          {caption}
        </span>
      )}
    </button>
  )
}
