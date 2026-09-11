// components/pronunciation-feedback/PhonemeFix.tsx
'use client'

// Planned structure:
// <PhonemeFix>  — the "why it failed" block, anchored to the word's spelling
//   <p aria-label={plainEs}>  segments → <span> (grapheme / ipa emphasis)
//   <button> 🔊 {ipa}  — isolated phoneme
//   <p> contrastEs
//   <SoundHowTo />

import { cn } from '@/lib/cn'
import { speak } from '@/lib/phoneme-practice/tts'
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
}

export function PhonemeFix({ explanation, remediation, phonemeIpa, score, status }: Props) {
  const speakPhoneme = () => {
    try {
      speak(phonemeIpa)
    } catch {
      /* TTS failure must not break the turn */
    }
  }

  return (
    <div
      aria-label={explanation.plainEs}
      className={cn(
        'flex flex-col rounded-lg border-l-2 bg-surface-sunken px-3 py-2.5',
        status === 'incorrect' ? 'border-[var(--error)]' : 'border-[var(--warning)]',
      )}
    >
      <p className="m-0 text-body-sm text-fg">
        {explanation.segments.map((seg, i) => {
          if (seg.emphasis === 'grapheme') {
            return <span key={i} className="font-semibold">{seg.text}</span>
          }
          if (seg.emphasis === 'ipa') {
            return (
              <span
                key={i}
                className="font-semibold text-fg underline decoration-[var(--warning)] decoration-2 underline-offset-2"
              >
                {seg.text}
              </span>
            )
          }
          return <span key={i}>{seg.text}</span>
        })}
      </p>

      <button
        type="button"
        onClick={speakPhoneme}
        className="mt-1 self-start text-caption text-fg-muted hover:text-fg"
        aria-label={`Escuchar ${phonemeIpa}`}
      >
        🔊 {phonemeIpa}
      </button>

      {explanation.contrastEs && (
        <p className="m-0 mt-1 text-caption text-fg-muted">{explanation.contrastEs}</p>
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
