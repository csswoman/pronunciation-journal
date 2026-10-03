'use client'

// Planned structure:
// <SprintProgress>
//   <PastelCard tone="lilac">
//     <HeaderWithIllustration>
//       <TextSummaryAndPill />
//       <KoboyoCleanIllustration />
//     </HeaderWithIllustration>
//     <ProgressBarTrackAndFill />
//     <SubtextFooter />
//   </PastelCard>
// </SprintProgress>

import React from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import PastelCard from '@/components/layout/PastelCard'
import { db } from '@/lib/db'
import type { FocusSprint } from '@/lib/focus/types'
import { daysRemaining } from '@/lib/focus/sprint-lifecycle'
import { sprintTotalDays, sprintDayAt, practicedDays } from '@/lib/focus/practice-progress'
import { getIllustration } from '@/lib/illustrations/registry'

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

  const Illustration = getIllustration('domainProgress')

  return (
    <PastelCard tone="lilac" className="relative rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col gap-4 overflow-hidden mb-6 sm:mb-8 text-left">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="ts-kicker text-ink-muted">
            PROGRESO DEL SPRINT
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="ts-headline-xl text-ink">
              Día {currentDay} de {totalDays}
            </h2>
            <span className="rounded-full bg-white/80 border border-black/10 px-3.5 py-1 ts-chip text-ink shadow-xs">
              {daysLeft === 0 ? 'Último día' : `${daysLeft} días restantes`}
            </span>
          </div>
        </div>

        <Illustration
          className="h-16 sm:h-24 w-auto text-ink opacity-80 shrink-0 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso del sprint"
          className="w-full h-3 rounded-full bg-black/10 overflow-hidden"
        >
          <div
            className="h-full bg-text transition-all duration-500 rounded-full"
            style={{ width: `${Math.max(5, progressPct)}%` }}
          />
        </div>
        <p className="ts-caption text-ink-secondary mt-0.5">
          {statusText}
        </p>
      </div>
    </PastelCard>
  )
}
