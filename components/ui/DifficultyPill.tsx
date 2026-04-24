import { Circle } from 'lucide-react'
import type { Difficulty } from '@/lib/types'

interface DifficultyPillProps {
  difficulty: Difficulty
}

const difficultyConfig: Record<Difficulty, { label: string; bgColor: string; textColor: string; dotColor: string }> = {
  easy: {
    label: 'Easy',
    bgColor: 'color-mix(in oklch, var(--success) 12%, var(--bg-tertiary) 88%)',
    textColor: 'var(--success)',
    dotColor: 'var(--success)',
  },
  medium: {
    label: 'Mid',
    bgColor: 'color-mix(in oklch, var(--warning) 12%, var(--bg-tertiary) 88%)',
    textColor: 'var(--warning)',
    dotColor: 'var(--warning)',
  },
  hard: {
    label: 'Hard',
    bgColor: 'color-mix(in oklch, var(--error) 12%, var(--bg-tertiary) 88%)',
    textColor: 'var(--error)',
    dotColor: 'var(--error)',
  },
}

export default function DifficultyPill({ difficulty }: DifficultyPillProps) {
  const config = difficultyConfig[difficulty]

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        borderColor: `color-mix(in oklch, ${config.textColor} 20%, transparent)`,
        border: `1px solid color-mix(in oklch, ${config.textColor} 20%, transparent)`,
      }}
    >
      <Circle className="w-2 h-2 fill-current" style={{ color: config.dotColor }} />
      {config.label}
    </span>
  )
}
