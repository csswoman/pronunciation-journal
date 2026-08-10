'use client'

// Planned structure:
// <SessionReadyHeatmap> title + 12w grid </SessionReadyHeatmap>

import type { HeatmapDay } from '@/lib/essential-words/ready-heatmap'
import { SessionSurface } from './session-chrome'
import { cn } from '@/lib/cn'

const LEVEL_CLASS = [
  'bg-surface-sunken',
  'bg-primary/25',
  'bg-primary/45',
  'bg-primary/70',
  'bg-primary',
] as const

interface Props {
  days: HeatmapDay[]
}

export function SessionReadyHeatmap({ days }: Props) {
  return (
    <SessionSurface className="gap-layout-stack">
      <h3 className="m-0 font-label text-fg">Últimas 12 semanas</h3>
      <div
        className="grid grid-flow-col grid-rows-7 gap-1"
        role="img"
        aria-label="Actividad de palabras esenciales en las últimas 12 semanas"
      >
        {days.map((day) => (
          <span
            key={day.dayKey}
            title={`${day.dayKey}: ${day.count}`}
            className={cn('size-2.5 rounded-sm', LEVEL_CLASS[day.level])}
          />
        ))}
      </div>
    </SessionSurface>
  )
}
