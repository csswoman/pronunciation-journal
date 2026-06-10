'use client'

// Planned structure:
// <MultipleChoiceExercise>
//   <QuestionPrompt />  — question text
//   <OptionGrid />      — 4 choice buttons
//   <FeedbackBar />     — correct/wrong + explanation after selection

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/cn'
import type { MultipleChoiceExercise as MultipleChoiceExerciseType } from '@/lib/exercises/types'

interface Props {
  exercise: MultipleChoiceExerciseType
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

type AnswerState = 'idle' | 'correct' | 'wrong'

export function MultipleChoiceExercise({ exercise, onSubmit }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [state, setState]       = useState<AnswerState>('idle')
  const startMs = useRef(Date.now())

  useEffect(() => {
    setSelected(null)
    setState('idle')
    startMs.current = Date.now()
  }, [exercise.id])

  function handleSelect(idx: number) {
    if (state !== 'idle') return
    const isCorrect = idx === exercise.answerIndex
    setSelected(idx)
    setState(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => onSubmit(isCorrect, exercise.options[idx]), 1000)
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      <p className="text-xs font-semibold uppercase tracking-[.08em] text-[var(--text-tertiary)]">
        Choose the best answer
      </p>

      <p className="text-lg font-medium text-[var(--text-primary)] leading-snug">
        {exercise.question}
      </p>

      <div className="flex flex-col gap-2">
        {exercise.options.map((option, idx) => {
          const isSelected = selected === idx
          const isCorrectOption = idx === exercise.answerIndex
          const revealed = state !== 'idle'

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              disabled={revealed}
              className={cn(
                'w-full text-left px-4 py-3 rounded-[var(--radius-md)] border text-sm font-medium transition-all',
                !revealed && 'border-[var(--border-subtle)] bg-[var(--surface-raised)] text-[var(--text-primary)] hover:border-[var(--primary)] cursor-pointer',
                revealed && isCorrectOption && 'border-[var(--success)] bg-[color-mix(in_oklch,var(--success)_12%,transparent)] text-[var(--success)]',
                revealed && isSelected && !isCorrectOption && 'border-[var(--error)] bg-[color-mix(in_oklch,var(--error)_12%,transparent)] text-[var(--error)]',
                revealed && !isSelected && !isCorrectOption && 'border-[var(--border-subtle)] text-[var(--text-tertiary)] opacity-60',
              )}
            >
              {option}
            </button>
          )
        })}
      </div>

      {state !== 'idle' && exercise.explanation && (
        <p className={cn(
          'text-sm px-4 py-3 rounded-[var(--radius-md)]',
          state === 'correct'
            ? 'bg-[color-mix(in_oklch,var(--success)_10%,transparent)] text-[var(--success)]'
            : 'bg-[color-mix(in_oklch,var(--error)_10%,transparent)] text-[var(--text-secondary)]',
        )}>
          {exercise.explanation}
        </p>
      )}
    </div>
  )
}
