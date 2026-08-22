'use client'

// Planned structure:
// <ExerciseShell>
//   <ShellHeader />    — title + hint button slot (right)
//   <HintChip />       — word + meaning, always visible when provided
//   [children]         — exercise mechanics
//   <ContinueButton /> — full-width primary, shown after answer
//   <SkipButton />     — small text link below, shown before answer

import { useEffect } from 'react'
import type React from 'react'
import { cn } from '@/lib/cn'
import Button from '@/components/ui/Button'
import {
  PracticeActionBar,
  PracticeContinueButton,
  PracticeExerciseCard,
} from '@/components/practice/session/PracticeActionBar'
import type { PedagogicalFeedback } from '@/lib/practice/types'

export interface ExerciseResult {
  isCorrect: boolean
  userAnswer: string
  timeMs: number
  score?: number
  feedback?: PedagogicalFeedback
}

interface HintShape {
  word: string
  meaning?: string
}

interface ExerciseShellProps {
  title: string
  /** Learner-facing label of what this exercise trains (e.g. "Presente simple"). */
  eyebrow?: string
  /** Short instructional subtitle shown below the title. */
  description?: string
  hint?: HintShape
  result: ExerciseResult | null
  onContinue: () => void
  onRetry?: () => void
  onSkip: () => void
  children: React.ReactNode
  hintSlot?: React.ReactNode
  surface?: 'flat' | 'raised'
  /** Optional timer to auto-advance in ms. Defaults to null so the user controls pace. */
  autoAdvanceMs?: number | null
}

export function ExerciseShell({
  title,
  eyebrow,
  description,
  hint,
  result,
  onContinue,
  onRetry,
  onSkip,
  children,
  hintSlot,
  surface = 'flat',
  autoAdvanceMs = null,
}: ExerciseShellProps) {
  const done = result !== null
  const hasDetailedFeedback = !!result?.feedback && Boolean(
    result.feedback.explanation ||
    result.feedback.tip ||
    result.feedback.example ||
    result.feedback.correction ||
    result.feedback.expectedAnswer,
  )

  useEffect(() => {
    if (!done) return
    let timer: ReturnType<typeof setTimeout> | undefined
    if (autoAdvanceMs && autoAdvanceMs > 0 && !hasDetailedFeedback) {
      timer = setTimeout(onContinue, autoAdvanceMs)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        if (timer) clearTimeout(timer)
        onContinue()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('keydown', handleKey)
    }
  }, [done, hasDetailedFeedback, onContinue, autoAdvanceMs])

  const content = (
    <>
      <ShellHeader title={title} eyebrow={eyebrow} description={description} hintSlot={hintSlot} />
      {hint && <HintChip word={hint.word} meaning={hint.meaning} />}
      {children}
      {done && <FeedbackBanner result={result} />}
      {done && (
        <PracticeActionBar>
          {result.feedback?.canRetry && onRetry && (
            <RetryButton onRetry={onRetry} />
          )}
          <ContinueButton onContinue={onContinue} />
        </PracticeActionBar>
      )}
      {!done && <SkipButton onSkip={onSkip} />}
    </>
  )

  if (surface === 'raised') {
    return <PracticeExerciseCard spacing="roomy" className="items-stretch">{content}</PracticeExerciseCard>
  }

  return <div className="layout-stack-loose w-full">{content}</div>
}

function ShellHeader({
  title,
  eyebrow,
  description,
  hintSlot,
}: {
  title: string
  eyebrow?: string
  description?: string
  hintSlot?: React.ReactNode
}) {
  return (
    <div className="flex w-full items-start justify-between gap-4">
      <div className="flex max-w-[65ch] flex-col gap-2">
        {eyebrow && (
          <span className="font-kicker text-accent">
            {eyebrow}
          </span>
        )}
        <p className="text-h3 text-balance text-fg">
          {title}
        </p>
        {description && (
          <p className="text-body-sm leading-relaxed text-pretty text-fg-muted">
            {description}
          </p>
        )}
      </div>
      {hintSlot && (
        <div className="flex items-center gap-2 pt-1 shrink-0">
          {hintSlot}
        </div>
      )}
    </div>
  )
}

function SkipButton({ onSkip }: { onSkip: () => void }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      className="min-h-11 w-full cursor-pointer rounded-md px-3 py-2 text-center text-body-sm font-medium text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring"
    >
      Omitir este ejercicio
    </button>
  )
}

function HintChip({ word, meaning }: { word: string; meaning?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-surface-sunken px-3 py-2 text-body-sm">
      <span className="font-semibold text-fg">{word}</span>
      {meaning && (
        <>
          <span className="text-fg-subtle">·</span>
          <span className="italic text-fg-muted">{meaning}</span>
        </>
      )}
    </div>
  )
}

function FeedbackBanner({ result }: { result: ExerciseResult }) {
  const { isCorrect, feedback } = result
  const status = feedback?.immediate ?? (isCorrect ? '¡Muy bien!' : 'Aún no. Sigue intentándolo.')
  const expected = feedback?.correction ?? feedback?.expectedAnswer
  return (
    <div className={cn( 'flex flex-col gap-3 rounded-md border px-4 py-4 text-body-sm', isCorrect ? 'bg-success-soft border-success-border text-success' : 'bg-error-soft border-error-border text-error', )}>
      <p className="flex items-center gap-2.5 font-semibold">
        <span aria-hidden>{isCorrect ? '✓' : '✗'}</span>
        <span>{status}</span>
      </p>
      {feedback?.explanation && (
        <p className="leading-relaxed text-fg">{feedback.explanation}</p>
      )}
      {expected && (
        <p className="leading-relaxed text-fg">
          <span className="font-semibold">Respuesta esperada: </span>
          <span>{expected}</span>
        </p>
      )}
      {feedback?.tip && (
        <p className="leading-relaxed text-fg-muted">
          <span className="font-semibold text-fg">Pista: </span>
          <span>{feedback.tip}</span>
        </p>
      )}
      {feedback?.example && feedback.example !== expected && (
        <p className="leading-relaxed text-fg-muted">
          <span className="font-semibold text-fg">Ejemplo: </span>
          <span>{feedback.example}</span>
        </p>
      )}
    </div>
  )
}

function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <Button type="button" variant="secondary" size="lg" fullWidth onClick={onRetry}>
      Intentar de nuevo
    </Button>
  )
}

function ContinueButton({ onContinue }: { onContinue: () => void }) {
  return (
    <PracticeContinueButton onClick={onContinue} />
  )
}
