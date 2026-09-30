// components/pronunciation-feedback/PhonemeFix.tsx
'use client'

// Planned structure:
// <PhonemeFix>  — the "why it failed" block anchored to culprit word/phoneme
//   <div> header with left border accent + IPA badge + status badge (Casi / No se oyó)
//   <p aria-label={plainEs}> explanation segments
//   <div> audio controls row: ► Nativo /IPA/, 🎙️ Tu intento, 0.5× speed
//   <p> contrastEs
//   <SoundHowTo />

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { speak } from '@/lib/phoneme-practice/tts'
import { Play, Mic } from '@/components/icons'
import { SoundHowTo } from './SoundHowTo'
import type { PhonemeInWordExplanation } from '@/lib/pronunciation/phoneme-in-word'
import type { SyllableRemediation } from '@/lib/pronunciation/syllable-remediation'

interface Props {
  explanation: PhonemeInWordExplanation
  remediation: SyllableRemediation | null
  /** IPA with slashes for the audio button + SoundHowTo fallback title. */
  phonemeIpa: string
  score: number
  /** Culprit alignment status — picks the accent border colour. */
  status: 'incorrect' | 'missing'
  userAudioUrl?: string | null
}

export function PhonemeFix({ explanation, remediation, phonemeIpa, score, status, userAudioUrl }: Props) {
  const [playbackRate, setPlaybackRate] = useState<0.5 | 1.0>(1.0)

  const speakPhoneme = () => {
    try {
      speak(phonemeIpa)
    } catch {
      /* TTS failure must not break the turn */
    }
  }

  const playUserAttempt = () => {
    if (!userAudioUrl) return
    const audio = new Audio(userAudioUrl)
    audio.playbackRate = playbackRate
    audio.play().catch(() => {})
  }

  const isIncorrect = status === 'incorrect'

  return (
    <div
      aria-label={explanation.plainEs}
      className={cn(
        'flex flex-col rounded-r-2xl rounded-l-xs border-l-4 p-4 gap-3 border border-border-subtle shadow-xs transition-all',
        isIncorrect
          ? 'border-l-amber-400 bg-amber-500/5 dark:bg-amber-500/10 dark:border-l-amber-500'
          : 'border-l-rose-400 bg-rose-500/5 dark:bg-rose-500/10 dark:border-l-rose-500',
      )}
    >
      {/* Header: Title + Badges */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">El sonido</span>
          <code className="rounded-md bg-amber-400/20 px-2 py-0.5 font-ipa font-bold text-amber-900 dark:text-amber-200 text-sm border-none">
            {phonemeIpa}
          </code>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
            isIncorrect
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
          )}
        >
          {isIncorrect ? 'Casi' : 'No se oyó'}
        </span>
      </div>


      {/* Explanation text */}
      <p className="m-0 text-sm text-fg leading-relaxed">
        {explanation.segments.map((seg, i) => {
          if (seg.emphasis === 'grapheme') {
            return <span key={i} className="font-bold text-fg">{seg.text}</span>
          }
          if (seg.emphasis === 'ipa') {
            return (
              <span
                key={i}
                className="font-bold text-fg underline decoration-amber-400 decoration-2 underline-offset-2"
              >
                {seg.text}
              </span>
            )
          }
          return <span key={i}>{seg.text}</span>
        })}
      </p>

      {/* Audio controls row */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <button
          type="button"
          onClick={speakPhoneme}
          aria-label={`Escuchar ${phonemeIpa}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 px-3.5 py-1.5 text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow-xs"
        >
          <Play size={13} className="fill-amber-950 shrink-0" aria-hidden />
          <span>Nativo {phonemeIpa}</span>
        </button>

        {userAudioUrl && (
          <button
            type="button"
            onClick={playUserAttempt}
            aria-label="Escuchar tu intento"
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken hover:bg-surface-raised border border-border-subtle text-fg px-3.5 py-1.5 text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow-xs"
          >
            <Mic size={13} className="text-fg-subtle shrink-0" aria-hidden />
            <span>Tu intento</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setPlaybackRate((r) => (r === 1.0 ? 0.5 : 1.0))}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer',
            playbackRate === 0.5
              ? 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900/60 dark:text-purple-200'
              : 'bg-surface-subtle text-fg-muted border-border-subtle hover:text-fg',
          )}
        >
          <span>{playbackRate}×</span>
        </button>
      </div>

      {explanation.contrastEs && (
        <p className="m-0 text-xs italic text-fg-muted">{explanation.contrastEs}</p>
      )}

      {remediation && (
        <SoundHowTo
          ipa={phonemeIpa}
          hookEs={remediation.hookEs}
          articulationEs={remediation.articulationEs}
          spanishTip={remediation.spanishTip}
          defaultOpen={score < 70}
        />
      )}
    </div>
  )
}

