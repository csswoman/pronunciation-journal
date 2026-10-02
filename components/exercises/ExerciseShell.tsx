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
import { feedbackSeverity } from '@/lib/exercises/error-taxonomy'
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
          <span className="font-mono text-tiny tracking-wider text-fg-subtle uppercase font-semibold">
            {eyebrow}
          </span>
        )}
        {title && (
          <h2 className="font-display text-h3 font-bold text-balance text-fg leading-tight sm:text-h2">
            {title}
          </h2>
        )}
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
      className="self-center py-2 text-center text-body-sm font-medium text-fg-subtle transition-colors hover:text-fg focus-ring rounded-full px-4 cursor-pointer"
    >
      Omitir este ejercicio
    </button>
  )
}

function HintChip({ word, meaning }: { word: string; meaning?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-surface-sunken px-3.5 py-2 text-body-sm">
      <span className="font-display font-bold text-fg">{word}</span>
      {meaning && (
        <>
          <span className="text-fg-subtle">·</span>
          <span className="italic text-fg-muted">{meaning}</span>
        </>
      )}
    </div>
  )
}

const SEVERITY_STYLES = {
  correct: {
    box: 'border-mint-deep/60 bg-mint text-ink dark:bg-mint/25 dark:border-mint/50 dark:text-fg',
    title: 'text-ink dark:text-fg',
    iconBg: 'bg-ink text-paper dark:bg-paper dark:text-ink',
    icon: '✓',
  },
  partial: {
    box: 'border-butter-deep/60 bg-butter text-ink dark:bg-butter/25 dark:border-butter/50 dark:text-fg',
    title: 'text-ink dark:text-fg',
    iconBg: 'bg-ink text-paper dark:bg-paper dark:text-ink',
    icon: '!',
  },
  error: {
    box: 'border-coral-deep/60 bg-coral text-ink dark:bg-coral/25 dark:border-coral/50 dark:text-fg',
    title: 'text-ink dark:text-fg',
    iconBg: 'bg-ink text-paper dark:bg-paper dark:text-ink',
    icon: '✕',
  },
} as const

function FeedbackBanner({ result }: { result: ExerciseResult }) {
  const { isCorrect, feedback } = result
  const status = feedback?.immediate ?? (isCorrect ? '¡Correcto!' : 'No es correcto')
  const expected = feedback?.correction ?? feedback?.expectedAnswer
  const isIpa = expected ? expected.includes('/') : false
  const severity = feedbackSeverity(isCorrect, feedback?.errorCode)
  const styles = SEVERITY_STYLES[severity]

  return (
    <div
      className={cn(
        'flex flex-col gap-3.5 rounded-2xl border p-5 text-body-sm shadow-xs transition-all animate-in fade-in slide-in-from-bottom-2 duration-200',
        styles.box,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-xs',
            styles.iconBg,
          )}
          aria-hidden
        >
          {styles.icon}
        </span>
        <h3 className={cn('font-display text-lg font-bold leading-tight', styles.title)}>
          {status}
        </h3>
      </div>

      {!isCorrect && expected && (
        <p className="leading-relaxed">
          <span className="font-semibold">Respuesta esperada: </span>
          <span className={cn('font-bold', isIpa && 'font-ipa font-medium')}>{expected}</span>
        </p>
      )}
      {feedback?.explanation && (
        <p className="leading-relaxed opacity-90">{feedback.explanation}</p>
      )}
      {!isCorrect && feedback?.example && feedback.example !== expected && (
        <p className="leading-relaxed opacity-80">
          <span className="font-semibold">Ejemplo: </span>
          <span>{feedback.example}</span>
        </p>
      )}
      {!isCorrect && feedback?.tip && (
        <p className="leading-relaxed opacity-80">
          <span className="font-semibold">Pista: </span>
          <span>{feedback.tip}</span>
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
