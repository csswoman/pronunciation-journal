'use client'

import type { ConversationalMission } from '@/lib/ai-practice/missions/types'

interface MissionBriefingProps {
  mission: ConversationalMission
}


export function MissionBriefing({ mission }: MissionBriefingProps) {
  return (
    <section className="layout-card-pad space-y-2 rounded-md border border-border-subtle bg-surface-raised">
      <p className="m-0 font-kicker text-fg-subtle">OBJETIVO</p>
      <p className="m-0 text-label font-semibold text-fg">{mission.communicativeGoal}</p>
      <p className="m-0 text-body-sm text-fg-muted">{mission.context}</p>
      <p className="m-0 text-body-md font-medium text-fg">{mission.opening}</p>
    </section>
  )
}
