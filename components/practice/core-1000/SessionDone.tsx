'use client'

// Planned structure:
// <SessionDone>
//   <Headline />
//   <Stats />
//   <SessionActions />   — continuar · progreso · plan diario
// </SessionDone>

import Link from 'next/link'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import type { EssentialWordsSessionSummary, EssentialWordsStats } from '@/hooks/useEssentialWordsSession'

interface Props {
  stats: EssentialWordsStats
  sessionSummary?: EssentialWordsSessionSummary | null
  /** true cuando la cola estaba vacía desde el inicio */
  wasEmpty?: boolean
  onContinue?: () => void
  continueLoading?: boolean
  onLearnMore?: () => void
}

const linkActionClass = cn(
  'inline-flex w-full items-center justify-center rounded-md px-5 py-2.5',
  'text-sm font-semibold transition-all duration-150 ease-out-quart focus-ring',
)

export function SessionDone({
  stats,
  sessionSummary,
  wasEmpty,
  onContinue,
  continueLoading,
  onLearnMore,
}: Props) {
  const practiced = sessionSummary?.practiced ?? 0
  const accuracy =
    practiced > 0 ? Math.round(((sessionSummary?.correct ?? 0) / practiced) * 100) : null

  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="flex flex-col items-center gap-2">
        <h2 className="m-0 font-display text-h3 text-fg">
          {wasEmpty ? 'Nada pendiente por hoy' : 'Sesión completa'}
        </h2>
        {!wasEmpty && practiced > 0 ? (
          <p className="m-0 text-sm text-fg-muted">
            {practiced} {practiced === 1 ? 'palabra practicada' : 'palabras practicadas'}
            {accuracy !== null ? ` · ${accuracy}% precisión` : ''}
          </p>
        ) : null}
        <p className="m-0 text-sm text-fg-muted">
          {stats.learned} de {stats.totalWords} palabras en tu deck · {stats.newToday}/{stats.newQuota} nuevas hoy
        </p>
        {wasEmpty ? (
          <p className="m-0 text-xs text-fg-subtle">
            Vuelve mañana — el repaso espaciado hace el resto.
          </p>
        ) : (
          <p className="m-0 text-xs text-fg-subtle">
            Tu práctica ya cuenta en tu progreso.
          </p>
        )}
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2.5">
        {onLearnMore ? (
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            onClick={onLearnMore}
          >
            Aprender 10 nuevas más
          </Button>
        ) : null}
        {onContinue ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            isLoading={continueLoading}
            onClick={onContinue}
          >
            Continuar practicando
          </Button>
        ) : null}
        <Link
          href="/progress"
          className={cn(
            linkActionClass,
            'bg-surface-raised text-fg hover:bg-surface-sunken',
          )}
        >
          Ver mi progreso
        </Link>
        <Link
          href="/daily"
          className={cn(
            linkActionClass,
            'bg-transparent text-fg hover:bg-surface-sunken',
          )}
        >
          Ir al plan de hoy
        </Link>
      </div>
    </div>
  )
}
