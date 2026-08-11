'use client'

// Planned structure:
// <SessionReadyHero>
//   title + minutes
//   breakdown
//   <SessionReadySizePicker />
//   CTA
//   <SessionReadyRouteChips /> (secondary)
// </SessionReadyHero>

import type { SessionSizeId } from '@/lib/essential-words/session-size'
import { PillButton } from '@/components/ui/PillButton'
import type { EssentialWordsSessionPreview } from '@/lib/essential-words/action-session'
import { SessionReadyRouteChips } from './SessionReadyRouteChips'
import { SessionReadySizePicker } from './SessionReadySizePicker'
import { SessionSurface } from './session-chrome'

interface Props {
  preview: EssentialWordsSessionPreview
  isResume: boolean
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
  sessionSize: SessionSizeId
  onSessionSizeChange: (id: SessionSizeId) => void
  onBegin: () => void
  onDiscard: () => void
  previewLoading: boolean
}

function breakdownLine(preview: EssentialWordsSessionPreview, isResume: boolean): string | null {
  if (isResume) {
    return `${preview.remainingActions} ${preview.remainingActions === 1 ? 'ejercicio pendiente' : 'ejercicios pendientes'}`
  }
  const parts: string[] = []
  if (preview.newWordCount > 0) parts.push(`${preview.newWordCount} ${preview.newWordCount === 1 ? 'palabra nueva' : 'palabras nuevas'}`)
  if (preview.reviewActionCount > 0) parts.push(`${preview.reviewActionCount} ${preview.reviewActionCount === 1 ? 'repaso' : 'repasos'}`)
  if (preview.continuationActionCount > 0) parts.push(`${preview.continuationActionCount} ${preview.continuationActionCount === 1 ? 'acción en curso' : 'acciones en curso'}`)
  if (parts.length === 0) return null
  return parts.join(' · ')
}

export function SessionReadyHero({
  preview,
  isResume,
  activeRouteId,
  onRouteChange,
  sessionSize,
  onSessionSizeChange,
  onBegin,
  onDiscard,
  previewLoading,
}: Props) {
  const minutes = Math.max(1, Math.round(preview.estimatedDurationMs / 60000))
  const breakdown = breakdownLine(preview, isResume)
  const title = isResume
    ? 'Continuar donde lo dejaste'
    : `Hoy tienes ${preview.scheduledActions} ${preview.scheduledActions === 1 ? 'ejercicio' : 'ejercicios'}`
  const ctaLabel = isResume ? 'Continuar' : 'Empezar'

  return (
    <SessionSurface density="primary" className="animate-home-in">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-1.5">
          <h2 id="session-ready-title" className="m-0 text-h3 text-balance text-fg">
            {title}
          </h2>
          {breakdown ? (
            <p className="m-0 text-body-sm text-pretty tabular-nums text-fg-muted">
              {breakdown}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 pt-1 font-caption tabular-nums text-fg-muted">
          unos {minutes} min
        </span>
      </header>

      <SessionReadySizePicker value={sessionSize} onChange={onSessionSizeChange} disabled={isResume} />

      <p className="sr-only" role="status" aria-live="polite">
        {previewLoading ? 'Actualizando sesión' : ''}
      </p>

      <PillButton
        type="button"
        variant="primary"
        size="md"
        className="w-full active:scale-[0.99] motion-reduce:active:scale-100"
        onClick={onBegin}
        disabled={previewLoading}
        data-cuelume-press="press"
        data-cuelume-release="release"
      >
        {previewLoading ? 'Actualizando…' : ctaLabel}
      </PillButton>

      {isResume ? (
        <PillButton type="button" variant="outline" size="sm" className="w-full" onClick={onDiscard}>
          Descartar sesión
        </PillButton>
      ) : null}

      <SessionReadyRouteChips activeRouteId={activeRouteId} onRouteChange={onRouteChange} disabled={isResume} />
    </SessionSurface>
  )
}
