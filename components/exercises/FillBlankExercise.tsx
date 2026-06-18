'use client'

// Planned structure:
// <FillBlankExercise>
//   <SentencePrompt />   — sentence with dashed blank (length matches answer)
//   <OptionGrid />       — clean choice buttons, no dot indicator
//   <HintPanel />        — hint text below options (revealed via external button)

import { useState, useRef, useEffect } from 'react'
import { Lightbulb } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { FillBlankExercise as FillBlankExerciseType } from '@/lib/exercises/types'
import { useUISounds } from '@/hooks/useUISounds'

interface Props {
  exercise: FillBlankExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
  onHint?: () => void
  hintCount?: number
}

type AnswerState = 'idle' | 'correct' | 'wrong'

export function FillBlankExercise({ exercise, onResult, onHint, hintCount = 0 }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [state, setState]       = useState<AnswerState>('idle')
  const [hintLevel, setHintLevel] = useState(0)
  const startMs = useRef(Date.now())
  const { playTap, playCorrect, playWrong } = useUISounds()

  const hasHintSource = !!(exercise.hints || exercise.hint)
  const maxHintLevel = exercise.hints ? (exercise.hints.level3 ? 3 : 2) : 1
  const canShowMoreHint = hasHintSource && state === 'idle' && hintLevel < maxHintLevel

  useEffect(() => {
    setSelected(null)
    setState('idle')
    setHintLevel(0)
    startMs.current = Date.now()
  }, [exercise.id])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (state !== 'idle') return
      const idx = parseInt(e.key) - 1
      if (idx >= 0 && idx < exercise.options.length) {
        handlePick(exercise.options[idx])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, exercise.options])

  const prevHintCount = useRef(hintCount)
  useEffect(() => {
    if (hintCount > prevHintCount.current) {
      if (exercise.hints) {
        const maxLevel = exercise.hints.level3 ? 3 : 2
        setHintLevel((l) => Math.min(l + 1, maxLevel))
      } else if (exercise.hint) {
        setHintLevel(1)
      }
    }
    prevHintCount.current = hintCount
  }, [hintCount, exercise.hints, exercise.hint])

  function handlePick(option: string) {
    if (state !== 'idle') return
    playTap()
    const isCorrect = option === exercise.answer
    setSelected(option)
    setState(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) playCorrect(); else playWrong()
    onResult(isCorrect, option, Date.now() - startMs.current)
  }

  const parts = exercise.sentence.split('___')

  const currentHint = exercise.hints
    ? hintLevel === 1 ? exercise.hints.level1
      : hintLevel === 2 ? exercise.hints.level2
      : hintLevel === 3 ? exercise.hints.level3
      : null
    : hintLevel > 0 ? (exercise.hint ?? null)
    : null

  return (
    <div className="flex w-full flex-col gap-4">
      <SentencePrompt parts={parts} answer={exercise.answer} selected={selected} answerState={state} />
      <OptionGrid
        options={exercise.options}
        answer={exercise.answer}
        selected={selected}
        answerState={state}
        onPick={handlePick}
      />
      {currentHint && <HintPanel hint={currentHint} />}
    </div>
  )
}

function SentencePrompt({
  parts,
  answer,
  selected,
  answerState,
}: {
  parts: string[]
  answer: string
  selected: string | null
  answerState: AnswerState
}) {
  const done = answerState !== 'idle'
  const isCorrect = answerState === 'correct'
  const charCount = Math.max(3, answer.length)

  return (
    <p className="text-lg leading-relaxed text-fg">
      {parts[0].trimEnd()}&nbsp;
      <span
        className="relative inline-flex items-center justify-center mx-1 align-baseline"
        style={{ minWidth: `calc(${charCount * 0.65}em + 8px)`, height: '1.4em' }}
      >
        {/* dashes — hidden once answered */}
        <span
          className={cn(
            'absolute inset-x-0 flex items-end justify-center font-mono text-border-strong tracking-widest transition-opacity duration-200',
            done ? 'opacity-0' : 'opacity-100',
          )}
          style={{ bottom: '-13px' }}
          aria-hidden
        >
          {'—'.repeat(charCount)}
        </span>
        {/* selected word — fades in when answered */}
        <span
          className={cn(
            'absolute inset-x-0 flex justify-center font-semibold transition-all duration-300',
            !done && 'opacity-0 translate-y-1',
            done && isCorrect && 'opacity-100 translate-y-0 text-success',
            done && !isCorrect && 'opacity-100 translate-y-0 text-error',
          )}
          style={{ padding: '0 4px', bottom: '-4px' }}
          aria-live="polite"
        >
          {selected}
        </span>
      </span>
      &nbsp;{parts[1].trimStart()}
    </p>
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
    <div className="flex flex-col gap-2">
      {options.map((option) => (
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

  return (
    <button
      type="button"
      onClick={() => onPick(option)}
      disabled={done}
      aria-pressed={isSelected}
      className={cn(
        'w-full flex items-center justify-between rounded-(--radius-lg) border px-4 py-3.5 text-[15px] font-medium transition-all duration-150 text-left min-h-13',
        !done && 'border-border-default bg-surface-raised text-fg hover:border-border-strong cursor-pointer',
        done && isAnswer && 'border-success-border bg-success-soft text-success cursor-default',
        done && isSelected && !isAnswer && 'border-error-border bg-error-soft text-error cursor-default',
        done && !isAnswer && !isSelected && 'border-border-subtle bg-surface-raised text-fg-subtle opacity-50 cursor-default',
      )}
    >
      <span>{option}</span>
      {done && isAnswer && (
        <span className="text-success text-base leading-none">✓</span>
      )}
    </button>
  )
}

function HintPanel({ hint }: { hint: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md bg-surface-sunken px-4 py-3">
      <Lightbulb size={14} className="mt-0.5 shrink-0 text-fg-subtle" aria-hidden />
      <p className="text-[13px] text-fg-muted italic">{hint}</p>
    </div>
  )
}
