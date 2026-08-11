'use client'

import Link from 'next/link'
import Button from '@/components/ui/Button'

interface Props {
  soundIpa: string
  scoreableCorrect: number
  originalTotal: number
  nextReview: Date | null
  onPracticeAgain: () => void
}

function getResult(accuracy: number) {
  if (accuracy === 100) return { emoji: '🎉', title: '¡Perfecto!', subtitle: 'Acertaste todos los ejercicios.' }
  if (accuracy >= 80) return { emoji: '🌟', title: '¡Muy bien!', subtitle: 'Casi perfecto. Mantén ese ritmo.' }
  if (accuracy >= 50) return { emoji: '💪', title: 'Buen esfuerzo', subtitle: 'Practica un poco más para consolidarlo.' }
  return { emoji: '📚', title: 'Sigue practicando', subtitle: 'Este sonido necesita más atención.' }
}

export function SessionSummary({ soundIpa, scoreableCorrect, originalTotal, nextReview, onPracticeAgain }: Props) {
  const accuracy = originalTotal > 0 ? Math.round((scoreableCorrect / originalTotal) * 100) : 0
  const { emoji, title, subtitle } = getResult(accuracy)

  const accuracyClass =
    accuracy >= 80 ? 'text-[var(--success)]' :
    accuracy >= 50 ? 'text-[var(--warning)]' :
    'text-[var(--error)]'

  const nextReviewLabel = nextReview
    ? new Intl.DateTimeFormat('es-PE', { weekday: 'long', month: 'short', day: 'numeric' }).format(nextReview)
    : null

  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col gap-3">

      {/* Main card */}
      <div className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-2xl)] layout-card-pad pt-[var(--layout-section-gap)] flex flex-col items-center gap-3 text-center">

        {/* IPA */}
        <div className="font-ipa text-display-ipa font-bold text-primary">
          {soundIpa}
        </div>

        {/* Emoji + title + subtitle */}
        <div className="mt-1 text-h1 leading-none">{emoji}</div>
        <div className="text-h3 text-balance text-fg">
          {title}
        </div>
        <p className="m-0 text-caption text-fg-muted">
          {subtitle}
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-[var(--border-subtle)] my-2" />

        {/* Accuracy % */}
        <div className={`text-h1 font-bold tabular-nums ${accuracyClass}`}>
          {accuracy}%
        </div>
        <p className="text-body-sm text-[var(--text-tertiary)] m-0">
          {scoreableCorrect} de {originalTotal} correctos
        </p>

        {/* Next review chip */}
        {nextReviewLabel && (
          <div className="mt-1 py-3 px-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-caption text-[var(--text-secondary)]">
            Próximo repaso: <strong className="text-[var(--text-primary)]">{nextReviewLabel}</strong>
          </div>
        )}
      </div>

      {/* Buttons */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={onPracticeAgain}
      >
        Practicar de nuevo
      </Button>

      <Link
        href="/practice/sounds"
        className="flex h-12 w-full items-center justify-center rounded-md border border-border-default bg-surface-raised px-6 text-body-sm font-semibold text-fg no-underline transition-colors hover:bg-surface-sunken focus-ring"
      >
        Volver a práctica
      </Link>
    </div>
  )
}
