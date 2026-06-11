'use client'

// Planned structure:
// <SelfGradeBar>
//   <GradeButton × 4 />   — Otra vez / Difícil / Bien / Fácil
// </SelfGradeBar>

import { cn } from '@/lib/cn'

const GRADES = [
  { label: 'Otra vez', quality: 1 },
  { label: 'Difícil', quality: 3 },
  { label: 'Bien', quality: 4 },
  { label: 'Fácil', quality: 5 },
] as const

interface Props {
  onGrade: (quality: number) => void
  disabled?: boolean
}

export function SelfGradeBar({ onGrade, disabled }: Props) {
  return (
    <div className="flex w-full justify-center gap-2">
      {GRADES.map(({ label, quality }) => (
        <button
          key={quality}
          type="button"
          disabled={disabled}
          onClick={() => onGrade(quality)}
          className={cn(
            'flex-1 max-w-28 py-2 px-3 text-xs font-medium rounded-[var(--radius-full)] border cursor-pointer [font-family:inherit] disabled:opacity-40',
            quality === 1
              ? 'border-[var(--error)] text-[var(--error)] bg-transparent'
              : 'border-[var(--border-subtle)] text-[var(--text-secondary)] bg-transparent',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
