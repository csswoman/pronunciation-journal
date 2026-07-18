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
          Dijiste: &ldquo;{transcript}&rdquo;
        </p>
      )}
      <p className="m-0 max-w-[70ch] text-sm leading-relaxed text-pretty text-fg">
        {grade.feedback}
      </p>
      {grade.corrections && (
        <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-3 py-2.5">
          <p className="m-0 text-caption text-fg-muted">
            Versión sugerida
          </p>
          <p className="m-0 mt-1 text-sm text-fg text-pretty">{grade.corrections}</p>
        </div>
      )}
    </div>
  )
}

function StatusBanner({ correct, score }: { correct: boolean; score: number }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 rounded-[var(--radius-md)] border px-4 py-3',
        correct
          ? 'border-success-border bg-success-soft text-success'
          : 'border-warning-border bg-warning-soft text-warning',
      )}
    >
      <p className="m-0 flex items-center gap-2.5 text-sm font-semibold">
        <span aria-hidden>{correct ? '✓' : '○'}</span>
        <span>{correct ? '¡Buen trabajo!' : 'Sigue practicando — revisa el feedback.'}</span>
      </p>
      <p className="m-0 pl-6 text-xs font-medium opacity-70">
        Puntuación {score} de 100
      </p>
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
    <div className="flex flex-wrap gap-2" aria-label="Criterios de evaluación">
      <CriterionChip label="Palabra objetivo" ok={usedTarget} />
      <CriterionChip label="Gramática" ok={grammaticallyCorrect} />
    </div>
  )
}

function CriterionChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-8 items-center rounded-full px-2.5 py-1 text-xs font-medium',
        ok ? 'bg-success-soft text-success' : 'bg-error-soft text-error',
      )}
    >
      <span aria-hidden>{ok ? '✓' : '✗'}</span>
      <span className="ml-1">{label}</span>
      <span className="sr-only">{ok ? ': correcto' : ': incorrecto'}</span>
    </span>
  )
}
