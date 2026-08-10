'use client'

// Planned structure:
// <SessionReadyForecast> title + 7 day bars </SessionReadyForecast>

import type { ForecastDay } from '@/lib/essential-words/ready-forecast'
import { SessionSurface } from './session-chrome'
import { cn } from '@/lib/cn'

interface Props {
  days: ForecastDay[]
}

export function SessionReadyForecast({ days }: Props) {
  const max = Math.max(1, ...days.map((d) => d.count))

  return (
    <SessionSurface className="gap-layout-stack">
      <h3 className="m-0 font-label text-fg">Próximos 7 días</h3>
      <div className="flex h-24 items-end gap-1.5">
        {days.map((day) => (
          <div key={day.dayKey} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-16 w-full items-end justify-center">
              <div
                className={cn(
                  'w-full max-w-5 rounded-sm bg-primary/80',
                  day.count === 0 && 'bg-surface-sunken',
                )}
                style={{ height: `${Math.max(day.count === 0 ? 8 : 12, (day.count / max) * 100)}%` }}
                title={`${day.count} repasos`}
              />
            </div>
            <span className="font-kicker text-fg-subtle">{day.label}</span>
          </div>
        ))}
      </div>
    </SessionSurface>
  )
}
