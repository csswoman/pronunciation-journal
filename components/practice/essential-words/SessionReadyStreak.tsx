'use client'

// Planned structure:
// <SessionReadyStreak> label + value + 7 marks </SessionReadyStreak>

import { SessionSurface } from './session-chrome'
import { cn } from '@/lib/cn'

interface Props {
  streak: number
  marks: boolean[]
}

export function SessionReadyStreak({ streak, marks }: Props) {
  return (
    <SessionSurface className="gap-layout-stack-tight">
      <span className="font-kicker text-fg-subtle">Racha</span>
      <span className="type-stat text-h3 tracking-tight text-fg">
        {streak} {streak === 1 ? 'día' : 'días'}
      </span>
      <div className="flex gap-1" aria-hidden>
        {marks.map((active, index) => (
          <span
            key={index}
            className={cn(
              'h-1 flex-1 rounded-full',
              active ? 'bg-primary' : 'bg-border-subtle',
            )}
          />
        ))}
      </div>
    </SessionSurface>
  )
}
