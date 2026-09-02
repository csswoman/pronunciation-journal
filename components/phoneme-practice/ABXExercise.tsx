'use client'

// Planned structure:
// <ABXExercise>
//   <AuditoryDiscriminationBase>
//     <StimuliSlot: References 1 and 2 + Unknown target 3 />
//   </AuditoryDiscriminationBase>
// </ABXExercise>

import { useState } from 'react'
import { Volume2 } from '@/components/icons'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { AuditoryDiscriminationBase } from '@/components/phoneme-practice/AuditoryDiscriminationBase'
import { playUiCue } from '@/lib/ui-sounds/cues'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  voice?: SpeechSynthesisVoice
}

export function ABXExercise({ exercise, onSubmit, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const stimuli = exercise.stimuli ?? []
  const [stimA, stimB, stimX] = stimuli

  function handlePlay(index: number) {
    const word = stimuli[index]?.word
    if (word) speak(word, { voice })
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
      {/* References 1 and 2 */}
      <div className="grid w-full grid-cols-2 gap-3.5">
        {[stimA, stimB].map((stim, i) => {
          const num = i === 0 ? '1' : '2'
          return stim ? (
            <button
              key={num}
              type="button"
              onClick={() => handlePlay(i)}
              className="flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-border-default bg-surface-sunken/50 p-4 transition-all duration-150 hover:bg-surface-sunken hover:border-primary/50 focus-ring select-none"
            >
              <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-subtle">
                Referencia {num}
              </span>
              <div className="flex size-11 items-center justify-center rounded-full border border-border-default bg-surface-raised text-fg transition-all duration-150 group-hover:text-primary">
                <Volume2 size={20} aria-hidden />
              </div>
              {stim.ipa ? (
                <span className="font-ipa text-body-lg font-semibold text-fg">
                  {stim.ipa}
                </span>
              ) : (
                <span className="text-caption text-fg-muted">Escuchar</span>
              )}
            </button>
          ) : null
        })}
      </div>

      {/* Unknown Target Stimulus (3 / X) */}
      {stimX && (
        <button
          type="button"
          onClick={() => handlePlay(2)}
          className="flex w-full cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-primary/40 bg-primary-soft/40 p-5 transition-all duration-150 hover:bg-primary-soft/60 hover:border-primary focus-ring select-none"
        >
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-primary">
            3 · Sonido incógnita
          </span>
          <div className="flex size-12 items-center justify-center rounded-full border-2 border-primary bg-primary text-on-primary shadow-sm transition-transform duration-150 active:scale-95">
            <Volume2 size={22} aria-hidden />
          </div>
          <span className="text-caption font-medium text-fg-muted">
            Toca para escuchar el audio 3
          </span>
        </button>
      )}
    </div>
  )

  return (
    <AuditoryDiscriminationBase
      title="¿El tercer sonido suena más como el 1 o el 2?"
      kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Discriminación auditiva` : 'Discriminación auditiva'}
      hint="Escucha los 3 audios y elige a cuál referencia se asemeja la incógnita"
      stimulusSlot={stimulusSlot}
      options={exercise.options}
      selectedIds={selected ? [selected] : []}
      correctIds={exercise.correctIds}
      submitted={submitted}
      mode="single"
      canConfirm={!(!selected || submitted)}
      onToggleOption={handleSelect}
      onConfirm={handleConfirm}
    />
  )
}
