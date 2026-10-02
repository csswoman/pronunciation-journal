'use client'

// Planned structure:
// <FillBlankExercise>
//   <ListenButton />     — optional audio prompt
//   <SentenceBox />      — sky-pastel sentence container with white blank pill
//   <OptionGrid />       — list of option buttons with index badges
//   <HintPanel />        — progressive hint box
// </FillBlankExercise>

import { useState, useRef, useEffect } from 'react'
import { Lightbulb, Check, X } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { FillBlankExercise as FillBlankExerciseType } from '@/lib/exercises/types'
import { buildPedagogicalFeedback } from '@/lib/exercises/feedback'
import { useUISounds } from '@/hooks/useUISounds'
import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'

interface Props {
  exercise: FillBlankExerciseType
  onResult: (
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: { feedback?: ReturnType<typeof buildPedagogicalFeedback> },
  ) => void
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
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      if (!/^[1-9]$/.test(e.key)) return
      const idx = parseInt(e.key, 10) - 1
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
    ? hintLevel === 1
      ? exercise.hints.level1
      : hintLevel === 2
        ? exercise.hints.level2
        : hintLevel === 3
          ? exercise.hints.level3
          : null
    : hintLevel > 0
      ? (exercise.hint ?? null)
      : null

  const maxHintLevel = exercise.hints
    ? exercise.hints.level3
      ? 3
      : 2
    : exercise.hint
      ? 1
      : 0

  return (
    <div className="flex w-full flex-col gap-6">
      {exercise.audioText && (
        <ListenButton
          onPlay={() => speak(exercise.audioText!)}
          label="Escuchar la oración"
          aria-label="Escuchar la oración completa antes de completar"
        />
      )}

      <SentenceBox parts={parts} answer={exercise.answer} selected={selected} answerState={state} />

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

function SentenceBox({
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
  const charCount = Math.max(3, (selected || answer).length)

  return (
    <div className="rounded-2xl border border-sky-deep/30 bg-sky p-8 sm:p-10 text-center shadow-2xs">
      <p className="font-display text-2xl font-bold leading-relaxed text-ink sm:text-3xl flex items-center justify-center flex-wrap gap-2.5 sm:gap-3">
        <span>{parts[0].trimEnd()}</span>
        <span
          className={cn(
            'inline-flex items-center justify-center px-4 py-1.5 rounded-2xl font-display font-bold text-2xl sm:text-3xl transition-all duration-200 align-baseline select-none',
            selected !== null && !done && 'bg-paper text-ink border-b-4 border-ink dark:bg-paper dark:text-ink',
            selected === null && !done && 'border-2 border-dashed border-ink/30 bg-paper/70 text-ink-muted/40 font-mono text-xl',
            done && isCorrect && 'bg-mint text-ink border border-mint-deep/60',
            done && !isCorrect && 'bg-coral text-ink border border-coral-deep/60',
          )}
          style={{ minWidth: `max(4.5rem, calc(${charCount * 0.75}em + 1.5rem))` }}
        >
          {selected !== null ? (
            <span className="animate-in fade-in zoom-in-95 duration-150" aria-live="polite">
              {selected}
            </span>
          ) : (
            <span className="font-mono text-lg opacity-40" aria-hidden>
              ___
            </span>
          )}
        </span>
        <span>{parts.slice(1).join('___').trimStart()}</span>
      </p>
    </div>
  )
}

function OptionGrid({
  options,
  answer,
  selected,
  answerState,
  onPick,
}: {
  options: string[]
  answer: string
  selected: string | null
  answerState: AnswerState
  onPick: (option: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((option, index) => (
        <OptionButton
          key={option}
          option={option}
          index={index}
          isAnswer={option === answer}
          isSelected={option === selected}
          answerState={answerState}
          onPick={onPick}
        />
      ))}
    </div>
  )
}

function OptionButton({
  option,
  index,
  isAnswer,
  isSelected,
  answerState,
  onPick,
}: {
  option: string
  index: number
  isAnswer: boolean
  isSelected: boolean
  answerState: AnswerState
  onPick: (option: string) => void
}) {
  const done = answerState !== 'idle'

  return (
    <button
      type="button"
      onClick={() => onPick(option)}
      disabled={done}
      aria-label={option}
      className={cn(
        'group flex w-full min-h-[52px] items-center justify-between rounded-full border-2 px-4 py-3 text-left transition-all duration-150 select-none focus-ring cursor-pointer',
        !done && !isSelected && 'border-transparent bg-[color-mix(in_oklch,var(--text)_7%,var(--surface-raised))] text-fg hover:bg-[color-mix(in_oklch,var(--text)_11%,var(--surface-raised))]',
        !done && isSelected && 'border-primary bg-surface-base text-fg font-semibold dark:bg-surface-raised',
        done && isAnswer && 'border-2 border-success-border bg-success-soft text-success font-semibold cursor-default dark:bg-mint/20 dark:border-mint',
        done && isSelected && !isAnswer && 'border-2 border-error-border bg-error-soft text-error font-semibold cursor-default dark:bg-coral/20 dark:border-coral',
        done && !isAnswer && !isSelected && 'border-border-subtle bg-surface-sunken/30 text-fg-subtle opacity-40 cursor-default',
      )}
    >
      <div className="flex items-center gap-3.5">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-body-sm font-semibold transition-colors',
            !isSelected && !done && 'border border-border-strong bg-surface-base text-fg-muted dark:bg-surface-raised',
            !isSelected && done && !isAnswer && 'border border-border-subtle bg-surface-sunken text-fg-faint',
            isSelected && !done && 'bg-primary text-on-accent font-bold shadow-xs',
            done && isAnswer && 'bg-feedback-correct text-on-accent font-bold shadow-xs',
            done && isSelected && !isAnswer && 'bg-feedback-wrong text-on-accent font-bold shadow-xs',
          )}
          aria-hidden
        >
          {index + 1}
        </span>
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

function HintPanel({ hint, level, maxLevel }: { hint: string; level?: number; maxLevel?: number }) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl bg-surface-sunken/80 border border-border-subtle p-4 text-left shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning border border-warning/20 mt-0.5">
        <Lightbulb size={18} aria-hidden />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        {level && maxLevel && maxLevel > 1 && (
          <span className="font-mono text-tiny uppercase tracking-wider font-semibold text-fg-muted">
            Pista {level} de {maxLevel}
          </span>
        )}
        <p className="text-body-sm text-fg leading-relaxed">{hint}</p>
      </div>
    </div>
  )
}
