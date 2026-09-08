// components/ai-coach/missions/scripted/ScoreVerdict.tsx
'use client'

// Planned structure:
// <ScoreVerdict>  — big score coloured by band + one-line headline

import { cn } from '@/lib/cn'

interface Props {
  score: number
  headline: string
}

function bandClass(score: number): string {
  if (score >= 90) return 'text-[var(--success)]'
  if (score >= 70) return 'text-[var(--warning)]'
  return 'text-[var(--error)]'
}

export function ScoreVerdict({ score, headline }: Props) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={cn('text-h3 font-semibold', bandClass(score))}>{score}%</span>
      <span className="text-body-sm text-fg-muted">{headline}</span>
    </div>
  )
}
