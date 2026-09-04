'use client'

import Badge, { type BadgeVariant } from '@/components/ui/Badge'
import { PillButton } from '@/components/ui/PillButton'
import {
  isConversationalMission,
  isScriptedMission,
  type MissionCategory,
  type OralMission,
} from '@/lib/ai-practice/missions/types'
import { MISSION_CATEGORY_LABELS } from './mission-category-labels'

// Planned structure:
// <MissionCard>
//   <MissionMeta /> — category badge + CEFR badge + mode metadata
//   <MissionBody /> — communicative goal + context description
//   <MissionHighlights /> — roleplay parties or learner target count
//   <MissionAction /> — start CTA button
// </MissionCard>

const CATEGORY_BADGE_VARIANTS: Record<MissionCategory, BadgeVariant> = {
  interview: 'info',
  workplace: 'success',
  service: 'warning',
  social: 'default',
}

interface MissionCardProps {
  mission: OralMission
  onSelect: (missionId: string) => void
}

export function MissionCard({ mission, onSelect }: MissionCardProps) {
  const isScripted = isScriptedMission(mission)
  const isConversational = isConversationalMission(mission)

  return (
    <article className="layout-card-pad flex flex-col gap-3 rounded-md border border-border-subtle bg-surface-raised transition-colors hover:border-border">
      {/* Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            label={MISSION_CATEGORY_LABELS[mission.category]}
            variant={CATEGORY_BADGE_VARIANTS[mission.category]}
            size="sm"
          />
          <Badge
            label={mission.recommendedCefr.toUpperCase()}
            variant="neutral"
            size="sm"
          />
          {isScripted && mission.origin === 'generated' && (
            <Badge
              label="IA"
              variant="default"
              size="sm"
            />
          )}
        </div>
        <span className="font-kicker text-fg-subtle">
          {isScripted
            ? `${mission.script.length} turnos`
            : `${mission.maxTurns} turnos máx.`}
        </span>
      </div>

      {/* Goal & Context */}
      <div className="layout-stack-tight min-w-0 flex-1">
        <h3 className="m-0 text-balance text-label font-semibold text-fg">
          {mission.communicativeGoal}
        </h3>
        <p className="m-0 text-pretty text-body-sm text-fg-muted">
          {mission.context}
        </p>
      </div>

      {/* Highlights / Details */}
      <div className="border-t border-border-subtle/60 pt-2 text-tiny text-fg-subtle">
        {isConversational && (
          <p className="m-0 truncate font-mono">
            {mission.role.model} · {mission.role.student}
          </p>
        )}
        {isScripted && (
          <p className="m-0 truncate font-kicker">
            {mission.script.filter((l) => l.speaker === 'learner').length} frases para hablar en voz alta
          </p>
        )}
      </div>

      {/* Action */}
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

