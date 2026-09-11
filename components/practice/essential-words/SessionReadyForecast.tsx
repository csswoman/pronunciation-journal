'use client'

// Planned structure:
// <SessionReadyForecast> title + 7 day bars with mount rise </SessionReadyForecast>

import type { ForecastDay } from '@/lib/essential-words/ready-forecast'
import { SessionSurface } from './session-chrome'
import { cn } from '@/lib/cn'

interface Props {
  days: ForecastDay[]
}

export function SessionReadyForecast({ days }: Props) {
  const max = Math.max(1, ...days.map((d) => d.count))

  return (
    <SessionSurface density="compact">
      <h3 className="m-0 font-label text-fg">Próximos 7 días</h3>
      <div
        className="flex h-20 items-end gap-1.5"
        role="img"
        aria-label="Repasos previstos por día"
      >
        {days.map((day, index) => {
          const isToday = index === 0
          const heightPct = Math.max(day.count === 0 ? 10 : 14, (day.count / max) * 100)
          return (
            <div key={day.dayKey} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-14 w-full items-end justify-center">
                <div
                  className={cn(
                    'w-full max-w-5 rounded-sm transition-[colors,opacity] duration-150 ease-out-quart',
                    'hover:opacity-90',
                    day.count === 0 ? 'bg-surface-sunken' : 'bg-primary/85 animate-stat-rise',
                    isToday && day.count > 0 && 'ring-1 ring-primary/40',
                  )}
                  style={{
                    height: `${heightPct}%`,
                    animationDelay: day.count > 0 ? `${index * 45}ms` : undefined,
                  }}
                  title={`${isToday ? 'Hoy' : day.label}: ${day.count} ${day.count === 1 ? 'repaso' : 'repasos'}`}
                />
              </div>
              <span
                className={cn(
                  'font-kicker text-fg-muted',
                  isToday && 'font-semibold text-primary underline decoration-primary/50 underline-offset-2',
                )}
              >
                {day.label}
              </span>
            </div>
          )
        })}
      </div>
    </SessionSurface>
  )
}
