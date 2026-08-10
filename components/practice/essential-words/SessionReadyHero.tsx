'use client'

// Planned structure:
// <SessionReadyHero>
//   title + minutes
//   breakdown
//   note
//   <SessionReadySizePicker />
//   <SessionReadyRouteChips />
//   CTA
// </SessionReadyHero>

import { estimateDurationMs } from '@/lib/essential-words/session-plan-time-ceiling'
import type { SessionSizeId } from '@/lib/essential-words/session-size'
import { PillButton } from '@/components/ui/PillButton'
import type { EssentialWordsCounts, EssentialWordsStats } from '@/hooks/useEssentialWordsSession'
import { SessionReadyRouteChips } from './SessionReadyRouteChips'
import { SessionReadySizePicker } from './SessionReadySizePicker'
import { SessionSurface } from './session-chrome'

interface Props {
  counts: EssentialWordsCounts
  stats: EssentialWordsStats
  isResume: boolean
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
  sessionSize: SessionSizeId
  onSessionSizeChange: (id: SessionSizeId) => void
  onBegin: () => void
}

function estimateSessionMinutes(counts: EssentialWordsCounts): number {
  const newMs = estimateDurationMs({
    exposeCount: counts.newRemaining,
    exerciseCount: counts.newRemaining * 3,
  })
  const reviewMs = estimateDurationMs({
    exposeCount: 0,
    exerciseCount: (counts.learningRemaining + counts.reviewRemaining) * 3,
  })
  return Math.max(1, Math.round((newMs + reviewMs) / 60000))
}

function structureNote(counts: EssentialWordsCounts, isResume: boolean): string | null {
  if (isResume) {
    return 'Retoma la sesión que dejaste a medias'
  }
  if (counts.newRemaining > 0) {
    const blocks = Math.ceil(counts.newRemaining / 3)
    return `${blocks} ${blocks === 1 ? 'bloque' : 'bloques'} de palabras nuevas, más los repasos y una ronda final`
  }
  if (counts.reviewRemaining > 0) {
    return 'Solo repaso de palabras que ya has visto'
  }
  return null
}

function breakdownLine(counts: EssentialWordsCounts): string | null {
  const parts: string[] = []
  if (counts.newRemaining > 0) parts.push(`${counts.newRemaining} nuevas`)
  if (counts.reviewRemaining > 0) parts.push(`${counts.reviewRemaining} repasos`)
  if (parts.length === 0) return null
  return parts.join(' · ')
}

export function SessionReadyHero({
  counts,
  isResume,
  activeRouteId,
  onRouteChange,
  sessionSize,
  onSessionSizeChange,
  onBegin,
}: Props) {
  const minutes = estimateSessionMinutes(counts)
  const note = structureNote(counts, isResume)
  const breakdown = breakdownLine(counts)
  const total =
    counts.newRemaining + counts.learningRemaining + counts.reviewRemaining
  const title = isResume
    ? 'Continuar donde lo dejaste'
    : `Hoy te tocan ${total} ${total === 1 ? 'palabra' : 'palabras'}`
  const ctaLabel = isResume ? 'Continuar' : 'Empezar'

  return (
    <SessionSurface className="gap-layout-stack-loose">
      <header className="flex items-start justify-between gap-3">
        <h2 id="session-ready-title" className="m-0 text-h3 text-balance text-fg">
          {title}
        </h2>
        <span className="shrink-0 pt-0.5 font-caption tabular-nums text-fg-muted">
          unos {minutes} min
        </span>
      </header>

      {breakdown ? (
        <p className="m-0 text-body-sm text-fg-muted">{breakdown}</p>
      ) : null}

      {note ? <p className="m-0 text-caption text-pretty text-fg-muted">{note}</p> : null}

      <SessionReadySizePicker value={sessionSize} onChange={onSessionSizeChange} />
      <SessionReadyRouteChips activeRouteId={activeRouteId} onRouteChange={onRouteChange} />

      <PillButton
        type="button"
        variant="primary"
        size="md"
        className="w-full"
        onClick={onBegin}
        data-cuelume-press="press"
        data-cuelume-release="release"
      >
        {ctaLabel}
      </PillButton>
    </SessionSurface>
  )
}
