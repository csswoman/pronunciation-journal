'use client'

// Planned structure:
// <FillBlankExercise>
//   <SentencePrompt />   — sentence with highlighted blank
//   <HintLine />         — optional hint/definition
//   <OptionGrid />       — 4 choice buttons with dot
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
  const [state, setState]       = useState<AnswerState>('idle')
  const startMs = useRef(Date.now())

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

function SentencePrompt({ parts }: { parts: string[] }) {
  return (
    <p className="text-center text-base leading-relaxed text-[var(--text-primary)]">
      {parts[0]}
      <span className="inline-block min-w-[4rem] rounded-lg bg-[var(--primary-soft)] px-2 font-semibold text-[var(--primary)]">
        ___
      </span>
      {parts[1]}
    </p>
  )
}

function HintLine({ hint }: { hint: string }) {
  return (
    <p className="text-center text-[13px] italic text-[var(--text-tertiary)]">{hint}</p>
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
    <div className="flex flex-col gap-2.5">
      {options.map((option, idx) => (
        <OptionButton
          key={option}
          option={option}
          index={idx}
          isAnswer={option === answer}
          isSelected={option === selected}
          answerState={answerState}
          onPick={onPick}
        />
      ))}
    </div>
  )
}

const DOT_COLORS = [
  'oklch(0.65 0.18 25)',
  'oklch(0.65 0.18 250)',
  'oklch(0.65 0.18 310)',
  'oklch(0.65 0.16 145)',
]

interface OptionButtonProps {
  option: string
  index: number
  isAnswer: boolean
  isSelected: boolean
  answerState: AnswerState
  onPick: (option: string) => void
}

function OptionButton({ option, index, isAnswer, isSelected, answerState, onPick }: OptionButtonProps) {
  const done = answerState !== 'idle'

  let borderColor = 'var(--border-default)'
  let bgColor     = 'var(--surface-raised)'
  let dotColor    = DOT_COLORS[index % DOT_COLORS.length]

  if (done && isAnswer)             { borderColor = 'var(--success-border)'; bgColor = 'var(--success-soft)'; dotColor = 'var(--success)' }
  if (done && isSelected && !isAnswer) { borderColor = 'var(--error-border)';   bgColor = 'var(--error-soft)';   dotColor = 'var(--error)' }

  return (
    <button
      type="button"
      onClick={() => onPick(option)}
      disabled={done}
      aria-pressed={isSelected}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-[14px] font-medium transition-all duration-200 min-h-[48px] text-left',
        !done && 'hover:border-[var(--border-hover)] active:scale-[0.99] cursor-pointer',
        done && !isAnswer && !isSelected && 'opacity-50 cursor-default',
        done && (isAnswer || isSelected) && 'cursor-default',
      )}
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
      <span className="text-[var(--text-primary)]">{option}</span>
    </button>
  )
}

function FeedbackBar({ isCorrect, answer }: { isCorrect: boolean; answer: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm font-medium border"
      style={{
        backgroundColor: isCorrect ? 'var(--success-soft)' : 'var(--error-soft)',
        borderColor: isCorrect ? 'var(--success)'      : 'var(--error)',
        color:           isCorrect ? 'var(--success-value)' : 'var(--error-value)',
      }}
    >
      {isCorrect ? '✓ Correct!' : `✗ The answer is "${answer}"`}
    </div>
  )
}
