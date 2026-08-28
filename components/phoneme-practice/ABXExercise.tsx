'use client'

// Planned structure:
// <ABXExercise>
//   <PhonemeExercisePrompt />
//   <ReferencesGrid />       — Sound 1 and Sound 2 reference cards
//   <TargetStimulusCard />   — Sound 3 (the unknown stimulus X)
//   <ChoiceGrid />           — Option A or Option B selection buttons with radio dots
//   <PhonemeConfirmButton /> — Check answer CTA
// </ABXExercise>

import { useState } from 'react'
import { Volume2 } from '@/components/icons'
import { cn } from '@/lib/cn'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeConfirmButton } from '@/components/phoneme-practice/PhonemeConfirmButton'
import { PhonemeExercisePrompt } from '@/components/phoneme-practice/PhonemeExercisePrompt'
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

  return (
    <div className="flex w-full flex-col gap-6">
      <PhonemeExercisePrompt
        centered
        title="¿El tercer sonido suena más como el 1 o el 2?"
        kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Discriminación auditiva` : 'Discriminación auditiva'}
        hint="Escucha los 3 audios y elige a cuál referencia se asemeja la incógnita"
      />

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

      {/* Options Selection Grid */}
      <div
        role="radiogroup"
        aria-label="Elige opción 1 o 2"
        className="grid w-full grid-cols-2 gap-3.5"
      >
        {exercise.options.map((opt) => {
          const isCorrect = exercise.correctIds.includes(opt.id)
          const isSelected = selected === opt.id

          return (
            <div
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={cn(
                'group flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 p-4 transition-all duration-150 select-none',
                !submitted && !isSelected && 'border-border-default bg-surface-sunken/40 hover:border-primary/50 hover:bg-surface-sunken text-fg',
                !submitted && isSelected && 'border-primary bg-primary-soft text-primary shadow-xs font-semibold ring-1 ring-primary/30',
                submitted && isCorrect && 'border-success-border bg-success-soft text-success pf-reveal-ok font-semibold',
                submitted && isSelected && !isCorrect && 'border-error-border bg-error-soft text-error pf-reveal-bad font-semibold',
                submitted && !isSelected && !isCorrect && 'border-border-subtle bg-surface-raised/40 text-fg-subtle opacity-40 cursor-default',
              )}
            >
              <div
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                  !isSelected && 'border-border-strong bg-surface-base',
                  isSelected && !submitted && 'border-primary bg-primary text-on-primary',
                  submitted && isCorrect && 'border-success bg-success text-on-primary',
                  submitted && isSelected && !isCorrect && 'border-error bg-error text-on-primary',
                )}
                aria-hidden
              >
                {isSelected && (
                  <div className="size-2 rounded-full bg-current" />
                )}
              </div>
              <span className="text-body-lg font-semibold">{opt.label}</span>
            </div>
          )
        })}
      </div>

      {!submitted && (
        <PhonemeConfirmButton
          onClick={handleConfirm}
          disabled={!selected || submitted}
        />
      )}
    </div>
  )
}
