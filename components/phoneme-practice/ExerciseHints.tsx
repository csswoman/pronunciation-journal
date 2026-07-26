'use client'

// Planned structure:
// <ExerciseHints>
//   <HintLevelIndicator />
//   <HintContent />
//   <PrimaryRetry />
//   <SecondaryActions /> — pista + seguir
// </ExerciseHints>

import { useState } from 'react'
import { IPA_EXTRA } from '@/lib/pronunciation/ipa-data'
import { PhonemePlayButton } from '@/components/phoneme-practice/PhonemePlayButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'

interface Props {
  ipa: string
  targetWord?: string
  onRetry: () => void
  onContinue: () => void
  voice?: SpeechSynthesisVoice
}

type HintLevel = 0 | 1 | 2

const MAX_LEVEL: HintLevel = 2

export function ExerciseHints({ ipa, targetWord, onRetry, onContinue, voice }: Props) {
  const [level, setLevel] = useState<HintLevel>(0)
  const ipaKey =
    ipa.startsWith('/') && ipa.endsWith('/')
      ? ipa
      : `/${ipa.replace(/^\/|\/$/g, '')}/`
  const extra = IPA_EXTRA[ipaKey] ?? IPA_EXTRA[ipa]
  const hasMoreHints = level < MAX_LEVEL

  return (
    <div className="phoneme-hints">
      <LevelDots level={level} />
      <HintContent
        level={level}
        ipa={ipaKey}
        targetWord={targetWord}
        extra={extra}
        voice={voice}
      />

      <button
        type="button"
        onClick={onRetry}
        className="pf-cta pf-cta--primary"
        data-cuelume-press="press"
        data-cuelume-release="release"
      >
        Reintentar
      </button>

      <div className="phoneme-hints__secondary">
        {hasMoreHints ? (
          <button
            type="button"
            onClick={() => {
              playUiCue('reveal')
              setLevel((l) => (l + 1) as HintLevel)
            }}
            className="phoneme-hints__ghost"
          >
            Ver pista
          </button>
        ) : (
          <span className="phoneme-hints__ghost phoneme-hints__ghost--muted" aria-hidden>
            Pistas vistas
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            playUiCue('soft')
            onContinue()
          }}
          className="phoneme-hints__ghost"
        >
          Seguir
        </button>
      </div>
    </div>
  )
}

function LevelDots({ level }: { level: HintLevel }) {
  return (
    <div
      className="phoneme-hints__dots"
      aria-label={`Pista ${level + 1} de ${MAX_LEVEL + 1}`}
    >
      {([0, 1, 2] as HintLevel[]).map((l) => (
        <span
          key={l}
          className={cn( 'phoneme-hints__dot', l <= level && 'phoneme-hints__dot--on', )}
        />
      ))}
    </div>
  )
}

function HintContent({
  level,
  ipa,
  targetWord,
  extra,
  voice,
}: {
  level: HintLevel
  ipa: string
  targetWord?: string
  extra: (typeof IPA_EXTRA)[string] | undefined
  voice?: SpeechSynthesisVoice
}) {
  if (level === 0) {
    return (
      <div className="phoneme-hints__block">
        <p className="phoneme-hints__label">Escucha de nuevo</p>
        <PhonemePlayButton
          ariaLabel={`Escuchar ${targetWord ?? ipa}`}
          word={targetWord}
          ipa={targetWord ? undefined : ipa}
          voice={voice}
          caption={targetWord ?? ipa}
          size="md"
        />
      </div>
    )
  }

  if (level === 1) {
    const bare = ipa.replace(/[/[\]]/g, '').trim()
    const tips = extra?.articulationEs ?? extra?.articulation ?? []
    return (
      <div className="phoneme-hints__block">
        <p className="phoneme-hints__label">Cómo se produce</p>
        <p className="phoneme-hints__ipa">{bare}</p>
        {tips.length > 0 && (
          <ul className="phoneme-hints__tips">
            {tips.slice(0, 2).map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="phoneme-hints__block">
      <p className="phoneme-hints__label">Consejo para hispanohablantes</p>
      <p className="phoneme-hints__body">
        {extra?.spanishTip ?? 'Sin consejo disponible para este sonido.'}
      </p>
    </div>
  )
}
