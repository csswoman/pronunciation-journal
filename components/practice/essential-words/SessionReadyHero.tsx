'use client'

// Planned structure:
// <SessionReadyHero>
//   title row + inline stats + note + CTA + <SessionReadyRouteHint />
// </SessionReadyHero>

import { estimateDurationMs } from '@/lib/essential-words/session-plan-time-ceiling'
import { PillButton } from '@/components/ui/PillButton'
import type { EssentialWordsCounts, EssentialWordsStats } from '@/hooks/useEssentialWordsSession'
import { SessionReadyRouteHint } from './SessionReadyRouteHint'
import { SessionSurface } from './session-chrome'

interface Props {
  counts: EssentialWordsCounts
  stats: EssentialWordsStats
  isResume: boolean
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
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

function SessionStat({ value, label }: { value: number; label: string }) {
  return (
    <span className="text-body-sm text-fg-muted">
      <span className="font-semibold tabular-nums text-fg">{value}</span> {label}
    </span>
  )
}

export function SessionReadyHero({
  counts,
  isResume,
  activeRouteId,
  onRouteChange,
  onBegin,
}: Props) {
  const minutes = estimateSessionMinutes(counts)
  const note = structureNote(counts, isResume)
  const title = isResume
    ? 'Continuar donde lo dejaste'
    : `Hoy te tocan ${counts.newRemaining + counts.learningRemaining + counts.reviewRemaining} ${
        counts.newRemaining + counts.learningRemaining + counts.reviewRemaining === 1
          ? 'palabra'
          : 'palabras'
      }`
  const ctaLabel = isResume ? 'Continuar' : 'Empezar'

  return (
    <SessionSurface className="gap-layout-stack">
      <header className="flex items-start justify-between gap-3">
        <h2 id="session-ready-title" className="m-0 text-h3 text-balance text-fg">
          {title}
        </h2>
        <span className="shrink-0 pt-0.5 font-caption tabular-nums text-fg-muted">
          unos {minutes} min
        </span>
      </header>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {counts.newRemaining > 0 ? (
          <SessionStat value={counts.newRemaining} label="nuevas" />
        ) : null}
        {counts.reviewRemaining > 0 ? (
          <SessionStat value={counts.reviewRemaining} label="repasos" />
        ) : null}
      </div>

      {note ? <p className="m-0 text-caption text-pretty text-fg-muted">{note}</p> : null}

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

      <SessionReadyRouteHint activeRouteId={activeRouteId} onRouteChange={onRouteChange} />
    </SessionSurface>
  )
}
