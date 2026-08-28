'use client'

// Planned structure:
// <MultipleChoiceExercise>
//   <QuestionPrompt />  — question text
//   <OptionGrid>        — choice buttons with radio dots
//     <OptionRow />
//   </OptionGrid>
//   <FeedbackBar />     — explanation with proper tokens
// </MultipleChoiceExercise>

import { useState, useRef, useEffect } from 'react'
import { Check, X } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { MultipleChoiceExercise as MultipleChoiceExerciseType } from '@/lib/exercises/types'
import { buildPedagogicalFeedback } from '@/lib/exercises/feedback'
import { useUISounds } from '@/hooks/useUISounds'

interface Props {
  exercise: MultipleChoiceExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number, extras?: { feedback?: ReturnType<typeof buildPedagogicalFeedback> }) => void
  hintCount?: number
}

type AnswerState = 'idle' | 'correct' | 'wrong'

export function MultipleChoiceExercise({ exercise, onResult, hintCount = 0 }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [state, setState] = useState<AnswerState>('idle')
  const startMs = useRef(Date.now())
  const { playTap, playCorrect, playWrong } = useUISounds()

  useEffect(() => {
    setSelected(null)
    setState('idle')
    startMs.current = Date.now()
  }, [exercise.id])

  function handleSelect(idx: number) {
    if (state !== 'idle') return
    playTap()
    const isCorrect = idx === exercise.answerIndex
    setSelected(idx)
    setState(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) playCorrect(); else playWrong()
    const userAnswer = exercise.options[idx]
    onResult(isCorrect, userAnswer, Date.now() - startMs.current, {
      feedback: buildPedagogicalFeedback(exercise, isCorrect, userAnswer, { hintUsed: hintCount > 0 }),
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <p className="text-body-lg font-medium text-fg leading-snug">
        {exercise.question}
      </p>

      <div className="flex flex-col gap-3">
        {exercise.options.map((option, idx) => {
          const isSelected = selected === idx
          const isCorrectOption = idx === exercise.answerIndex
          const revealed = state !== 'idle'

          return (
            <div
              key={idx}
              onClick={() => handleSelect(idx)}
              className={cn(
                'group flex w-full min-h-14 items-center justify-between rounded-xl border p-4 transition-all duration-150 select-none',
                !revealed && 'border-border-default bg-surface-sunken/40 hover:border-primary/50 hover:bg-surface-sunken text-fg cursor-pointer',
                !revealed && isSelected && 'border-primary bg-primary-soft text-primary shadow-xs font-semibold ring-1 ring-primary/30',
                revealed && isCorrectOption && 'border-success-border bg-success-soft text-success pf-reveal-ok font-semibold cursor-default',
                revealed && isSelected && !isCorrectOption && 'border-error-border bg-error-soft text-error pf-reveal-bad font-semibold cursor-default',
                revealed && !isSelected && !isCorrectOption && 'border-border-subtle bg-surface-raised/40 text-fg-subtle opacity-40 cursor-default',
              )}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                    !isSelected && !revealed && 'border-border-strong bg-surface-base',
                    !isSelected && revealed && !isCorrectOption && 'border-border-subtle bg-surface-base',
                    !isSelected && revealed && isCorrectOption && 'border-success bg-surface-base',
                    isSelected && !revealed && 'border-primary bg-surface-base',
                    revealed && isCorrectOption && 'border-success bg-surface-base',
                    revealed && isSelected && !isCorrectOption && 'border-error bg-surface-base',
                  )}
                  aria-hidden
                >
                  {isSelected && (
                    <div
                      className={cn(
                        'size-2.5 rounded-full transition-transform duration-150',
                        !revealed && 'bg-primary',
                        revealed && isCorrectOption && 'bg-success shadow-xs scale-110',
                        revealed && !isCorrectOption && 'bg-error shadow-xs',
                      )}
                    />
                  )}
                </div>

                <span className="text-body-md font-medium">{option}</span>
              </div>

              {revealed && (
                <div className="shrink-0">
                  {isCorrectOption ? (
                    <Check size={20} className="text-success" />
                  ) : isSelected ? (
                    <X size={20} className="text-error" />
                  ) : null}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {(state === 'wrong' || (state === 'idle' && hintCount > 0)) && exercise.explanation && (
        <p className="text-body-sm px-4 py-3 rounded-xl bg-primary-soft text-fg-muted">
          {exercise.explanation}
        </p>
      )}
    </div>
  )
}
