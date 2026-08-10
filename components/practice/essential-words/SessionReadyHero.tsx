'use client'

// Planned structure:
// <SessionReadyHero>
//   title + minutes
//   breakdown
//   <SessionReadySizePicker />
//   CTA
//   <SessionReadyRouteChips /> (secondary)
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

function breakdownLine(counts: EssentialWordsCounts, isResume: boolean): string | null {
  if (isResume) {
    return 'Retoma la sesión que dejaste a medias'
  }
  const parts: string[] = []
  if (counts.newRemaining > 0) parts.push(`${counts.newRemaining} nuevas`)
  if (counts.reviewRemaining > 0) parts.push(`${counts.reviewRemaining} repasos`)
  if (counts.learningRemaining > 0) {
    parts.push(`${counts.learningRemaining} en curso`)
  }
  if (counts.newRemaining > 0 || counts.reviewRemaining > 0) {
    parts.push('1 ronda final')
  }
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
  const breakdown = breakdownLine(counts, isResume)
  const total =
    counts.newRemaining + counts.learningRemaining + counts.reviewRemaining
  const title = isResume
    ? 'Continuar donde lo dejaste'
    : `Hoy te tocan ${total} ${total === 1 ? 'palabra' : 'palabras'}`
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

      <SessionReadySizePicker value={sessionSize} onChange={onSessionSizeChange} />

      <PillButton
        type="button"
        variant="primary"
        size="md"
        className="w-full active:scale-[0.99] motion-reduce:active:scale-100"
        onClick={onBegin}
        data-cuelume-press="press"
        data-cuelume-release="release"
      >
        {ctaLabel}
      </PillButton>

      <SessionReadyRouteChips activeRouteId={activeRouteId} onRouteChange={onRouteChange} />
    </SessionSurface>
  )
}
