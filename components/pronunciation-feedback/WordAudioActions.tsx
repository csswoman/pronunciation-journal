'use client'

// Planned structure:
// <WordAudioActions>
//   <button> ▶ Nativo /ipa/   (relleno en el color del estado)
//   <button> 〰 Tu intento    (solo con grabación)
//   <button> 0.5×             (velocidad de «Tu intento»)

import { useState } from 'react'
import { Play, Mic } from '@/components/icons'
import { cn } from '@/lib/cn'
import { speak } from '@/lib/phoneme-practice/tts'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import type { WordFeedback } from '@/lib/pronunciation/feedback/word-feedback'
import { WORD_TONE } from './word-feedback-tone'

interface Props {
  word: WordFeedback
  userAudioUrl?: string | null
}

const PILL = 'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 text-body-sm font-bold transition-transform active:scale-95 focus-ring'

export function WordAudioActions({ word, userAudioUrl }: Props) {
  const [slow, setSlow] = useState(false)
  const tone = WORD_TONE[word.state]
  const ipa = word.fix?.ipa

  const playNative = () => {
    try {
      // Sin audio del sonido aislado, se escucha la palabra completa.
      if (!ipa || !playIpaSound(ipa)) speak(word.text)
    } catch {
      /* un fallo de TTS no debe romper el turno */
    }
  }

  const playUser = () => {
    if (!userAudioUrl) return
    const audio = new Audio(userAudioUrl)
    audio.playbackRate = slow ? 0.5 : 1
    audio.play().catch(() => {})
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={playNative}
        aria-label={ipa ? `Escuchar ${ipa}` : `Escuchar ${word.text}`}
        className={cn(PILL, 'text-ink', tone.fill, tone.fillHover)}
      >
        <Play size={14} className="shrink-0 fill-current" aria-hidden />
        <span>{ipa ? <>Nativo <span className="font-phonetic">{ipa}</span></> : 'Nativo'}</span>
      </button>

      {userAudioUrl && (
        <button
          type="button"
          onClick={playUser}
          aria-label="Escuchar tu intento"
          className={cn(PILL, 'border border-border-subtle bg-surface-sunken text-fg hover:bg-surface-raised')}
        >
          <Mic size={14} className="shrink-0" aria-hidden />
          <span>Tu intento</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setSlow((v) => !v)}
        aria-pressed={slow}
        aria-label="Reproducir tu intento a media velocidad"
        className={cn(
          PILL,
          'border border-border-subtle',
          slow ? 'bg-accent-soft text-accent-text' : 'bg-surface-sunken text-fg-muted hover:text-fg',
        )}
      >
        0.5×
      </button>
    </div>
  )
}
