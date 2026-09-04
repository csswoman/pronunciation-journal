'use client'

// Planned structure:
// <FillBlankExercise>
//   <SentencePrompt />   — sentence with dashed blank (length matches answer)
//   <OptionGrid />       — clean choice buttons with radio dots
//   <HintPanel />        — hint text below options (revealed via external button)
// </FillBlankExercise>

import { useState, useRef, useEffect } from 'react'
import { Lightbulb, Check, X } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { FillBlankExercise as FillBlankExerciseType } from '@/lib/exercises/types'
import { buildPedagogicalFeedback } from '@/lib/exercises/feedback'
import { useUISounds } from '@/hooks/useUISounds'

interface Props {
  exercise: FillBlankExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number, extras?: { feedback?: ReturnType<typeof buildPedagogicalFeedback> }) => void
  hintCount?: number
}

type AnswerState = 'idle' | 'correct' | 'wrong'

export function FillBlankExercise({ exercise, onResult, hintCount = 0 }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [state, setState] = useState<AnswerState>('idle')
  const [hintLevel, setHintLevel] = useState(0)
  const startMs = useRef(Date.now())
  const { playTap, playCorrect, playWrong } = useUISounds()

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
    onResult(isCorrect, option, Date.now() - startMs.current, {
      feedback: buildPedagogicalFeedback(exercise, isCorrect, option, { hintUsed: hintLevel > 0 }),
    })
  }

  const parts = exercise.sentence.split('___')

  const currentHint = exercise.hints
    ? hintLevel === 1 ? exercise.hints.level1
      : hintLevel === 2 ? exercise.hints.level2
      : hintLevel === 3 ? exercise.hints.level3
      : null
    : hintLevel > 0 ? (exercise.hint ?? null)
    : null

  const maxHintLevel = exercise.hints
    ? (exercise.hints.level3 ? 3 : 2)
    : (exercise.hint ? 1 : 0)

  return (
    <div className="flex w-full flex-col gap-6">
      <SentencePrompt parts={parts} answer={exercise.answer} selected={selected} answerState={state} />
      <OptionGrid
        options={exercise.options}
        answer={exercise.answer}
        selected={selected}
        answerState={state}
        onPick={handlePick}
      />
      {currentHint && (
        <HintPanel
          hint={currentHint}
          level={hintLevel}
          maxLevel={maxHintLevel}
        />
      )}
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
    <div className="rounded-xl border border-border-default bg-surface-sunken/40 p-5 sm:p-6 text-center shadow-xs">
      <p className="text-h3 font-medium leading-relaxed text-fg sm:text-h2">
        {parts[0].trimEnd()}
        <span
          className={cn(
            'relative inline-flex items-center justify-center mx-1.5 px-3 py-0.5 rounded-lg border transition-all duration-200 align-baseline',
            !done && 'border-dashed border-border-strong/80 bg-surface-base/60 text-transparent select-none shadow-2xs',
            done && isCorrect && 'border-success-border bg-success-soft text-success font-bold shadow-2xs',
            done && !isCorrect && 'border-error-border bg-error-soft text-error font-bold shadow-2xs',
          )}
          style={{ minWidth: `max(4.5rem, calc(${charCount * 0.75}em + 1.5rem))` }}
        >
          {done ? (
            <span className="animate-in fade-in zoom-in-95 duration-200" aria-live="polite">
              {selected}
            </span>
          ) : (
            <span className="font-mono text-body-sm text-fg-subtle/40 tracking-widest" aria-hidden>
              &nbsp;
            </span>
          )}
        </span>
        {parts[1]?.trimStart()}
      </p>
    </div>
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
    <div className="flex flex-col gap-3">
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
      aria-label={option}
      className={cn(
        'group flex w-full min-h-14 items-center justify-between rounded-xl border p-4 transition-all duration-150 select-none text-left focus-ring',
        !done && 'border-border-default bg-surface-sunken/40 hover:border-primary/50 hover:bg-surface-sunken text-fg cursor-pointer',
        !done && isSelected && 'border-primary bg-primary-soft text-primary shadow-xs font-semibold ring-1 ring-primary/30',
        done && isAnswer && 'border-success-border bg-success-soft text-success pf-reveal-ok font-semibold cursor-default',
        done && isSelected && !isAnswer && 'border-error-border bg-error-soft text-error pf-reveal-bad font-semibold cursor-default',
        done && !isAnswer && !isSelected && 'border-border-subtle bg-surface-raised/40 text-fg-subtle opacity-40 cursor-default',
      )}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
            !isSelected && !done && 'border-border-strong bg-surface-base',
            !isSelected && done && !isAnswer && 'border-border-subtle bg-surface-base',
            !isSelected && done && isAnswer && 'border-success bg-surface-base',
            isSelected && !done && 'border-primary bg-surface-base',
            done && isAnswer && 'border-success bg-surface-base',
            done && isSelected && !isAnswer && 'border-error bg-surface-base',
          )}
          aria-hidden
        >
          {isSelected && (
            <div
              className={cn(
                'size-2.5 rounded-full transition-transform duration-150',
                !done && 'bg-primary',
                done && isAnswer && 'bg-success shadow-xs scale-110',
                done && !isAnswer && 'bg-error shadow-xs',
              )}
            />
          )}
        </div>

        <span className="text-body-lg font-medium">{option}</span>
        {done && isAnswer && <span className="sr-only"> (respuesta correcta)</span>}
        {done && isSelected && !isAnswer && <span className="sr-only"> (respuesta incorrecta)</span>}
      </div>

      {done && (
        <div className="shrink-0" aria-hidden="true">
          {isAnswer ? (
            <Check size={20} className="text-success" />
          ) : isSelected ? (
            <X size={20} className="text-error" />
          ) : null}
        </div>
      )}
    </button>
  )
}

function HintPanel({
  hint,
  level,
  maxLevel,
}: {
  hint: string
  level?: number
  maxLevel?: number
}) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl bg-surface-sunken/80 border border-border-subtle p-4 text-left shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning border border-warning/20 mt-0.5">
        <Lightbulb size={18} aria-hidden />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        {level && maxLevel && maxLevel > 1 ? (
          <span className="font-mono text-tiny uppercase tracking-wider font-semibold text-fg-muted">
            Pista {level} de {maxLevel}
          </span>
        ) : null}
        <p className="text-body-sm text-fg leading-relaxed">{hint}</p>
      </div>
    </div>
  )
}
