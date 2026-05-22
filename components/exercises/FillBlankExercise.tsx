'use client'

// Planned structure:
// <FillBlankExercise>
//   <SentencePrompt />   — sentence with highlighted blank
//   <HintLine />         — optional hint/definition
//   <OptionGrid />       — 4 choice buttons
//   <FeedbackBar />      — correct/wrong after selection

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/cn'
import type { FillBlankExercise as FillBlankExerciseType } from '@/lib/exercises/types'

interface Props {
  exercise: FillBlankExerciseType
  onSubmit: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
}

type AnswerState = 'idle' | 'correct' | 'wrong'

export function FillBlankExercise({ exercise, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [state, setState] = useState<AnswerState>('idle')
  const startMs = useRef(Date.now())

  // Reset timer when exercise changes.
  useEffect(() => {
    setSelected(null)
    setState('idle')
    startMs.current = Date.now()
  }, [exercise.id])

  function handlePick(option: string) {
    if (state !== 'idle') return
    const isCorrect = option === exercise.answer
    setSelected(option)
    setState(isCorrect ? 'correct' : 'wrong')
    onSubmit(isCorrect, option, Date.now() - startMs.current)
  }

  const parts = exercise.sentence.split('___')

  return (
    <div className="flex w-full flex-col gap-5">
      <SentencePrompt parts={parts} />
      {exercise.hint && <HintLine hint={exercise.hint} />}
      <OptionGrid
        options={exercise.options}
        answer={exercise.answer}
        selected={selected}
        answerState={state}
        onPick={handlePick}
      />
      {state !== 'idle' && (
        <FeedbackBar isCorrect={state === 'correct'} answer={exercise.answer} />
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SentencePrompt({ parts }: { parts: string[] }) {
  return (
    <p className="text-center text-[17px] leading-relaxed text-fg">
      {parts[0]}
      <span className="inline-block min-w-[4rem] rounded-[var(--radius-sm)] bg-primary/10 px-2 font-semibold text-primary">
        ___
      </span>
      {parts[1]}
    </p>
  )
}

function HintLine({ hint }: { hint: string }) {
  return (
    <p className="text-center text-[13px] italic text-fg-muted">{hint}</p>
  )
}

interface OptionGridProps {
  options: string[]
  answer: string
  selected: string | null
  answerState: AnswerState
  onPick: (option: string) => void
}

function OptionGrid({ options, answer, selected, answerState, onPick }: OptionGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(option => (
        <OptionButton
          key={option}
          option={option}
          isAnswer={option === answer}
          isSelected={option === selected}
          answerState={answerState}
          onPick={onPick}
        />
      ))}
    </div>
  )
}

interface OptionButtonProps {
  option: string
  isAnswer: boolean
  isSelected: boolean
  answerState: AnswerState
  onPick: (option: string) => void
}

function OptionButton({ option, isAnswer, isSelected, answerState, onPick }: OptionButtonProps) {
  const done = answerState !== 'idle'

  const className = cn(
    'rounded-[var(--radius-md)] border-[1.5px] py-3 px-4 text-[14px] font-medium transition-all duration-200 min-h-[48px] text-left',
    !done && 'bg-surface-raised border-border-subtle text-fg hover:border-primary hover:bg-primary-soft cursor-pointer',
    done && isAnswer && 'bg-success-soft border-success-border text-success cursor-default',
    done && isSelected && !isAnswer && 'bg-error-soft border-error-border text-error cursor-default',
    done && !isSelected && !isAnswer && 'bg-surface-raised border-border-subtle text-fg-subtle cursor-default opacity-60',
  )

  return (
    <button
      type="button"
      onClick={() => onPick(option)}
      disabled={done}
      aria-pressed={isSelected}
      aria-disabled={done}
      className={className}
    >
      {option}
    </button>
  )
}

function FeedbackBar({ isCorrect, answer }: { isCorrect: boolean; answer: string }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] px-4 py-3 text-[14px] font-medium',
        isCorrect ? 'bg-success-soft text-success' : 'bg-error-soft text-error',
      )}
    >
      {isCorrect ? 'Correct!' : `The answer is "${answer}"`}
    </div>
  )
}
