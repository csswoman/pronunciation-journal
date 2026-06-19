'use client'

// Planned structure:
// <ExerciseShell>
//   <ShellHeader />    — title (Fraunces) + hint button slot (right)
//   <HintChip />       — word + meaning, always visible when provided
//   [children]         — exercise mechanics
//   <ContinueButton /> — full-width primary, shown after answer
//   <SkipButton />     — small text link below, shown before answer

import { useEffect, type ReactNode } from 'react'
import type React from 'react'
import { cn } from '@/lib/cn'

export interface ExerciseResult {
  isCorrect: boolean
  userAnswer: string
  timeMs: number
  score?: number
}

interface HintShape {
  word: string
  meaning?: string
}

interface ExerciseShellProps {
  title: string
  hint?: HintShape
  result: ExerciseResult | null
  onContinue: () => void
  onSkip: () => void
  children: React.ReactNode
  hintSlot?: React.ReactNode
}

export function ExerciseShell({
  title,
  hint,
  result,
  onContinue,
  onSkip,
  children,
  hintSlot,
}: ExerciseShellProps) {
  const done = result !== null

  useEffect(() => {
    if (!done) return
    const timer = setTimeout(onContinue, 900)
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Enter') { clearTimeout(timer); onContinue() }
    }
    window.addEventListener('keydown', handleKey)
    return () => { clearTimeout(timer); window.removeEventListener('keydown', handleKey) }
  }, [done, onContinue])

  return (
    <div className="flex w-full flex-col gap-5">
      <ShellHeader title={title} hintSlot={hintSlot} />
      {hint && <HintChip word={hint.word} meaning={hint.meaning} />}
      {children}
      {done && <FeedbackBanner isCorrect={result.isCorrect} />}
      {done && <ContinueButton onContinue={onContinue} />}
      {!done && <SkipButton onSkip={onSkip} />}
    </div>
  )
}

function ShellHeader({ title, hintSlot }: { title: string; hintSlot?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="font-[Fraunces,Georgia,serif] text-2xl font-bold leading-tight text-fg">
        {title}
      </p>
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

function FeedbackBanner({ isCorrect }: { isCorrect: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 rounded-md border px-4 py-3.5 text-[13px] font-semibold',
      isCorrect
        ? 'bg-success-soft border-success-border text-success'
        : 'bg-error-soft border-error-border text-error',
    )}>
      <span>{isCorrect ? '✓' : '✗'}</span>
      <span>{isCorrect ? 'Well done!' : 'Not quite — keep going!'}</span>
    </div>
  )
}

function ContinueButton({ onContinue }: { onContinue: () => void }) {
  return (
    <button
      type="button"
      onClick={onContinue}
      className={cn(
        'w-full rounded-[var(--radius-full)] py-3.5 text-[15px] font-semibold',
        'bg-primary text-white shadow-sm transition-all hover:bg-primary/90 cursor-pointer',
      )}
    >
      Continue
    </button>
  )
}
