// Planned structure:
// <LevelProgressBar>
//   segment × n   — proportional CEFR slices with per-level fill
// </LevelProgressBar>

import type { LevelBarSegment } from '@/lib/essential-words/level-progress'
import { cn } from '@/lib/cn'

interface Props {
  segments: readonly LevelBarSegment[]
  className?: string
}

export function LevelProgressBar({ segments, className }: Props) {
  const totalWords = segments.reduce((sum, segment) => sum + segment.total, 0)
  const learnedWords = segments.reduce((sum, segment) => sum + segment.learned, 0)

  if (totalWords === 0) return null

  return (
    <div
      className={cn('flex h-2 w-full gap-px overflow-hidden rounded-full bg-surface-sunken', className)}
      role="progressbar"
      aria-valuenow={learnedWords}
      aria-valuemin={0}
      aria-valuemax={totalWords}
      aria-label="Progreso por nivel CEFR"
    >
      {segments.map((segment) => (
        <div
          key={segment.level}
          className="relative h-full min-w-px bg-surface-sunken"
          style={{ flexGrow: segment.total, flexBasis: 0 }}
          title={`${segment.level}: ${segment.learned} de ${segment.total}`}
        >
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-300 ease-out-quart',
              segment.state === 'upcoming' && 'opacity-0',
            )}
            style={{ width: `${segment.fillRatio * 100}%` }}
          />
        </div>
      ))}
    </div>
  )
}
