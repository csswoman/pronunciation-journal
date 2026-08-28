'use client'

import type { ConversationalMission } from '@/lib/ai-practice/missions/types'

interface MissionBriefingProps {
  mission: ConversationalMission
}


// Planned structure:
// <MissionBriefing>
//   <BriefingHeader />
//   <GoalText />
//   <RoleOverview />
//   <ContextNotes />
// </MissionBriefing>

export function MissionBriefing({ mission }: MissionBriefingProps) {
  return (
    <section className="layout-card-pad space-y-2.5 rounded-md border border-border-subtle bg-surface-raised">
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 font-kicker text-fg-subtle">OBJETIVO DE LA MISIÓN</p>
        <span className="text-xxs font-semibold px-2 py-0.5 rounded-full bg-primary-soft text-primary">
          {mission.recommendedCefr}
        </span>
      </div>

      <p className="m-0 text-label font-semibold text-fg">{mission.communicativeGoal}</p>

      <div className="flex items-center gap-2 text-caption text-fg-muted flex-wrap">
        <span className="inline-flex items-center gap-1 rounded-sm bg-surface-base border border-border-subtle px-1.5 py-0.5 text-xxs font-medium text-fg">
          <span className="text-fg-muted">Profesor:</span> {mission.role.model}
        </span>
        <span className="inline-flex items-center gap-1 rounded-sm bg-primary-soft text-primary px-1.5 py-0.5 text-xxs font-medium">
          <span className="opacity-75">Tú:</span> {mission.role.student}
        </span>
      </div>

      <p className="m-0 text-body-sm text-fg-muted">{mission.context}</p>
      <p className="m-0 text-body-md font-medium text-fg">{mission.opening}</p>
    </section>
  )
}
