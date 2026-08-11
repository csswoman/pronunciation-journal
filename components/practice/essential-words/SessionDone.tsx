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
import { CheckCircle2, Sparkles, AlertCircle, Loader2 } from '@/components/icons'
import { PillButton } from '@/components/ui/PillButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { displayEnglishWord } from '@/lib/essential-words/word-display'
import { cn } from '@/lib/cn'
import { StatBlock } from './StatBlock'
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
  strugglingWords?: string[]
}

export function SessionDone({
  stats,
  sessionSummary,
  wasEmpty,
  loadFailed,
  onContinue,
  continueLoading,
  onLearnMore,
  strugglingWords,
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
      : 'bg-[var(--success-icon-bg)] text-[var(--success-value)]'

  return (
    <div className="flex flex-col items-center layout-stack-loose py-layout-page-block text-center animate-message-in">
      <div className="flex flex-col items-center gap-3">
        <span
          className={cn( 'inline-flex h-12 w-12 items-center justify-center rounded-full', iconTone, !loadFailed && 'animate-step-done', )}
          aria-hidden
        >
          <Icon size={24} />
        </span>
        <h2 className="m-0 text-h3 text-fg">{headline}</h2>
        {!wasEmpty && !loadFailed && practiced > 0 ? (
          <StatBlock
            stats={[
              { label: 'Aprendidas hoy', value: stats.newToday },
              { label: 'Repasadas', value: Math.max(0, practiced - stats.newToday) },
              {
                label: 'Sin fallos',
                value: Math.max(0, practiced - (strugglingWords?.length ?? 0)),
              },
            ]}
          />
        ) : null}
        {!wasEmpty && !loadFailed && strugglingWords && strugglingWords.length > 0 ? (
          <div className="flex w-full flex-col items-center gap-2">
            <span className="text-caption font-semibold text-fg-muted">
              Estas te costaron — vuelven mañana
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {strugglingWords.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center rounded-full bg-warning-soft px-3 py-1 text-caption text-warning"
                >
                  {displayEnglishWord(word)}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {!wasEmpty && !loadFailed ? (
          <p className="m-0 text-caption text-fg-subtle">
            La próxima sesión se armará con el tamaño seleccionado.
          </p>
        ) : null}
        {loadFailed ? (
          <p className="m-0 max-w-[36ch] text-caption text-fg-subtle">
            Revisa tu conexión o vuelve a intentar la carga.
          </p>
        ) : wasEmpty ? (
          <p className="m-0 max-w-[36ch] text-caption text-fg-subtle">
            Estás al día. Vuelve mañana, el repaso espaciado hace el resto.
          </p>
        ) : (
          <p className="m-0 max-w-[36ch] text-caption text-fg-subtle">
            Tu práctica ya cuenta en tu progreso.
          </p>
        )}
      </div>

      <div className="flex w-full max-w-sm flex-col gap-layout-stack">
        {onLearnMore ? (
          <PillButton
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            onClick={onLearnMore}
            data-cuelume-press="press"
            data-cuelume-release="release"
          >
            Practicar otra sesión
          </PillButton>
        ) : null}
        {onContinue ? (
          <PillButton
            type="button"
            variant={onLearnMore ? 'outline' : 'primary'}
            size="md"
            className="w-full"
            icon={continueLoading ? <Loader2 size={16} /> : undefined}
            isLoading={continueLoading}
            onClick={onContinue}
            data-cuelume-press="press"
            data-cuelume-release="release"
          >
            {loadFailed ? 'Reintentar carga' : 'Buscar palabras para practicar'}
          </PillButton>
        ) : null}
        <div className="flex w-full items-center justify-center gap-1">
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
      </div>
    </div>
  )
}
