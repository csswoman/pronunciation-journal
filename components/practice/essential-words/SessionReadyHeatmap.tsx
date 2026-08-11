'use client'

// Planned structure:
// <SessionReadyHeatmap> rail-width card + 12w grid filling the card </SessionReadyHeatmap>

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
    <SessionSurface density="compact" className="min-w-0">
      <h3 className="m-0 font-label text-fg">Últimas 12 semanas</h3>
      <div
        className="grid w-full grid-flow-col grid-rows-7 gap-1"
        role="img"
        aria-label="Actividad de palabras esenciales en las últimas 12 semanas"
      >
        {days.map((day) => (
          <span
            key={day.dayKey}
            title={`${day.dayKey}: ${day.count}`}
            className={cn(
              'aspect-square min-h-0 min-w-0 w-full rounded-sm',
              'transition-[filter,transform] duration-150 ease-out-quart',
              'motion-reduce:transition-none',
              day.level > 0 && 'hover:brightness-110 hover:scale-110',
              LEVEL_CLASS[day.level],
            )}
          />
        ))}
      </div>
    </SessionSurface>
  )
}
