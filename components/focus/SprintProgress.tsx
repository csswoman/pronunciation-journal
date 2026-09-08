// Planned structure:
// <SprintProgress>
//   <DaysCounter />
//   <ProgressBar />
// </SprintProgress>

import React from 'react'
import type { FocusSprint } from '@/lib/focus/types'
import { daysRemaining, sprintProgressPct } from '@/lib/focus/sprint-lifecycle'

interface SprintProgressProps {
  sprint: FocusSprint
}

export function SprintProgress({ sprint }: SprintProgressProps) {
  const days = daysRemaining(sprint)
  const pct = sprintProgressPct(sprint)

  return (
    <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] mb-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-body-sm font-semibold text-[var(--text-primary)]">
          Progreso del Sprint
        </span>
        <span className="text-body-sm font-bold text-[var(--primary)]">
          {days === 0 ? 'Último día' : `${days} días restantes`}
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-[var(--surface-sunken)] overflow-hidden">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-300 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
