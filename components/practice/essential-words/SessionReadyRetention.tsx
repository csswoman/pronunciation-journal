'use client'

// Planned structure:
// <SessionReadyRetention> label + pct </SessionReadyRetention>

import { SessionSurface } from './session-chrome'

interface Props {
  pct: number
  sampleSize: number
}

export function SessionReadyRetention({ pct, sampleSize }: Props) {
  return (
    <SessionSurface className="gap-layout-stack-tight">
      <span className="font-kicker text-fg-subtle">Retención 30 días</span>
      <span className="type-stat text-h3 tracking-tight text-fg">{pct}%</span>
      <span className="text-caption text-fg-muted">
        {sampleSize} repasos recientes
      </span>
    </SessionSurface>
  )
}
