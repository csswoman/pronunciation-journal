'use client'

// Planned structure:
// <SprintProgress>
//   <DaysCounter />
//   <ProgressBar />
// </SprintProgress>

import React from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { FocusSprint } from '@/lib/focus/types'
import { daysRemaining } from '@/lib/focus/sprint-lifecycle'
import { sprintTotalDays, sprintDayAt, practicedDays } from '@/lib/focus/practice-progress'

interface SprintProgressProps {
  sprint: FocusSprint
}

export function SprintProgress({ sprint }: SprintProgressProps) {
  const liveSprint = useLiveQuery(() => db.focusSprints.get(sprint.id), [sprint.id]) ?? sprint
  const currentSprint = liveSprint ?? sprint

  const daysLeft = daysRemaining(currentSprint)
  const totalDays = sprintTotalDays(currentSprint)
  const daysPracticedCount = practicedDays(currentSprint.practice)

  const progressPct = Math.min(100, Math.round((daysPracticedCount / totalDays) * 100))

  const currentDay = sprintDayAt(currentSprint) ?? 1
  const currentDayData = currentSprint.practice?.days?.find((d) => d.day === currentDay)
  const hasStartedFormatToday = (currentDayData?.startedContentIds.length ?? 0) > 0

  let statusText = `${daysPracticedCount} de ${totalDays} días con práctica registrada`
  if (daysPracticedCount === 0) {
    if (hasStartedFormatToday) {
      statusText = `Día ${currentDay} en curso · empezaste un formato`
    } else {
      statusText = `Día ${currentDay} en curso`
    }
  }

  return (
    <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] mb-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-body-sm font-semibold text-[var(--text-primary)]">
          {statusText}
        </span>
        <span className="text-body-sm font-bold text-[var(--primary)]">
          {daysLeft === 0 ? 'Último día' : `${daysLeft} días restantes`}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso del sprint"
        className="w-full h-2 rounded-full bg-[var(--surface-sunken)] overflow-hidden"
      >
        <div
          className="h-full bg-[var(--primary)] transition-[width] duration-300 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  )
}
