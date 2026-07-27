'use client'

import { PillButton } from '@/components/ui/PillButton'
import type { OralMission } from '@/lib/ai-practice/missions/types'

interface MissionCardProps {
  mission: OralMission
  onSelect: (missionId: string) => void
}

export function MissionCard({ mission, onSelect }: MissionCardProps) {
  return (
    <article className="layout-card-pad space-y-3 rounded-md border border-border-subtle bg-surface-raised">
      <p className="m-0 font-kicker text-fg-subtle">
        {mission.category.toUpperCase()} · {mission.recommendedCefr}
      </p>
      <div className="space-y-1">
        <h3 className="m-0 text-label font-semibold text-fg">{mission.communicativeGoal}</h3>
        <p className="m-0 text-body-sm text-fg-muted">{mission.context}</p>
      </div>
      <PillButton
        variant="primary"
        size="sm"
        className="min-h-11"
        onClick={() => onSelect(mission.id)}
      >
        Empezar
      </PillButton>
    </article>
  )
}
