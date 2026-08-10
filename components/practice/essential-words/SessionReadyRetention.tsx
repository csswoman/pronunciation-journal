'use client'

// Planned structure:
// <SessionReadyRetention> label + pct + sample </SessionReadyRetention>

import { SessionSurface } from './session-chrome'

interface Props {
  pct: number
  sampleSize: number
}

export function SessionReadyRetention({ pct, sampleSize }: Props) {
  return (
    <SessionSurface density="compact">
      <span className="font-kicker text-fg-muted">Retención 30 días</span>
      <span className="type-stat text-h3 tracking-tight tabular-nums text-fg">{pct}%</span>
      <span className="text-caption text-pretty text-fg-muted">
        {sampleSize} {sampleSize === 1 ? 'repaso reciente' : 'repasos recientes'}
      </span>
    </SessionSurface>
  )
}
