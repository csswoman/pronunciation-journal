'use client'

import { PillButton } from '@/components/ui/PillButton'
import PastelCard, { type PastelTone } from '@/components/layout/PastelCard'
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
//   <FeaturedMissionCard> (isFeatured === true)
//     <PastelCard tone="coral">
//       <HeaderRow> — SUGERIDA badge + Category/CEFR pills
//       <ContentSection> — Title (Bricolage Grotesque) + Description in text-ink
//       <BackgroundIllustration /> — SVG illustration as large background watermark
//       <ActionRow> — Empezar CTA
//     </PastelCard>
//   </FeaturedMissionCard>
//   <RegularMissionCard> (isFeatured === false)
//     <PastelCard tone={categoryTone}>
//       <HeaderRow> — Category & CEFR badges
//       <ContentSection> — Title (Bricolage Grotesque) + Description in text-ink
//       <BackgroundIllustration /> — SVG illustration as large background watermark
//       <ActionRow> — Empezar CTA
//     </PastelCard>
//   </RegularMissionCard>
// </MissionCard>

interface MissionCardProps {
  mission: OralMission
  onSelect: (missionId: string) => void
  isFeatured?: boolean
}

export function getMissionIllustrationKey(mission: OralMission): IllustrationKey {
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

export function getCategoryTone(category: MissionCategory | string): PastelTone {
  switch (category) {
    case 'service':
      return 'butter'
    case 'interview':
      return 'sky'
    case 'workplace':
      return 'lilac'
    case 'social':
      return 'coral'
    case 'generated':
      return 'mint'
    default:
      return 'coral'
  }
}

export function MissionCard({ mission, onSelect, isFeatured = false }: MissionCardProps) {
  const isScripted = isScriptedMission(mission)
  const isConversational = isConversationalMission(mission)
  const illustrationKey = getMissionIllustrationKey(mission)
  const Illustration = getIllustration(illustrationKey)
  const tone = getCategoryTone(mission.category)
  const cefrUpper = mission.recommendedCefr.toUpperCase()

  if (isFeatured) {
    return (
      <PastelCard
        tone="coral"
        className="col-span-full relative flex flex-col justify-between gap-5 p-5 @[28rem]:p-6 overflow-hidden rounded-3xl group min-h-[200px]"
      >
        <div className="flex flex-col gap-3 min-w-0 z-10 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-ink px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-paper select-none">
              SUGERIDA
            </span>
            <span className="inline-flex items-center rounded-full bg-ink/10 border border-ink/20 px-3 py-1 text-tiny font-bold text-ink select-none">
              {MISSION_CATEGORY_LABELS[mission.category]}
            </span>
            <span className="inline-flex items-center rounded-full bg-ink/10 border border-ink/20 px-2.5 py-1 text-tiny font-bold text-ink select-none">
              {cefrUpper}
            </span>
            {isScripted && mission.origin === 'generated' && (
              <span className="inline-flex items-center rounded-full bg-ink/10 border border-ink/20 px-2.5 py-1 text-tiny font-bold text-ink select-none">
                IA
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 pr-6">
            <h3 className="m-0 font-display text-xl @[28rem]:text-2xl font-extrabold text-ink leading-snug tracking-tight">
              {mission.communicativeGoal}
            </h3>
            <p className="m-0 text-sm text-ink-secondary text-pretty line-clamp-2">
              {mission.context}
            </p>
          </div>

          {isConversational && (
            <p className="m-0 font-mono text-tiny text-ink-muted">
              {mission.role.model} · {mission.role.student}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between z-10 pt-1">
          <PillButton
            type="button"
            variant="primary"
            size="sm"
            className="!bg-ink !text-paper border-none hover:!bg-ink/90 font-medium text-xs rounded-full min-h-10 px-5 transition-transform duration-150 active:scale-95"
            onClick={() => onSelect(mission.id)}
          >
            Empezar →
          </PillButton>
        </div>

        {/* Illustration in background right */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -bottom-4 text-ink/15 transition-all duration-300 group-hover:scale-105 group-hover:text-ink/25 [&>svg]:h-44 @[28rem]:[&>svg]:h-56 [&>svg]:w-auto"
        >
          <Illustration />
        </div>
      </PastelCard>
    )
  }

  return (
    <PastelCard
      tone={tone}
      className="relative flex flex-col justify-between gap-4 p-5 overflow-hidden rounded-3xl group min-h-[190px]"
    >
      <div className="flex flex-col gap-3 min-w-0 z-10">
        {/* Top-left category & level badges */}
        <div className="flex flex-wrap items-center justify-start gap-1.5">
          <span className="inline-flex items-center rounded-full bg-ink/10 border border-ink/20 px-2.5 py-0.5 text-tiny font-bold text-ink select-none">
            {MISSION_CATEGORY_LABELS[mission.category]}
          </span>
          <span className="inline-flex items-center rounded-full bg-ink/10 border border-ink/20 px-2.5 py-0.5 text-tiny font-bold text-ink select-none">
            {cefrUpper}
          </span>
          {isScripted && mission.origin === 'generated' && (
            <span className="inline-flex items-center rounded-full bg-ink/10 border border-ink/20 px-2.5 py-0.5 text-tiny font-bold text-ink select-none">
              IA
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 min-w-0 pr-8">
          <h3 className="m-0 font-display text-base @[28rem]:text-lg font-bold text-ink leading-tight tracking-tight">
            {mission.communicativeGoal}
          </h3>
          <p className="m-0 text-xs text-ink-secondary text-pretty line-clamp-2">
            {mission.context}
          </p>
        </div>

        {isConversational && (
          <p className="m-0 font-mono text-tiny text-ink-muted truncate">
            {mission.role.model} · {mission.role.student}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between z-10 pt-1">
        <PillButton
          type="button"
          variant="primary"
          size="sm"
          className="!bg-ink !text-paper border-none hover:!bg-ink/90 font-medium text-xs rounded-full min-h-9 px-4 transition-transform duration-150 active:scale-95"
          onClick={() => onSelect(mission.id)}
        >
          Empezar →
        </PillButton>
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
