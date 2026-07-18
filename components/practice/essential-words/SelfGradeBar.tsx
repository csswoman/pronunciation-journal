'use client'

// Planned structure:
// <SelfGradeBar>
//   <GradeButton × 4 />   — Otra vez / Difícil / Bien / Fácil
// </SelfGradeBar>

import { playUiCue, type UiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'

const GRADES = [
  { label: 'Otra vez', quality: 1, cue: 'wrong' as UiCue },
  { label: 'Difícil', quality: 3, cue: 'tap' as UiCue },
  { label: 'Bien', quality: 4, cue: 'reveal' as UiCue },
  { label: 'Fácil', quality: 5, cue: 'correct' as UiCue },
] as const

interface Props {
  onGrade: (quality: number) => void
  disabled?: boolean
}

export function SelfGradeBar({ onGrade, disabled }: Props) {
  return (
    <div className="flex w-full justify-center gap-2" role="group" aria-label="Autocalificación">
      {GRADES.map(({ label, quality, cue }) => (
        <button
          key={quality}
          type="button"
          disabled={disabled}
          onClick={() => {
            playUiCue(cue)
            onGrade(quality)
          }}
          className={cn(
            'max-w-28 flex-1 cursor-pointer rounded-full border px-3 py-2 font-[inherit] text-xs font-medium',
            'transition-all duration-150 ease-out-quart focus-ring disabled:opacity-40',
            'active:scale-[0.97]',
            quality === 1
              ? 'border-error bg-transparent text-error hover:bg-error-soft'
              : quality === 5
                ? 'border-success/40 bg-transparent text-success hover:bg-success-soft'
                : 'border-border-subtle bg-transparent text-fg-muted hover:bg-surface-sunken',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
