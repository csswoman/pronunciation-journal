'use client'

// Planned structure:
// <ExerciseShell>
//   <ShellHeader />    — title (Fraunces) + hint button slot (right)
//   <HintChip />       — word + meaning, always visible when provided
//   [children]         — exercise mechanics
//   <ContinueButton /> — full-width primary, shown after answer
//   <SkipButton />     — small text link below, shown before answer

import { useEffect } from 'react'
import type React from 'react'
import { cn } from '@/lib/cn'
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
    if (!result?.isCorrect && hasDetailedFeedback) return
    if (hasDetailedFeedback) return
    const timer = setTimeout(onContinue, 900)
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Enter') { clearTimeout(timer); onContinue() }
    }
    window.addEventListener('keydown', handleKey)
    return () => { clearTimeout(timer); window.removeEventListener('keydown', handleKey) }
  }, [done, hasDetailedFeedback, onContinue, result?.isCorrect])

  return (
    <div className="flex w-full flex-col gap-5">
      <ShellHeader title={title} eyebrow={eyebrow} description={description} hintSlot={hintSlot} />
      {hint && <HintChip word={hint.word} meaning={hint.meaning} />}
      {children}
      {done && <FeedbackBanner result={result} />}
      {done && (
        <div className="flex flex-col gap-2">
          {result.feedback?.canRetry && onRetry && (
            <RetryButton onRetry={onRetry} />
          )}
          <ContinueButton onContinue={onContinue} />
        </div>
      )}
      {!done && <SkipButton onSkip={onSkip} />}
    </div>
  )
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
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-accent">
            {eyebrow}
          </span>
        )}
        <p className="font-[Fraunces,Georgia,serif] text-2xl font-bold leading-tight text-fg">
          {title}
        </p>
        {description && (
          <p className="text-[13px] text-fg-muted leading-snug">
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
      className="w-full text-center text-[12px] uppercase tracking-widest font-semibold text-fg-subtle transition-opacity hover:opacity-70 cursor-pointer py-1"
    >
      Skip this one
    </button>
  )
}

function HintChip({ word, meaning }: { word: string; meaning?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-surface-raised px-3 py-2 text-[13px]">
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
  const status = feedback?.immediate ?? (isCorrect ? 'Well done!' : 'Not quite. Keep going.')
  const expected = feedback?.correction ?? feedback?.expectedAnswer
  return (
    <div className={cn(
      'flex flex-col gap-2 rounded-md border px-4 py-3.5 text-[13px]',
      isCorrect
        ? 'bg-success-soft border-success-border text-success'
        : 'bg-error-soft border-error-border text-error',
    )}>
      <p className="flex items-center gap-2.5 font-semibold">
        <span aria-hidden>{isCorrect ? '✓' : '✗'}</span>
        <span>{status}</span>
      </p>
      {feedback?.explanation && (
        <p className="leading-relaxed text-fg">{feedback.explanation}</p>
      )}
      {expected && (
        <p className="leading-relaxed text-fg">
          <span className="font-semibold">Expected: </span>
          <span>{expected}</span>
        </p>
      )}
      {feedback?.tip && (
        <p className="leading-relaxed text-fg-muted">
          <span className="font-semibold text-fg">Tip: </span>
          <span>{feedback.tip}</span>
        </p>
      )}
      {feedback?.example && feedback.example !== expected && (
        <p className="leading-relaxed text-fg-muted">
          <span className="font-semibold text-fg">Example: </span>
          <span>{feedback.example}</span>
        </p>
      )}
    </div>
  )
}

function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <button
      type="button"
      onClick={onRetry}
      className={cn(
        'w-full rounded-[var(--radius-full)] border border-border-default py-3.5 text-[15px] font-semibold',
        'bg-surface-raised text-fg transition-all hover:bg-surface-sunken cursor-pointer',
      )}
    >
      Try again
    </button>
  )
}

function ContinueButton({ onContinue }: { onContinue: () => void }) {
  return (
    <button
      type="button"
      onClick={onContinue}
      className={cn(
        'w-full rounded-[var(--radius-full)] py-3.5 text-[15px] font-semibold',
        'bg-(--cta-bg) text-(--cta-fg) shadow-sm transition-all hover:opacity-90 cursor-pointer',
      )}
    >
      Continue
    </button>
  )
}
