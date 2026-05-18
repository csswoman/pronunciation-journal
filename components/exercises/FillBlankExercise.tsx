'use client'

// Planned structure:
// <FillBlankExercise>
//   <Sentence with blank />
//   <OptionButtons />
//   <HintToggle />

import { useState } from 'react'
import type { FillBlankExercise as FillBlankExerciseType } from '@/lib/exercises/types'

interface Props {
  exercise: FillBlankExerciseType
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

export function FillBlankExercise({ exercise, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showHint, setShowHint] = useState(false)

  function handleSelect(option: string) {
    if (submitted) return
    setSelected(option)
  }

  function handleCheck() {
    if (!selected || submitted) return
    const isCorrect = selected === exercise.answer
    setSubmitted(true)
    onSubmit(isCorrect, selected)
  }

  const sentenceParts = exercise.sentence.split('___')

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <p className="text-[15px] text-[var(--text-secondary)] text-center m-0">
        Choose the word that completes the sentence
      </p>

      {/* Sentence with blank */}
      <div className="text-body-lg text-[var(--text-primary)] text-center leading-relaxed px-2">
        {sentenceParts[0]}
        <span className="inline-block min-w-[80px] border-b-2 border-solid border-[var(--primary)] mx-1 text-center font-semibold text-[var(--primary)]">
          {submitted ? exercise.answer : selected ?? ' '}
        </span>
        {sentenceParts[1]}
      </div>

      {/* Hint */}
      {exercise.hint && (
        <button
          type="button"
          onClick={() => setShowHint(h => !h)}
          className="text-xs text-[var(--text-tertiary)] underline bg-transparent border-0 cursor-pointer p-0"
        >
          {showHint ? 'Hide hint' : 'Show hint'}
        </button>
      )}
      {showHint && exercise.hint && (
        <p className="text-[13px] text-[var(--text-secondary)] italic text-center m-0 px-4">
          {exercise.hint}
        </p>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {exercise.options.map(option => {
          const isAnswer = option === exercise.answer
          const isSelected = option === selected

          let stateClass = 'bg-[var(--surface-raised)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--primary)]'
          if (submitted) {
            if (isAnswer) stateClass = 'bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--success)]'
            else if (isSelected) stateClass = 'bg-[var(--error-soft)] border-[var(--error-border)] text-[var(--error)]'
          } else if (isSelected) {
            stateClass = 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]'
          }

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={submitted}
              className={[
                'rounded-[var(--radius-md)] py-4 px-3 text-[15px] font-medium border border-[1.5px] border-solid transition-all duration-200 cursor-pointer',
                stateClass,
              ].join(' ')}
            >
              {option}
            </button>
          )
        })}
      </div>

      {/* Check button */}
      {!submitted && (
        <button
          type="button"
          onClick={handleCheck}
          disabled={!selected}
          className={[
            'w-full py-4 rounded-[var(--radius-md)] border-0 text-[15px] font-semibold transition-all duration-[250ms]',
            selected
              ? 'cursor-pointer bg-[var(--gradient-primary)] text-white'
              : 'cursor-not-allowed bg-[var(--surface-raised)] text-[var(--text-tertiary)]',
          ].join(' ')}
        >
          Check
        </button>
      )}
    </div>
  )
}
