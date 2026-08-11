'use client'

import { PillButton } from '@/components/ui/PillButton'
import type { OralMission } from '@/lib/ai-practice/missions/types'
import { MISSION_CATEGORY_LABELS } from './mission-category-labels'

// Planned structure:
// <MissionCard>
//   <MissionMeta /> — category + CEFR
//   <MissionBody /> — goal + context
//   <MissionAction /> — start CTA

interface MissionCardProps {
  mission: OralMission
  onSelect: (missionId: string) => void
}

export function MissionCard({ mission, onSelect }: MissionCardProps) {
  return (
    <article className="layout-card-pad flex flex-col gap-3 rounded-md border border-border-subtle bg-surface-raised">
      <p className="m-0 font-kicker text-fg-subtle">
        {MISSION_CATEGORY_LABELS[mission.category]} · {mission.recommendedCefr.toUpperCase()}
      </p>

      <div className="layout-stack-tight min-w-0 flex-1">
        <h3 className="m-0 text-balance text-label font-semibold text-fg">
          {mission.communicativeGoal}
        </h3>
        <p className="m-0 text-pretty text-body-sm text-fg-muted">
          {mission.context}
        </p>
      </div>

      <div className="pt-1">
        <PillButton
          variant="primary"
          size="sm"
          className="min-h-11 w-full"
          onClick={() => onSelect(mission.id)}
        >
          Empezar
        </PillButton>
      </div>
    </article>
  )
}
