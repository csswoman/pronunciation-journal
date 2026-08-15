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
import { ArticulationMouthGuide } from '@/components/pronunciation/ArticulationMouthGuide'
import Button from '@/components/ui/Button'
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
    <div className="phoneme-hints flex flex-col gap-3">
      <LevelDots level={level} />
      <HintContent
        level={level}
        ipa={ipaKey}
        targetWord={targetWord}
        extra={extra}
        voice={voice}
      />

      <Button
        onClick={onRetry}
        variant="primary"
        size="lg"
        fullWidth
        data-cuelume-press="press"
        data-cuelume-release="release"
      >
        Reintentar
      </Button>

      <div className="phoneme-hints__secondary flex items-center justify-between pt-1">
        {hasMoreHints ? (
          <button
            type="button"
            onClick={() => {
              playUiCue('reveal')
              setLevel((l) => (l + 1) as HintLevel)
            }}
            className="phoneme-hints__ghost text-body-sm font-medium text-primary hover:underline"
          >
            Ver más pistas ({level + 1}/{MAX_LEVEL + 1})
          </button>
        ) : (
          <span className="phoneme-hints__ghost phoneme-hints__ghost--muted font-caption text-fg-muted" aria-hidden>
            Todas las pistas vistas
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            playUiCue('soft')
            onContinue()
          }}
          className="phoneme-hints__ghost text-body-sm font-medium text-fg-muted hover:text-fg"
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
      className="phoneme-hints__dots flex items-center gap-1.5 justify-center py-1"
      aria-label={`Pista ${level + 1} de ${MAX_LEVEL + 1}`}
    >
      {([0, 1, 2] as HintLevel[]).map((l) => (
        <span
          key={l}
          className={cn(
            'h-2 w-2 rounded-full transition-colors',
            l <= level ? 'bg-primary' : 'bg-border-default',
          )}
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
      <div className="phoneme-hints__block flex flex-col items-center gap-2 rounded-xl border border-border-default bg-surface-raised p-4">
        <p className="font-caption font-semibold uppercase tracking-wider text-fg-muted">Escucha de nuevo</p>
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
      <div className="phoneme-hints__block flex flex-col gap-3">
        <ArticulationMouthGuide symbolOrIpa={ipa} compact />
        {tips.length > 0 && (
          <div className="rounded-lg border border-border-subtle bg-surface-raised p-3">
            <p className="font-caption font-semibold uppercase tracking-wider text-fg-muted mb-1">
              Pasos para /<span className="font-ipa">{bare}</span>/
            </p>
            <ul className="flex flex-col gap-1.5 text-body-sm text-fg-muted list-disc pl-4">
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="phoneme-hints__block flex flex-col gap-2 rounded-xl border border-border-default bg-surface-raised p-4">
      <p className="font-caption font-semibold uppercase tracking-wider text-warning">
        💡 Consejo para hispanohablantes
      </p>
      <p className="text-body text-fg text-pretty">
        {extra?.spanishTip ?? 'Sin consejo disponible para este sonido.'}
      </p>
    </div>
  )
}
