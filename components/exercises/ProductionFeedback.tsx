'use client'

// Planned structure:
// <ProductionFeedback>
//   <StatusBanner />              — Result title, descriptive subtitle, and score
//   <CriteriaChips />             — Evaluation criteria breakdown
//   <SentenceComparisonBlock />   — Original vs suggested sentence with audio
//   <TeacherObservationBlock />   — AI pedagogical explanation
// </ProductionFeedback>

import { useMemo } from 'react'
import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'
import { diffWords, type DiffToken } from '@/lib/exercises/diff-words'
import { cn } from '@/lib/cn'
import type { ProductionGradeResult } from '@/lib/exercises/production-grade'

interface Props {
  grade: ProductionGradeResult
  transcript?: string
  userSentence?: string
}

export function ProductionFeedback({ grade, transcript, userSentence }: Props) {
  const originalText = (userSentence ?? transcript)?.trim()

  const diff = useMemo(() => {
    if (!originalText || !grade.corrections || grade.correct) return null
    return diffWords(originalText, grade.corrections)
  }, [originalText, grade.corrections, grade.correct])

  return (
    <div className="flex w-full flex-col gap-3.5">
      <StatusBanner
        correct={grade.correct}
        score={grade.score}
        usedTarget={grade.usedTarget}
        grammaticallyCorrect={grade.grammaticallyCorrect}
        constraintMet={grade.constraintMet}
      />

      <CriteriaChips
        usedTarget={grade.usedTarget}
        grammaticallyCorrect={grade.grammaticallyCorrect}
        constraintMet={grade.constraintMet}
      />

      {(originalText || grade.corrections) && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-3.5 sm:p-4">
          {originalText && (
            <div className="flex flex-col gap-1">
              <span className="text-caption font-medium text-fg-muted">
                {transcript && !userSentence ? 'Lo que dijiste' : 'Tu oración'}
              </span>
              <p className="m-0 text-body-md leading-relaxed text-fg text-pretty">
                {diff ? (
                  <HighlightedSentence tokens={diff.originalDiff} type="original" />
                ) : (
                  <span>{originalText}</span>
                )}
              </p>
            </div>
          )}

          {grade.corrections && (
            <div className={cn('flex flex-col gap-1', originalText && 'border-t border-border-subtle pt-2.5')}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-caption font-semibold text-success">
                  Versión sugerida
                </span>
                <ListenButton
                  iconOnly
                  onPlay={() => speak(grade.corrections!)}
                  aria-label="Escuchar versión sugerida"
                />
              </div>
              <p className="m-0 text-body-md leading-relaxed text-fg text-pretty">
                {diff ? (
                  <HighlightedSentence tokens={diff.modifiedDiff} type="corrected" />
                ) : (
                  <span>{grade.corrections}</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {grade.feedback && (
        <div className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised/80 p-3.5 sm:p-4">
          <span className="text-caption font-semibold text-fg-secondary">
            Observaciones del tutor
          </span>
          <p className="m-0 max-w-[70ch] text-body-sm leading-relaxed text-pretty text-fg">
            {grade.feedback}
          </p>
        </div>
      )}
    </div>
  )
}

function HighlightedSentence({
  tokens,
  type,
}: {
  tokens: DiffToken[]
  type: 'original' | 'corrected'
}) {
  return (
    <span className="inline-block">
      {tokens.map((token, index) => {
        const isDiff = token.type !== 'equal'
        if (!isDiff) {
          return <span key={index}>{token.text}{index < tokens.length - 1 ? ' ' : ''}</span>
        }
        if (type === 'original') {
          return (
            <span key={index}>
              <span className="rounded-xs bg-error-soft/70 px-1 py-0.5 font-medium text-error underline decoration-error decoration-2 underline-offset-4">
                {token.text}
              </span>
              {index < tokens.length - 1 ? ' ' : ''}
            </span>
          )
        }
        return (
          <span key={index}>
            <span className="rounded-xs bg-success-soft px-1 py-0.5 font-semibold text-success">
              {token.text}
            </span>
            {index < tokens.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </span>
  )
}

function StatusBanner({
  correct,
  score,
  usedTarget,
  grammaticallyCorrect,
  constraintMet,
}: {
  correct: boolean
  score: number
  usedTarget: boolean
  grammaticallyCorrect: boolean
  constraintMet?: boolean
}) {
  let title = '¡Excelente oración!'
  let subtitle = 'Has usado la palabra objetivo con una estructura clara y correcta.'

  if (!correct) {
    if (!usedTarget) {
      title = 'Falta la palabra objetivo'
      subtitle = 'No detectamos la palabra requerida. Recuerda incluirla en tu oración.'
    } else if (!grammaticallyCorrect) {
      title = 'Buen intento — revisa la gramática'
      subtitle = 'Usaste la palabra clave, pero hay detalles por ajustar en la oración.'
    } else if (constraintMet === false) {
      title = 'Casi listo — revisa el requisito de la tarea'
      subtitle = 'Falta cumplir la instrucción solicitada para esta práctica.'
    } else {
      title = 'Buen intento — revisa las sugerencias'
      subtitle = 'Compara tu oración con la versión recomendada a continuación.'
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-[var(--radius-md)] border px-4 py-3.5',
        correct
          ? 'border-success-border bg-success-soft text-success'
          : 'border-warning-border bg-warning-soft text-warning',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 flex items-center gap-2 text-body-sm font-semibold">
          <span aria-hidden>{correct ? '✓' : '○'}</span>
          <span>{title}</span>
        </p>
        <span className="font-mono text-tiny font-medium opacity-80">
          {score} / 100
        </span>
      </div>
      <p className="m-0 pl-5 text-caption font-medium opacity-80">
        {subtitle}
      </p>
    </div>
  )
}

function CriteriaChips({
  usedTarget,
  grammaticallyCorrect,
  constraintMet,
}: {
  usedTarget: boolean
  grammaticallyCorrect: boolean
  constraintMet?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Criterios de evaluación">
      <CriterionChip
        label={usedTarget ? 'Palabra clave: usada' : 'Palabra clave: no detectada'}
        ok={usedTarget}
      />
      <CriterionChip
        label={grammaticallyCorrect ? 'Gramática: correcta' : 'Gramática: con ajustes'}
        ok={grammaticallyCorrect}
      />
      {constraintMet !== undefined && (
        <CriterionChip
          label={constraintMet ? 'Requisito: cumplido' : 'Requisito: no cumplido'}
          ok={constraintMet}
        />
      )}
    </div>
  )
}

function CriterionChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium',
        ok ? 'bg-success-soft text-success' : 'bg-error-soft text-error',
      )}
    >
      <span aria-hidden>{ok ? '✓' : '✗'}</span>
      <span>{label}</span>
      <span className="sr-only">{ok ? ': correcto' : ': necesita revisión'}</span>
    </span>
  )
}
