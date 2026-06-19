'use client'

// Planned structure:
// <ProductionFeedback />
//   <StatusBanner />     — correct / partial / incorrect
//   <CriteriaChips />    — usedTarget + grammar
//   <FeedbackText />     — AI feedback
//   <CorrectionBlock />  — optional corrected sentence

import { cn } from '@/lib/cn'
import type { ProductionGradeResult } from '@/lib/exercises/production-grade'

interface Props {
  grade: ProductionGradeResult
  transcript?: string
}

export function ProductionFeedback({ grade, transcript }: Props) {
  return (
    <div className="flex w-full flex-col gap-3">
      <StatusBanner correct={grade.correct} score={grade.score} />
      <CriteriaChips usedTarget={grade.usedTarget} grammaticallyCorrect={grade.grammaticallyCorrect} />
      {transcript && (
        <p className="m-0 text-sm text-fg-muted italic">
          You said: &ldquo;{transcript}&rdquo;
        </p>
      )}
      <p className="m-0 text-sm leading-relaxed text-fg">{grade.feedback}</p>
      {grade.corrections && (
        <div className="rounded-[var(--radius-md)] border border-border-default bg-surface-raised px-3 py-2.5">
          <p className="m-0 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
            Suggested version
          </p>
          <p className="m-0 mt-1 text-sm text-fg">{grade.corrections}</p>
        </div>
      )}
    </div>
  )
}

function StatusBanner({ correct, score }: { correct: boolean; score: number }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-md border px-4 py-3 text-[13px] font-semibold',
        correct
          ? 'border-success-border bg-success-soft text-success'
          : 'border-warning-border bg-warning-soft text-warning',
      )}
    >
      <span>{correct ? '✓' : '○'}</span>
      <span>{correct ? 'Great production!' : 'Keep practicing — review the feedback.'}</span>
      <span className="ml-auto text-xs opacity-80">{score}/100</span>
    </div>
  )
}

function CriteriaChips({
  usedTarget,
  grammaticallyCorrect,
}: {
  usedTarget: boolean
  grammaticallyCorrect: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <CriterionChip label="Target word" ok={usedTarget} />
      <CriterionChip label="Grammar" ok={grammaticallyCorrect} />
    </div>
  )
}

function CriterionChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-xs font-medium',
        ok ? 'bg-success-soft text-success' : 'bg-error-soft text-error',
      )}
    >
      {ok ? '✓' : '✗'} {label}
    </span>
  )
}
