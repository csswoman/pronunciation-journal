'use client'

// Planned structure:
// <ReorderWordsExercise>
//   <AnswerArea (placed tokens) />
//   <TokenBank (remaining tokens) />
//   <CheckButton />

import { useState } from 'react'
import type { ReorderWordsExercise as ReorderWordsExerciseType } from '@/lib/exercises/types'

interface Props {
  exercise: ReorderWordsExerciseType
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

export function ReorderWordsExercise({ exercise, onSubmit }: Props) {
  // Tokens in the bank (not yet placed), stored as {token, originalIndex} to handle duplicates
  const [bank, setBank] = useState<Array<{ token: string; idx: number }>>(
    exercise.tokens.map((token, idx) => ({ token, idx }))
  )
  // Tokens placed in answer order
  const [placed, setPlaced] = useState<Array<{ token: string; idx: number }>>([])
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  function pickFromBank(item: { token: string; idx: number }) {
    if (submitted) return
    setBank(prev => prev.filter(t => t.idx !== item.idx))
    setPlaced(prev => [...prev, item])
  }

  function returnToBank(item: { token: string; idx: number }) {
    if (submitted) return
    setPlaced(prev => prev.filter(t => t.idx !== item.idx))
    setBank(prev => [...prev, item].sort((a, b) => a.idx - b.idx))
  }

  function handleCheck() {
    if (submitted || placed.length !== exercise.tokens.length) return
    const userSentence = placed.map(t => t.token).join(' ')
    const correct = userSentence === exercise.sentence
    setIsCorrect(correct)
    setSubmitted(true)
    onSubmit(correct, userSentence)
  }

  const canCheck = placed.length === exercise.tokens.length && !submitted

  return (
    <div className="flex flex-col gap-5 w-full">
      <p className="text-[15px] text-[var(--text-secondary)] text-center m-0">
        Arrange the words in the correct order
      </p>

      {/* Answer area */}
      <div
        className={[
          'min-h-[64px] rounded-[var(--radius-md)] border border-[1.5px] border-dashed border-solid p-3 flex flex-wrap gap-2 items-center transition-colors duration-200',
          submitted
            ? isCorrect
              ? 'border-[var(--success-border)] bg-[var(--success-soft)]'
              : 'border-[var(--error-border)] bg-[var(--error-soft)]'
            : placed.length > 0
              ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
              : 'border-[var(--border-subtle)] bg-[var(--surface-raised)]',
        ].join(' ')}
      >
        {placed.length === 0 && (
          <span className="text-[13px] text-[var(--text-tertiary)] select-none">
            Tap words below to place them here…
          </span>
        )}
        {placed.map(item => (
          <button
            key={item.idx}
            type="button"
            onClick={() => returnToBank(item)}
            disabled={submitted}
            className={[
              'rounded-[var(--radius-sm)] py-1.5 px-3 text-[14px] font-medium border border-solid transition-all duration-150',
              submitted
                ? isCorrect
                  ? 'bg-[var(--success)] text-white border-transparent cursor-default'
                  : 'bg-[var(--error)] text-white border-transparent cursor-default'
                : 'bg-white border-[var(--primary)] text-[var(--primary)] cursor-pointer hover:bg-[var(--primary)] hover:text-white',
            ].join(' ')}
          >
            {item.token}
          </button>
        ))}
      </div>

      {/* Token bank */}
      <div className="flex flex-wrap gap-2">
        {bank.map(item => (
          <button
            key={item.idx}
            type="button"
            onClick={() => pickFromBank(item)}
            className="rounded-[var(--radius-sm)] py-1.5 px-3 text-[14px] font-medium bg-[var(--surface-raised)] border border-[1.5px] border-solid border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-all duration-150"
          >
            {item.token}
          </button>
        ))}
      </div>

      {submitted && !isCorrect && (
        <p className="text-[13px] text-[var(--text-tertiary)] text-center m-0">
          Correct order: <strong className="text-[var(--text-primary)]">{exercise.sentence}</strong>
        </p>
      )}

      {!submitted && (
        <button
          type="button"
          onClick={handleCheck}
          disabled={!canCheck}
          className={[
            'w-full py-4 rounded-[var(--radius-md)] border-0 text-[15px] font-semibold transition-all duration-[250ms]',
            canCheck
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
