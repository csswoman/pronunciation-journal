'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/cn'
import { PhonemeExercisePrompt } from '@/components/phoneme-practice/PhonemeExercisePrompt'
import { getPhonemeExerciseMeta } from '@/lib/phoneme-practice/exercise-labels'
import type { ReorderWordsExercise as ReorderWordsExerciseType } from '@/lib/exercises/types'

interface Props {
  exercise: ReorderWordsExerciseType
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
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

export function ReorderWordsExercise({ exercise, onSubmit, focusUi = false }: Props) {
  const [bank, setBank] = useState<Chip[]>(() => makeChips(exercise.tokens))
  const [answer, setAnswer] = useState<Chip[]>([])
  const [state, setState] = useState<AnswerState>('idle')
  const meta = getPhonemeExerciseMeta('reorder_words', {})

  useEffect(() => {
    setBank(makeChips(exercise.tokens))
    setAnswer([])
    setState('idle')
  }, [exercise.id, exercise.tokens])

  function moveToAnswer(chip: Chip) {
    if (state !== 'idle') return
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
    const isCorrect = userAnswer === exercise.sentence
    setState(isCorrect ? 'correct' : 'wrong')
    onSubmit(isCorrect, userAnswer)
  }

  const canCheck =
    state === 'idle' && answer.length === exercise.tokens.length && bank.length === 0

  if (focusUi) {
    return (
      <div className="phoneme-focus__exercise">
        <PhonemeExercisePrompt
          centered
          spacious
          eyebrow={meta.eyebrow}
          title="¿Cuál es el orden correcto?"
          hint="Toca las palabras en la franja de arriba"
        />

        <div
          className={cn('pf-order-answer', answer.length === 0 && 'pf-order-answer--empty')}
          aria-label="Tu frase"
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

        <div className="pf-order-tray" aria-label="Palabras disponibles">
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
            Comprobar
          </button>
        )}

        {state !== 'idle' && (
          <p className="pf-answer-note">
            Orden correcto: <strong>{exercise.sentence}</strong>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <p className="text-center text-[13px] font-semibold uppercase tracking-[.08em] text-[var(--text-tertiary)] m-0">
        Arrange the words in the correct order
      </p>
      <div
        className={cn(
          'min-h-[52px] flex flex-wrap gap-2 rounded-xl border-[1.5px] border-dashed p-3 transition-colors',
          answer.length === 0 ? 'border-[var(--border-subtle)]' : 'border-[var(--primary)]',
        )}
        aria-label="Your answer"
      >
        {answer.map((chip) => (
          <WordChip key={chip.key} chip={chip} variant="placed" done={state !== 'idle'} onClick={moveToBank} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Available words">
        {bank.map((chip) => (
          <WordChip key={chip.key} chip={chip} variant="bank" done={state !== 'idle'} onClick={moveToAnswer} />
        ))}
      </div>
      {state === 'idle' && (
        <button
          type="button"
          onClick={handleCheck}
          disabled={answer.length === 0}
          className="w-full rounded-full py-3.5 text-sm font-semibold transition-all disabled:opacity-40"
          style={{
            backgroundColor: answer.length > 0 ? 'var(--primary)' : 'var(--border-subtle)',
            color: answer.length > 0 ? 'var(--on-primary)' : 'var(--text-tertiary)',
          }}
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
        !done &&
          variant === 'bank' &&
          'bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] cursor-pointer',
        !done &&
          variant === 'placed' &&
          'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] hover:border-[var(--error)] hover:bg-[var(--error-soft)] hover:text-[var(--error)] cursor-pointer',
        done &&
          'cursor-default opacity-80 border-[var(--border-subtle)] bg-[var(--surface-raised)] text-[var(--text-secondary)]',
      )}
    >
      {chip.word}
    </button>
  )
}

function FeedbackBar({ isCorrect, sentence }: { isCorrect: boolean; sentence: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm font-medium border"
      style={{
        backgroundColor: isCorrect ? 'var(--success-soft)' : 'var(--error-soft)',
        borderColor: isCorrect ? 'var(--success)' : 'var(--error)',
        color: isCorrect ? 'var(--success-value)' : 'var(--error-value)',
      }}
    >
      {isCorrect ? '✓ Correct!' : `✗ Correct order: "${sentence}"`}
    </div>
  )
}
