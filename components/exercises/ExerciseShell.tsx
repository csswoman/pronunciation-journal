'use client'

// Planned structure:
// <ExerciseShell>
//   <ShellHeader />    — eyebrow title (left) + Skip button (right, idle only)
//   <HintChip />       — word + meaning, always visible when provided
//   [children]         — exercise mechanics
//   <ContinueButton /> — full-width primary, shown after answer

import { cn } from '@/lib/cn'

export interface ExerciseResult {
  isCorrect: boolean
  userAnswer: string
  timeMs: number
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
}

export function ExerciseShell({
  title,
  hint,
  result,
  onContinue,
  onSkip,
  children,
}: ExerciseShellProps) {
  const done = result !== null

  return (
    <div className="flex w-full flex-col gap-5">
      <ShellHeader title={title} done={done} onSkip={onSkip} />
      {hint && <HintChip word={hint.word} meaning={hint.meaning} />}
      {children}
      {done && <ContinueButton onContinue={onContinue} />}
    </div>
  )
}

function ShellHeader({
  title,
  done,
  onSkip,
}: {
  title: string
  done: boolean
  onSkip: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-fg-muted">
        {title}
      </p>
      {!done && (
        <button
          type="button"
          onClick={onSkip}
          className="text-[12px] font-medium text-fg-subtle transition-opacity hover:opacity-70 cursor-pointer"
        >
          Skip
        </button>
      )}
    </div>
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
