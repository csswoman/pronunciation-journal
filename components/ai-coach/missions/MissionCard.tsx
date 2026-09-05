'use client'

import Badge from '@/components/ui/Badge'
import { PillButton } from '@/components/ui/PillButton'
import {
  isConversationalMission,
  isScriptedMission,
  type MissionCategory,
  type OralMission,
} from '@/lib/ai-practice/missions/types'
import { MISSION_CATEGORY_LABELS } from './mission-category-labels'
import { getIllustration, type IllustrationKey } from '@/lib/illustrations/registry'

// Planned structure:
// <MissionCard>
//   <MissionHeader>
//     <CenteredIllustration /> — enlarged 72px icon badge
//     <CenteredPillsRow /> — category + CEFR + IA + featured badge
//   </MissionHeader>
//   <MissionBody /> — communicative goal + summarized context description
//   <MissionHighlights /> — roleplay parties (if conversational)
//   <MissionAction /> — start CTA button with clear resting border & solid hover
// </MissionCard>

interface MissionCardProps {
  mission: OralMission
  onSelect: (missionId: string) => void
  isFeatured?: boolean
}

function getMissionIllustrationKey(mission: OralMission): IllustrationKey {
  const id = mission.id.toLowerCase()
  if (id.includes('interview')) return 'categoryPersonalInterview'
  if (id.includes('frontend')) return 'categoryFrontend'
  if (id.includes('backend')) return 'categoryBackend'
  if (id.includes('code_review') || id.includes('tech_design')) return 'categoryDesignSystems'
  if (id.includes('standup')) return 'categoryProfessional'
  if (id.includes('cafe')) return 'domainVocabulary'
  if (id.includes('airport') || id.includes('cloud')) return 'categoryCloud'
  if (id.includes('doctor')) return 'domainListening'
  if (id.includes('store') || id.includes('apartment')) return 'journalLanguageBook'
  if (id.includes('fluency') || id.includes('add_on')) return 'domainSpeaking'
  if (id.includes('meetup')) return 'emptyChat'

  const categoryMap: Record<MissionCategory, IllustrationKey> = {
    interview: 'categoryPersonalInterview',
    workplace: 'categoryBackend',
    service: 'domainVocabulary',
    social: 'domainSpeaking',
  }

  return categoryMap[mission.category] ?? 'domainSpeaking'
}

export function MissionCard({ mission, onSelect, isFeatured = false }: MissionCardProps) {
  const isScripted = isScriptedMission(mission)
  const isConversational = isConversationalMission(mission)
  const illustrationKey = getMissionIllustrationKey(mission)
  const Illustration = getIllustration(illustrationKey)

  return (
    <article
      className={`group layout-card-pad relative flex flex-col justify-between items-center text-center gap-4 rounded-md border transition-all duration-200 ${
        isFeatured
          ? 'border-primary/40 bg-surface-raised shadow-sm hover:border-primary/60 hover:shadow-md'
          : 'border-border-subtle bg-surface-raised hover:border-border hover:shadow-sm'
      }`}
    >
      <div className="flex w-full flex-col items-center gap-3">
        {/* Centered Large Illustration & Badges */}
        <div className="flex flex-col items-center justify-center gap-2.5 pt-1 w-full text-center">
          <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl bg-primary-soft/90 p-3 text-primary border border-primary/10 shadow-xs transition-transform duration-200 group-hover:scale-105 [&>svg]:h-full [&>svg]:w-auto">
            <Illustration />
          </div>

          {/* Centered Badges Row */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
            {isFeatured && (
              <Badge label="Sugerida" variant="default" size="sm" />
            )}
            <Badge
              label={MISSION_CATEGORY_LABELS[mission.category]}
              variant="neutral"
              size="sm"
            />
            <Badge
              label={mission.recommendedCefr.toUpperCase()}
              variant="neutral"
              size="sm"
            />
            {isScripted && mission.origin === 'generated' && (
              <Badge label="IA" variant="neutral" size="sm" />
            )}
          </div>
        </div>

        {/* Goal & Summarized Context */}
        <div className="flex flex-col items-center gap-1 min-w-0 w-full px-1 text-center">
          <h3 className="m-0 text-balance text-label font-semibold text-fg text-center leading-snug">
            {mission.communicativeGoal}
          </h3>
          <p className="m-0 text-pretty text-body-sm text-fg-muted text-center line-clamp-2 max-w-xs">
            {mission.context}
          </p>
        </div>

        {/* Highlights / Roleplay Details */}
        {isConversational && (
          <div className="w-full border-t border-border-subtle/50 pt-2 text-center text-tiny text-fg-subtle">
            <p className="m-0 truncate font-mono text-tiny text-fg-subtle">
              {mission.role.model} · {mission.role.student}
            </p>
          </div>
        )}
      </div>

      {/* Action CTA */}
      <div className="w-full pt-1">
        <PillButton
          type="button"
          variant={isFeatured ? 'primary' : 'outline'}
          size="sm"
          className={`min-h-10 w-full font-medium transition-all duration-200 ${
            isFeatured
              ? '!bg-primary !text-on-primary border-none hover:!bg-primary-hover shadow-xs'
              : '!bg-surface-sunken !text-fg border !border-border-strong group-hover:!bg-primary group-hover:!text-on-primary group-hover:!border-transparent'
          }`}
          onClick={() => onSelect(mission.id)}
        >
          Empezar
        </PillButton>
      </div>
    </article>
  )
}
