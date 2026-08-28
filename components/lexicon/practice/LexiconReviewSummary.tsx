'use client'

// Planned structure:
// <LexiconReviewSummary>
//   <SummaryHeader />   — completion title & count
//   <StatGrid />         — 3 breakdown boxes (forgot, normal, known)
//   <ActionButtons />    — primary action to start practice exercises or finish
// </LexiconReviewSummary>

import Button from '@/components/ui/Button'
import type { WordRating } from '@/lib/word-bank/lexicon-review-types'

interface LexiconReviewSummaryProps {
  ratings: WordRating[]
  onStartExercises: () => void
  onFinish: () => void
}

export function LexiconReviewSummary({
  ratings,
  onStartExercises,
  onFinish,
}: LexiconReviewSummaryProps) {
  const forgot = ratings.filter((r) => r.rating === 'forgot').length
  const normal = ratings.filter((r) => r.rating === 'normal').length
  const known = ratings.filter((r) => r.rating === 'known').length

  const hasExercises = forgot > 0

  return (
    <div className="flex w-full max-w-2xl mx-auto flex-col layout-stack-loose rounded-2xl border border-border-subtle bg-surface-raised p-8 shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-kicker text-fg-subtle">
          Repaso completado
        </p>
        <h3 className="text-h2 font-bold text-fg">
          {ratings.length} {ratings.length === 1 ? 'palabra revisada' : 'palabras revisadas'}
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-error/30 bg-error-soft/40 p-3">
          <span className="text-h3 font-bold text-error tabular-nums">{forgot}</span>
          <span className="text-caption font-medium text-error text-center leading-tight">Otra vez</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface-sunken p-3">
          <span className="text-h3 font-bold text-fg tabular-nums">{normal}</span>
          <span className="text-caption font-medium text-fg-muted text-center leading-tight">Me costó</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-primary/30 bg-primary-soft/40 p-3">
          <span className="text-h3 font-bold text-primary tabular-nums">{known}</span>
          <span className="text-caption font-medium text-primary text-center leading-tight">La domino</span>
        </div>
      </div>

      {hasExercises ? (
        <div className="flex flex-col gap-3">
          <p className="text-center text-body-sm text-fg-muted">
            {forgot === 1 ? '1 palabra requiere' : `${forgot} palabras requieren`} ejercicios de práctica.
          </p>
          <Button
            type="button"
            onClick={onStartExercises}
            variant="primary"
            className="w-full justify-center"
          >
            Empezar ejercicios de práctica
          </Button>
          <Button
            type="button"
            onClick={onFinish}
            variant="secondary"
            className="w-full justify-center"
          >
            Finalizar repaso
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-center text-body-sm text-fg-muted">
            ¡Excelente trabajo! No hay palabras pendientes de práctica por ahora.
          </p>
          <Button
            type="button"
            onClick={onFinish}
            variant="primary"
            className="w-full justify-center"
          >
            Finalizar repaso
          </Button>
        </div>
      )}
    </div>
  )
}
