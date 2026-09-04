'use client'

// Planned structure:
// <RhythmicSentenceDisplay>
//   <RhythmHeaderActions />
//   <RhythmicTokenStream />
//   <RhythmPedagogicalLegend />
// </RhythmicSentenceDisplay>

import { useId, useMemo, useState } from 'react'
import { Volume2, Sparkles } from '@/components/icons'
import { speak } from '@/lib/phoneme-practice/tts'
import { analyzeSentenceRhythm, type RhythmicToken } from '@/lib/pronunciation/rhythm'
import { cn } from '@/lib/cn'

interface Props {
  sentence: string
  className?: string
  showLegend?: boolean
  showAudio?: boolean
  defaultMode?: 'rhythm' | 'plain'
  onWordClick?: (word: string) => void
}

export function RhythmicSentenceDisplay({
  sentence,
  className,
  showLegend = true,
  showAudio = true,
  defaultMode = 'rhythm',
  onWordClick,
}: Props) {
  const [mode, setMode] = useState<'rhythm' | 'plain'>(defaultMode)
  const [isPlaying, setIsPlaying] = useState(false)
  const legendId = useId()

  const analysis = useMemo(() => analyzeSentenceRhythm(sentence), [sentence])

  const handlePlay = () => {
    if (isPlaying || !sentence) return
    setIsPlaying(true)
    speak(sentence, {
      rate: 0.9,
    })
    setTimeout(() => setIsPlaying(false), 2000)
  }

  return (
    <section
      aria-label="Presentación de ritmo acentual de la oración"
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4 transition-all',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/60 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-soft text-primary text-xs" aria-hidden="true">
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="font-caption text-xs font-semibold text-fg-muted uppercase tracking-wider">
            Ritmo del inglés (Stress-timed)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'rhythm' ? 'plain' : 'rhythm'))}
            className="text-caption font-medium text-primary hover:underline cursor-pointer focus-ring px-1.5 py-0.5 rounded"
            aria-pressed={mode === 'rhythm'}
          >
            {mode === 'rhythm' ? 'Ocultar compás' : 'Ver compás'}
          </button>

          {showAudio && (
            <button
              type="button"
              onClick={handlePlay}
              disabled={isPlaying}
              className="inline-flex items-center gap-1 rounded-md border border-border-default bg-surface px-2 py-1 text-caption font-medium text-fg hover:border-primary focus-ring cursor-pointer"
              aria-label="Escuchar ritmo de la oración"
            >
              <Volume2 className="h-3.5 w-3.5 text-primary" />
              <span>Escuchar ritmo</span>
            </button>
          )}
        </div>
      </div>

      <div
        className="flex flex-wrap items-start gap-x-3 gap-y-2 py-2 font-sans text-fg"
        aria-describedby={showLegend ? legendId : undefined}
      >
        {analysis.tokens.map((token, idx) => (
          <RhythmicTokenItem
            key={`${token.word}-${idx}`}
            token={token}
            isRhythmMode={mode === 'rhythm'}
            onClick={onWordClick}
          />
        ))}
      </div>

      {showLegend && mode === 'rhythm' && (
        <p id={legendId} className="m-0 text-caption text-fg-muted leading-relaxed pt-1">
          <span className="font-semibold text-primary">● Pulso:</span> Las palabras destacadas sostienen el compás rítmico; las atenuadas son formas débiles que se comprimen rápido entre cada pulso.
        </p>
      )}
    </section>
  )
}

function RhythmicTokenItem({
  token,
  isRhythmMode,
  onClick,
}: {
  token: RhythmicToken
  isRhythmMode: boolean
  onClick?: (word: string) => void
}) {
  const isContent = token.isContent && isRhythmMode

  return (
    <span
      className={cn(
        'inline-flex flex-col items-center transition-transform',
        onClick && 'cursor-pointer hover:opacity-80',
      )}
      onClick={onClick ? () => onClick(token.word) : undefined}
    >
      <span
        className={cn(
          'text-[10px] leading-none mb-1 select-none font-bold',
          isContent ? 'text-primary animate-fadeIn' : 'invisible',
        )}
        aria-hidden="true"
      >
        ●
      </span>
      <span
        className={cn(
          'transition-all text-pretty',
          isContent
            ? 'font-bold text-h3 sm:text-h2 text-fg tracking-tight'
            : isRhythmMode
              ? 'font-normal text-body sm:text-h4 text-fg-muted'
              : 'font-normal text-body sm:text-h4 text-fg',
        )}
      >
        {token.raw}
      </span>
      {isRhythmMode && token.weakIpa && (
        <span
          className="font-ipa text-caption sm:text-body-sm text-fg-subtle select-none leading-none mt-1"
          aria-label={`Forma débil /${token.weakIpa}/`}
        >
          /{token.weakIpa}/
        </span>
      )}
    </span>
  )
}
