'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import type { ReorderWordsExercise as ReorderWordsExerciseType } from '@/lib/exercises/types'
import { useUISounds } from '@/hooks/useUISounds'
import { gradeReorder } from '@/lib/exercises/grade-reorder'

interface Props {
  exercise: ReorderWordsExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
  focusUi?: boolean
}

type AnswerState = 'idle' | 'correct' | 'wrong'
interface Chip {
  key: string
  word: string
}

function makeChips(tokens: string[]): Chip[] {
  return tokens.map((word, i) => ({ key: `${word}-${i}`, word }))
}

export function ReorderWordsExercise({ exercise, onResult, focusUi = false }: Props) {
  const [bank, setBank] = useState<Chip[]>(() => makeChips(exercise.tokens))
  const [answer, setAnswer] = useState<Chip[]>([])
  const [state, setState] = useState<AnswerState>('idle')
  const startMs = useRef(Date.now())
  const { playTap, playCorrect, playWrong } = useUISounds()

  useEffect(() => {
    setBank(makeChips(exercise.tokens))
    setAnswer([])
    setState('idle')
    startMs.current = Date.now()
  }, [exercise.id, exercise.tokens])

  function moveToAnswer(chip: Chip) {
    if (state !== 'idle') return
    playTap()
    setBank((b) => b.filter((c) => c.key !== chip.key))
    setAnswer((a) => [...a, chip])
  }

  function moveToBank(chip: Chip) {
    if (state !== 'idle') return
    setAnswer((a) => a.filter((c) => c.key !== chip.key))
    setBank((b) => [...b, chip])
  }

  function handleCheck() {
    if (state !== 'idle' || answer.length === 0) return
    const userAnswer = answer.map((c) => c.word).join(' ')
    const isCorrect = gradeReorder(userAnswer, exercise.sentence)
    setState(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) playCorrect(); else playWrong()
    onResult(isCorrect, userAnswer, Date.now() - startMs.current)
  }

  const canCheck =
    state === 'idle' && answer.length === exercise.tokens.length && bank.length === 0

  if (focusUi) {
    return (
      <div className="phoneme-focus__exercise">

        <div
          className={cn('pf-order-answer', answer.length === 0 && 'pf-order-answer--empty')}
          aria-label="Your answer"
        >
          {answer.map((chip) => (
            <button
              key={chip.key}
              type="button"
              disabled={state !== 'idle'}
              onClick={() => moveToBank(chip)}
              className="pf-order-chip pf-order-chip--placed"
            >
              {chip.word}
            </button>
          ))}
        </div>

        <div className="pf-order-tray" aria-label="Available words">
          {bank.map((chip) => (
            <button
              key={chip.key}
              type="button"
              disabled={state !== 'idle'}
              onClick={() => moveToAnswer(chip)}
              className="pf-order-chip"
            >
              {chip.word}
            </button>
          ))}
        </div>

        {state === 'idle' && (
          <button
            type="button"
            onClick={handleCheck}
            disabled={!canCheck}
            className="pf-cta pf-cta--primary"
          >
            Check
          </button>
        )}

        {state !== 'idle' && (
          <p className="pf-answer-note">
            Correct order: <strong>{exercise.sentence}</strong>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        className={cn(
          'min-h-13 flex flex-wrap gap-2 rounded-xl border-[1.5px] border-dashed p-3 transition-colors',
          answer.length === 0 ? 'border-border-subtle' : 'border-primary',
        )}
        aria-label="Your answer"
      >
        {answer.map((chip) => (
          <WordChip key={chip.key} chip={chip} variant="placed" done={state !== 'idle'} onClick={moveToBank} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 py-1" aria-label="Available words">
        {bank.map((chip) => (
          <WordChip key={chip.key} chip={chip} variant="bank" done={state !== 'idle'} onClick={moveToAnswer} />
        ))}
      </div>
      {state === 'idle' && (
        <button
          type="button"
          onClick={handleCheck}
          disabled={!canCheck}
          className={cn(
            'w-full rounded-full py-3.5 text-[15px] font-semibold transition-all duration-150 mt-3',
            canCheck
              ? 'bg-(--cta-bg) text-(--cta-fg) cursor-pointer hover:opacity-90 active:scale-[0.99]'
              : 'bg-surface-raised text-fg-subtle cursor-not-allowed opacity-50',
          )}
        >
          Check
        </button>
      )}
    </div>
  )
}

interface ChipProps {
  chip: Chip
  variant: 'bank' | 'placed'
  done: boolean
  onClick: (chip: Chip) => void
}

function WordChip({ chip, variant, done, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(chip)}
      disabled={done}
      className={cn(
        'rounded-full border px-3 py-1.5 text-[14px] font-medium transition-all duration-150',
        !done && variant === 'bank' &&
          'bg-surface-raised border-border-default text-fg hover:border-primary hover:bg-primary-soft cursor-pointer',
        !done && variant === 'placed' &&
          'bg-primary-soft border-primary text-primary hover:border-error hover:bg-error-soft hover:text-error cursor-pointer',
        done &&
          'cursor-default opacity-80 border-border-subtle bg-surface-raised text-fg-muted',
      )}
    >
      {chip.word}
    </button>
  )
}

