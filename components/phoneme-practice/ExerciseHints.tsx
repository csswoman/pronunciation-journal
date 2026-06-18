'use client'

// Planned structure:
// <ExerciseHints>
//   <HintLevelIndicator />   — dots showing current level
//   <HintContent />          — re-hear | IPA highlight | spanishTip
//   <HintActions />          — "Ver pista" / "Reintentar" / "Continuar"
// </ExerciseHints>

import { useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { IPA_EXTRA } from '@/lib/pronunciation/ipa-data'
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
  // IPA_EXTRA keys are "/iː/" format; normalize bare keys like "iː" or "/iː"
  const ipaKey = ipa.startsWith('/') && ipa.endsWith('/') ? ipa : `/${ipa.replace(/^\/|\/$/g, '')}/`
  const extra = IPA_EXTRA[ipaKey] ?? IPA_EXTRA[ipa]

  function handleNextHint() {
    if (level < MAX_LEVEL) setLevel((l) => (l + 1) as HintLevel)
  }

  function handleRehear() {
    if (targetWord) speak(targetWord, { voice })
  }

  const hasMoreHints = level < MAX_LEVEL

  return (
    <div className="flex flex-col gap-4 pt-2">
      <LevelDots level={level} />
      <HintContent level={level} ipa={ipaKey} targetWord={targetWord} extra={extra} onRehear={handleRehear} />
      <div className="flex gap-3">
        {hasMoreHints && (
          <button
            type="button"
            onClick={handleNextHint}
            className="flex-1 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised py-3 text-sm font-semibold text-fg transition-colors hover:border-border-default"
          >
            Ver pista
          </button>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 rounded-[var(--radius-md)] border border-primary bg-surface-raised py-3 text-sm font-semibold text-primary transition-colors hover:bg-selection-bg"
        >
          Reintentar
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-4 py-3 text-sm font-medium text-fg-subtle transition-colors hover:border-border-default"
        >
          Omitir
        </button>
      </div>
    </div>
  )
}

function LevelDots({ level }: { level: HintLevel }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Pista ${level + 1} de ${MAX_LEVEL + 1}`}>
      {([0, 1, 2] as HintLevel[]).map((l) => (
        <span
          key={l}
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-colors',
            l <= level ? 'bg-primary' : 'bg-border-subtle',
          )}
        />
      ))}
    </div>
  )
}

interface HintContentProps {
  level: HintLevel
  ipa: string
  targetWord?: string
  extra: (typeof IPA_EXTRA)[string] | undefined
  onRehear: () => void
}

function HintContent({ level, ipa, targetWord, extra, onRehear }: HintContentProps) {
  if (level === 0) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Escucha de nuevo</p>
        <button
          type="button"
          onClick={onRehear}
          className="pf-chip"
          aria-label={`Escuchar ${targetWord ?? ipa}`}
        >
          <span className="pf-chip__icon" aria-hidden>🔊</span>
          {targetWord ?? ipa}
        </button>
      </div>
    )
  }

  if (level === 1) {
    const bare = ipa.replace(/[/[\]]/g, '').trim()
    const tips = extra?.articulationEs ?? extra?.articulation ?? []
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Cómo se produce</p>
        <p className="font-[var(--font-ipa),monospace] text-3xl font-bold text-primary">{bare}</p>
        {tips.length > 0 && (
          <ul className="mt-1 flex flex-col gap-0.5 text-sm text-fg-secondary">
            {tips.slice(0, 2).map((tip) => (
              <li key={tip} className="flex gap-1.5 before:content-['·'] before:text-fg-subtle">
                {tip}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // level === 2
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Consejo para hispanohablantes</p>
      <p className="text-sm leading-relaxed text-fg-secondary">
        {extra?.spanishTip ?? 'Sin consejo disponible para este sonido.'}
      </p>
    </div>
  )
}
