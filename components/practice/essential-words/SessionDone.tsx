'use client'

// Planned structure:
// <SessionDone>
//   <CelebrationMark />   — icon + cue on complete / empty / error
//   <Headline />
//   <Stats />
//   <SessionActions />
// </SessionDone>

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2, Sparkles, AlertCircle } from '@/components/icons'
import Button from '@/components/ui/Button'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'
import type { EssentialWordsSessionSummary, EssentialWordsStats } from '@/hooks/useEssentialWordsSession'

interface Props {
  stats: EssentialWordsStats
  sessionSummary?: EssentialWordsSessionSummary | null
  /** true cuando la cola estaba vacía desde el inicio */
  wasEmpty?: boolean
  loadFailed?: boolean
  onContinue?: () => void
  continueLoading?: boolean
  onLearnMore?: () => void
}

export function SessionDone({
  stats,
  sessionSummary,
  wasEmpty,
  loadFailed,
  onContinue,
  continueLoading,
  onLearnMore,
}: Props) {
  const practiced = sessionSummary?.practiced ?? 0
  const accuracy =
    practiced > 0 ? Math.round(((sessionSummary?.correct ?? 0) / practiced) * 100) : null
  const cuePlayed = useRef(false)

  useEffect(() => {
    if (cuePlayed.current) return
    cuePlayed.current = true
    if (loadFailed) {
      playUiCue('wrong')
      return
    }
    if (wasEmpty) {
      playUiCue('soft')
      return
    }
    if (accuracy !== null && accuracy >= 85) playUiCue('correct')
    else if (accuracy !== null && accuracy >= 60) playUiCue('reveal')
    else if (practiced > 0) playUiCue('soft')
    else playUiCue('reveal')
  }, [loadFailed, wasEmpty, accuracy, practiced])

  const headline = loadFailed
    ? 'No se pudo cargar la sesión'
    : wasEmpty
      ? 'Nada pendiente por hoy'
      : '¡Sesión completa!'

  const Icon = loadFailed ? AlertCircle : wasEmpty ? Sparkles : CheckCircle2
  const iconTone = loadFailed
    ? 'bg-error-soft text-error'
    : wasEmpty
      ? 'bg-primary-soft text-primary'
      : 'bg-success text-white'

  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center animate-message-in">
      <div className="flex flex-col items-center gap-3">
        <span
          className={cn(
            'inline-flex h-12 w-12 items-center justify-center rounded-full',
            iconTone,
            !loadFailed && 'animate-step-done',
          )}
          aria-hidden
        >
          <Icon size={24} />
        </span>
        <h2 className="m-0 text-h3 text-fg">{headline}</h2>
        {!wasEmpty && !loadFailed && practiced > 0 ? (
          <p className="m-0 text-sm text-fg-muted">
            {practiced} {practiced === 1 ? 'palabra practicada' : 'palabras practicadas'}
            {accuracy !== null ? ` · ${accuracy}% precisión` : ''}
          </p>
        ) : null}
        <p className="m-0 text-sm text-fg-muted">
          {stats.learned} de {stats.totalWords} palabras en tu deck, {stats.newToday}/
          {stats.newQuota} nuevas hoy
        </p>
        {loadFailed ? (
          <p className="m-0 max-w-[36ch] text-xs text-fg-subtle">
            Revisa tu conexión o vuelve a intentar la carga.
          </p>
        ) : wasEmpty ? (
          <p className="m-0 max-w-[36ch] text-xs text-fg-subtle">
            Estás al día. Vuelve mañana, el repaso espaciado hace el resto.
          </p>
        ) : (
          <p className="m-0 max-w-[36ch] text-xs text-fg-subtle">
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
            data-cuelume-press="press"
            data-cuelume-release="release"
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
            data-cuelume-press="press"
            data-cuelume-release="release"
          >
            {loadFailed ? 'Reintentar carga' : 'Buscar palabras para practicar'}
          </Button>
        ) : null}
        <details className="w-full text-center">
          <summary className="cursor-pointer rounded-md px-3 py-2 text-caption font-semibold text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring">
            Ver más
          </summary>
          <div className="mt-2 flex flex-col items-center gap-1">
            <Link
              href="/progress"
              className="rounded-md px-3 py-2 text-caption font-semibold text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring"
              data-cuelume-hover="tick"
            >
              Ver progreso
            </Link>
            <Link
              href="/daily"
              className="rounded-md px-3 py-2 text-caption font-semibold text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring"
              data-cuelume-hover="tick"
            >
              Abrir plan de hoy
            </Link>
          </div>
        </details>
      </div>
    </div>
  )
}
