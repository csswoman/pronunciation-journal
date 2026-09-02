'use client'

// Planned structure:
// <MinimalPairExercise>
//   <AuditoryDiscriminationBase>
//     <PhonemePlayButton />
//     <FeedbackNote />
//     <CompareAudiosBox />
//   </AuditoryDiscriminationBase>
// </MinimalPairExercise>

import { useState } from 'react'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemePlayButton } from '@/components/phoneme-practice/PhonemePlayButton'
import { AuditoryDiscriminationBase } from '@/components/phoneme-practice/AuditoryDiscriminationBase'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
}

export function MinimalPairExercise({ exercise, onSubmit, focusUi = false, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSelect(id: string) {
    if (submitted) return
    playUiCue('tap')
    setSelected(id)
  }

  function handleConfirm() {
    if (!selected || submitted) return
    setSubmitted(true)
    const isCorrect = exercise.correctIds.includes(selected)
    const label = exercise.options.find((o) => o.id === selected)?.label ?? ''
    onSubmit(isCorrect, label)
  }

  const canConfirm = Boolean(selected) && !submitted
  const correctOption = exercise.options.find((option) =>
    exercise.correctIds.includes(option.id),
  )
  const selectedOption = exercise.options.find((option) => option.id === selected)
  const selectedIsCorrect = selected ? exercise.correctIds.includes(selected) : false
  const playWord = exercise.targetWord ?? correctOption?.label ?? ''

  const rawIpa = exercise.ipa?.replace(/^\/+|\/+$/g, '')
  const ipaDisplay = rawIpa ? `/${rawIpa}/` : undefined

  const stimulusSlot = playWord ? (
    <PhonemePlayButton
      ariaLabel={`Escuchar ${playWord}`}
      word={playWord}
      voice={voice}
      size="lg"
    />
  ) : null

  const feedbackSlot = (
    <>
      {correctOption && !focusUi && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'flex flex-col gap-1 rounded-xl border px-4 py-3.5 text-body-sm',
            selectedIsCorrect
              ? 'border-success-border bg-success-soft text-success'
              : 'border-error-border bg-error-soft text-error',
          )}
        >
          <p className="font-semibold">
            {selectedIsCorrect ? '¡Correcto!' : `La respuesta correcta es “${correctOption.label}”.`}
          </p>
          {exercise.ipa && (
            <p className="text-fg-secondary">
              <strong>{correctOption.label}</strong> contiene el sonido{' '}
              <strong className="font-mono text-primary">{exercise.ipa}</strong>.
              {selectedOption && !selectedIsCorrect
                ? ` “${selectedOption.label}” usa un sonido diferente.`
                : ''}
            </p>
          )}
        </div>
      )}

      {correctOption && focusUi && !selectedIsCorrect && (
        <p className="m-0 text-center text-body-sm text-fg-muted" role="status">
          <strong>{correctOption.label}</strong> lleva {exercise.ipa}.
          {selectedOption ? ` “${selectedOption.label}” suena distinto.` : ''}
        </p>
      )}
    </>
  )

  const comparisonSlot = (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border-default bg-surface-raised/60 p-3">
      <span className="text-caption font-semibold text-fg-muted uppercase tracking-wider">
        Compara ambos sonidos
      </span>
      <div className="flex items-center gap-4">
        {exercise.options.map((opt) => (
          <div key={`compare-${opt.id}`} className="flex flex-col items-center gap-1">
            <PhonemePlayButton
              ariaLabel={`Escuchar ${opt.label}`}
              word={opt.label}
              voice={voice}
              size="md"
            />
            <span className="text-body-xs font-medium text-fg">{opt.label}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <AuditoryDiscriminationBase
      title="Escucha el audio y elige la palabra"
      kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Pares mínimos` : 'Pares mínimos'}
      hint="Identifica cuál de las dos palabras fue pronunciada"
      stimulusSlot={stimulusSlot}
      options={exercise.options}
      selectedIds={selected ? [selected] : []}
      correctIds={exercise.correctIds}
      submitted={submitted}
      mode="single"
      canConfirm={canConfirm}
      onToggleOption={handleSelect}
      onConfirm={handleConfirm}
      feedbackSlot={feedbackSlot}
      comparisonSlot={comparisonSlot}
    />
  )
}
