'use client'

// Planned structure:
// <ProductionFeedback />
//   <StatusBanner />     — correct / partial / incorrect
//   <CriteriaChips />    — usedTarget + grammar
//   <SentenceComparisonBlock /> — userSentence vs corrections with diff underline
//   <FeedbackText />     — AI feedback
// </ProductionFeedback>

import { useMemo } from 'react'
import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'
import { cn } from '@/lib/cn'
import type { ProductionGradeResult } from '@/lib/exercises/production-grade'

interface Props {
  grade: ProductionGradeResult
  transcript?: string
  userSentence?: string
}

export function ProductionFeedback({ grade, transcript, userSentence }: Props) {
  const needsTranscriptReview = !grade.usedTarget
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
        needsTranscriptReview={needsTranscriptReview}
      />

      {!needsTranscriptReview && (
        <CriteriaChips
          usedTarget={grade.usedTarget}
          grammaticallyCorrect={grade.grammaticallyCorrect}
          constraintMet={grade.constraintMet}
        />
      )}

      {needsTranscriptReview && transcript && (
        <div className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-warning-border/40 bg-warning-soft/30 p-3 sm:p-3.5">
          <span className="text-caption font-medium text-fg-muted">
            Entendimos:
          </span>
          <p className="m-0 text-body-md italic text-fg">
            &ldquo;{transcript}&rdquo;
          </p>
        </div>
      )}

      {!needsTranscriptReview && (originalText || grade.corrections) && (
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

      <p className="m-0 max-w-[70ch] text-body-sm leading-relaxed text-pretty text-fg">
        {grade.feedback}
      </p>
    </div>
  )
}

interface DiffToken {
  text: string
  type: 'equal' | 'delete' | 'insert'
}

function diffWords(original: string, modified: string): { originalDiff: DiffToken[]; modifiedDiff: DiffToken[] } {
  const origWords = original.trim().split(/\s+/).filter(Boolean)
  const modWords = modified.trim().split(/\s+/).filter(Boolean)
  const m = origWords.length
  const n = modWords.length

  if (m === 0) {
    return {
      originalDiff: [],
      modifiedDiff: modWords.map((text) => ({ text, type: 'insert' })),
    }
  }

  if (n === 0) {
    return {
      originalDiff: origWords.map((text) => ({ text, type: 'delete' })),
      modifiedDiff: [],
    }
  }

  const clean = (w: string) => w.toLowerCase().replace(/[^\w']/g, '')

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (clean(origWords[i]) === clean(modWords[j])) {
        dp[i + 1][j + 1] = dp[i][j] + 1
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
  }

  let i = m
  let j = n
  const origTokens: DiffToken[] = []
  const modTokens: DiffToken[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && clean(origWords[i - 1]) === clean(modWords[j - 1])) {
      origTokens.unshift({ text: origWords[i - 1], type: 'equal' })
      modTokens.unshift({ text: modWords[j - 1], type: 'equal' })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      modTokens.unshift({ text: modWords[j - 1], type: 'insert' })
      j--
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      origTokens.unshift({ text: origWords[i - 1], type: 'delete' })
      i--
    }
  }

  return { originalDiff: origTokens, modifiedDiff: modTokens }
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
  needsTranscriptReview,
}: {
  correct: boolean
  score: number
  needsTranscriptReview: boolean
}) {
  if (needsTranscriptReview) {
    return (
      <div className="flex flex-col gap-0.5 rounded-[var(--radius-md)] border border-warning-border bg-warning-soft px-4 py-3 text-warning">
        <p className="m-0 flex items-center gap-2.5 text-body-sm font-semibold">
          <span aria-hidden>○</span>
          <span>No pudimos verificar la palabra objetivo.</span>
        </p>
        <p className="m-0 pl-6 text-caption font-medium opacity-80">
          Revisa lo que entendimos y vuelve a intentarlo si no coincide con lo que dijiste.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 rounded-[var(--radius-md)] border px-4 py-3',
        correct
          ? 'border-success-border bg-success-soft text-success'
          : 'border-warning-border bg-warning-soft text-warning',
      )}
    >
      <p className="m-0 flex items-center gap-2.5 text-body-sm font-semibold">
        <span aria-hidden>{correct ? '✓' : '○'}</span>
        <span>{correct ? '¡Buen trabajo!' : 'Sigue practicando — revisa el feedback.'}</span>
      </p>
      <p className="m-0 pl-6 text-caption font-medium opacity-70">
        Puntuación {score} de 100
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
      <CriterionChip label="Palabra objetivo" ok={usedTarget} />
      <CriterionChip label="Gramática" ok={grammaticallyCorrect} />
      {constraintMet !== undefined && (
        <CriterionChip label="Restricción requerida" ok={constraintMet} />
      )}
    </div>
  )
}

function CriterionChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-8 items-center rounded-full px-2.5 py-1 text-caption font-medium',
        ok ? 'bg-success-soft text-success' : 'bg-error-soft text-error',
      )}
    >
      <span aria-hidden>{ok ? '✓' : '✗'}</span>
      <span className="ml-1">{label}</span>
      <span className="sr-only">{ok ? ': correcto' : ': incorrecto'}</span>
    </span>
  )
}
