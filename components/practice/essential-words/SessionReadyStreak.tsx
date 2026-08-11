'use client'

// Planned structure:
// <SessionReadyStreak> label + value + milestone whisper + 7 marks </SessionReadyStreak>

import { SessionSurface } from './session-chrome'
import { cn } from '@/lib/cn'

interface Props {
  streak: number
  marks: boolean[]
}

function streakWhisper(streak: number): string | null {
  if (streak >= 30) return 'Un mes de constancia'
  if (streak >= 14) return 'Dos semanas seguidas'
  if (streak >= 7) return 'Una semana seguida'
  if (streak >= 3) return 'Vas creando el hábito'
  return null
}

export function SessionReadyStreak({ streak, marks }: Props) {
  const activeDays = marks.filter(Boolean).length
  const whisper = streakWhisper(streak)

  return (
    <SessionSurface density="compact">
      <span className="font-kicker text-fg-muted">Racha</span>
      <span className="type-stat text-h3 tracking-tight tabular-nums text-fg">
        {streak} {streak === 1 ? 'día' : 'días'}
      </span>
      {whisper ? (
        <span className="animate-state-in text-caption text-pretty text-primary">
          {whisper}
        </span>
      ) : null}
      <div
        className="flex gap-1"
        role="img"
        aria-label={`${activeDays} de 7 días con práctica`}
      >
        {marks.map((active, index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              'transition-[background-color,transform] duration-150 ease-out-quart',
              'motion-reduce:transition-none',
              active ? 'bg-primary animate-state-in' : 'bg-border-subtle',
            )}
            style={active ? { animationDelay: `${index * 35}ms` } : undefined}
          />
        ))}
      </div>
    </SessionSurface>
  )
}
