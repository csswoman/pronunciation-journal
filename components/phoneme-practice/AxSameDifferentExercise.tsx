'use client'

// Planned structure:
// <AxSameDifferentExercise>
//   <AuditoryDiscriminationBase>
//     <StimuliSlot: A/X stimulus cards + PlayBoth button />
//   </AuditoryDiscriminationBase>
// </AxSameDifferentExercise>

import { useState } from 'react'
import { Volume2, Play } from '@/components/icons'
import { speak, speakSequence } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { AuditoryDiscriminationBase } from '@/components/phoneme-practice/AuditoryDiscriminationBase'
import { playUiCue } from '@/lib/ui-sounds/cues'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  voice?: SpeechSynthesisVoice
}

const STIMULUS_LABELS = ['A', 'X'] as const

export function AxSameDifferentExercise({ exercise, onSubmit, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const stimuli = exercise.stimuli ?? []
  const canConfirm = Boolean(selected) && !submitted

  function handlePlay(index: number) {
    const word = stimuli[index]?.word
    if (word) speak(word, { voice })
  }

  function handlePlayBoth() {
    speakSequence(
      stimuli.map((s) => s.word),
      { voice },
    )
  }

  function handleSelect(id: string) {
    if (submitted) return
    playUiCue('tap')
    setSelected(id)
  }

  function handleConfirm() {
    if (!selected || submitted) return
    setSubmitted(true)
    onSubmit(exercise.correctIds.includes(selected), selected)
  }

  const rawIpa = exercise.ipa?.replace(/^\/+|\/+$/g, '')
  const ipaDisplay = rawIpa ? `/${rawIpa}/` : undefined

  const stimulusSlot = (
    <div className="flex w-full flex-col gap-4">
      <div className="grid w-full grid-cols-2 gap-3.5">
        {STIMULUS_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => handlePlay(i)}
            aria-label={`Escuchar estímulo ${label}`}
            className="flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-border-default bg-surface-sunken/50 p-4 transition-all duration-150 hover:bg-surface-sunken hover:border-primary/50 focus-ring select-none"
          >
            <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-subtle">
              Sonido {label}
            </span>
            <div className="flex size-11 items-center justify-center rounded-full border border-border-default bg-surface-raised text-fg transition-all duration-150">
              <Volume2 size={20} aria-hidden />
            </div>
            <span className="text-caption font-medium text-fg-muted">
              Reproducir
            </span>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handlePlayBoth}
          aria-label="Escuchar A y luego X en secuencia"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border-default bg-surface-raised px-4 py-2 text-body-sm font-medium text-fg transition-all duration-150 hover:border-primary hover:text-primary active:scale-95 focus-ring shadow-xs"
        >
          <Play size={13} fill="currentColor" aria-hidden />
          <span>Escuchar en secuencia (A → X)</span>
        </button>
      </div>
    </div>
  )

  return (
    <AuditoryDiscriminationBase
      title="¿Suenan igual o distinto?"
      kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Discriminación AX` : 'Discriminación AX'}
      hint="Escucha los estímulos A y X, luego determina si son iguales"
      stimulusSlot={stimulusSlot}
      options={exercise.options}
      selectedIds={selected ? [selected] : []}
      correctIds={exercise.correctIds}
      submitted={submitted}
      mode="single"
      canConfirm={canConfirm}
      onToggleOption={handleSelect}
      onConfirm={handleConfirm}
    />
  )
}
