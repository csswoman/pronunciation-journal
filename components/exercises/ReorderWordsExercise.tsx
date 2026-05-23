'use client'

// Planned structure:
// <ReorderWordsExercise>
//   <PromptLine />       — instruction label
//   <AnswerArea />       — chips placed by the user (ordered)
//   <TokenBank />        — remaining shuffled chips
//   <FeedbackBar />      — correct/wrong after submission

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/cn'
import type { ReorderWordsExercise as ReorderWordsExerciseType } from '@/lib/exercises/types'

interface Props {
  exercise: ReorderWordsExerciseType
  onSubmit: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
}

type AnswerState = 'idle' | 'correct' | 'wrong'

interface Chip {
  key: string   // token + index for stable identity
  word: string
}

function makeChips(tokens: string[]): Chip[] {
  return tokens.map((word, i) => ({ key: `${word}-${i}`, word }))
}

export function ReorderWordsExercise({ exercise, onSubmit }: Props) {
  const [bank, setBank] = useState<Chip[]>(() => makeChips(exercise.tokens))
  const [answer, setAnswer] = useState<Chip[]>([])
  const [state, setState] = useState<AnswerState>('idle')
  const startMs = useRef(Date.now())

  useEffect(() => {
    setBank(makeChips(exercise.tokens))
    setAnswer([])
    setState('idle')
    startMs.current = Date.now()
  }, [exercise.id])

  function moveToAnswer(chip: Chip) {
    if (state !== 'idle') return
    setBank(b => b.filter(c => c.key !== chip.key))
    setAnswer(a => [...a, chip])
  }

  function moveToBank(chip: Chip) {
    if (state !== 'idle') return
    setAnswer(a => a.filter(c => c.key !== chip.key))
    setBank(b => [...b, chip])
  }

  function handleCheck() {
    if (state !== 'idle' || answer.length === 0) return
    const userAnswer = answer.map(c => c.word).join(' ')
    const isCorrect = userAnswer === exercise.sentence
    setState(isCorrect ? 'correct' : 'wrong')
    onSubmit(isCorrect, userAnswer, Date.now() - startMs.current)
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <PromptLine />
      <AnswerArea chips={answer} done={state !== 'idle'} onChipClick={moveToBank} />
      <TokenBank chips={bank} done={state !== 'idle'} onChipClick={moveToAnswer} />
      {state === 'idle' && (
        <button
          type="button"
          onClick={handleCheck}
          disabled={answer.length === 0}
          className={cn(
            'self-center rounded-[var(--radius-md)] px-6 py-2.5 text-[14px] font-semibold transition-colors',
            answer.length === 0
              ? 'bg-surface-raised text-fg-subtle cursor-default'
              : 'bg-primary text-white hover:bg-primary/90 cursor-pointer',
          )}
        >
          Check
        </button>
      )}
      {state !== 'idle' && (
        <FeedbackBar isCorrect={state === 'correct'} sentence={exercise.sentence} />
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PromptLine() {
  return (
    <p className="text-center text-[13px] font-medium uppercase tracking-[.08em] text-fg-subtle">
      Arrange the words in the correct order
    </p>
  )
}

interface AreaProps {
  chips: Chip[]
  done: boolean
  onChipClick: (chip: Chip) => void
}

function AnswerArea({ chips, done, onChipClick }: AreaProps) {
  return (
    <div
      className={cn(
        'min-h-[52px] flex flex-wrap gap-2 rounded-[var(--radius-md)] border-[1.5px] border-dashed p-3 transition-colors',
        chips.length === 0 ? 'border-border-subtle' : 'border-primary/40',
      )}
      aria-label="Your answer"
    >
      {chips.map(chip => (
        <WordChip
          key={chip.key}
          chip={chip}
          variant="placed"
          done={done}
          onClick={onChipClick}
        />
      ))}
    </div>
  )
}

function TokenBank({ chips, done, onChipClick }: AreaProps) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Available words">
      {chips.map(chip => (
        <WordChip
          key={chip.key}
          chip={chip}
          variant="bank"
          done={done}
          onClick={onChipClick}
        />
      ))}
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
        'rounded-[var(--radius-sm)] border-[1.5px] px-3 py-1.5 text-[14px] font-medium transition-all duration-150',
        !done && variant === 'bank' &&
          'bg-surface-raised border-border-subtle text-fg hover:border-primary hover:bg-primary-soft cursor-pointer',
        !done && variant === 'placed' &&
          'bg-primary-soft border-primary/50 text-primary hover:border-error hover:bg-error-soft hover:text-error cursor-pointer',
        done && 'cursor-default opacity-80 border-border-subtle bg-surface-raised text-fg',
      )}
    >
      {chip.word}
    </button>
  )
}

function FeedbackBar({ isCorrect, sentence }: { isCorrect: boolean; sentence: string }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] px-4 py-3 text-[14px] font-medium',
        isCorrect ? 'bg-success-soft text-success' : 'bg-error-soft text-error',
      )}
    >
      {isCorrect ? 'Correct!' : `Correct order: "${sentence}"`}
    </div>
  )
}
