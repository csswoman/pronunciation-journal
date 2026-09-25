'use client'

import type { ConversationalMission } from '@/lib/ai-practice/missions/types'
import PastelCard from '@/components/layout/PastelCard'
import { getIllustration } from '@/lib/illustrations/registry'
import { MISSION_CATEGORY_LABELS } from './mission-category-labels'
import { getCategoryTone, getMissionIllustrationKey } from './MissionCard'

interface MissionBriefingProps {
  mission: ConversationalMission
}

// Planned structure:
// <MissionBriefing>
//   <PastelCard tone={categoryTone}>
//     <HeaderBadges />
//     <TitleAndContext />
//     <OpeningLine />
//     <RoleOverview />
//     <BackgroundIllustration />
//   </PastelCard>
// </MissionBriefing>

export function MissionBriefing({ mission }: MissionBriefingProps) {
  const illustrationKey = getMissionIllustrationKey(mission)
  const Illustration = getIllustration(illustrationKey)
  const tone = getCategoryTone(mission.category)
  const cefrUpper = mission.recommendedCefr.toUpperCase()

  return (
    <PastelCard
      tone={tone}
      className="relative flex flex-col justify-between gap-3 p-5 overflow-hidden rounded-3xl group mb-4"
    >
      <div className="flex flex-col gap-2.5 min-w-0 z-10 max-w-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-ink/10 border border-ink/20 px-2.5 py-0.5 text-tiny font-bold text-ink select-none">
            {MISSION_CATEGORY_LABELS[mission.category]}
          </span>
          <span className="inline-flex items-center rounded-full bg-ink/10 border border-ink/20 px-2.5 py-0.5 text-tiny font-bold text-ink select-none">
            {cefrUpper}
          </span>
        </div>

        <div className="flex flex-col gap-1 pr-6">
          <h2 className="m-0 font-display text-lg @[28rem]:text-xl font-extrabold text-ink leading-tight tracking-tight">
            {mission.communicativeGoal}
          </h2>
          <p className="m-0 text-xs @[28rem]:text-sm text-ink-secondary text-pretty">
            {mission.context}
          </p>
        </div>

        {mission.opening && (
          <p className="m-0 text-body-sm font-semibold text-ink pt-0.5">
            {mission.opening}
          </p>
        )}

        <div className="flex items-center gap-2 font-mono text-tiny text-ink-muted flex-wrap">
          <span>Profesor: <strong className="text-ink">{mission.role.model}</strong></span>
          <span>·</span>
          <span>Tú: <strong className="text-ink">{mission.role.student}</strong></span>
        </div>
      </div>

      {/* Illustration in background right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 -bottom-4 text-ink/15 transition-all duration-300 group-hover:scale-105 group-hover:text-ink/25 [&>svg]:h-36 @[28rem]:[&>svg]:h-44 [&>svg]:w-auto"
      >
        <Illustration />
      </div>
    </PastelCard>
  )
}
