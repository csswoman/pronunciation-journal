'use client'

// Planned structure:
// <FocusSetup>
//   <SetupHeader />
//   <SkillsRadarPreview />
//   <GapPickerTabs />
//   <SprintPlanPreview />
//   <DurationSelector />
//   <SetupActivationBar />
// </FocusSetup>

import { useState } from 'react'
import { SetupHeader } from './SetupHeader'
import { SkillsRadarPreview } from './SkillsRadarPreview'
import { GapPickerTabs } from './GapPickerTabs'
import { SprintPlanPreview } from './SprintPlanPreview'
import { DurationSelector } from './DurationSelector'
import { SetupActivationBar } from './SetupActivationBar'
import { useSprintActivation } from '@/hooks/useSprintActivation'
import type { GapSuggestion } from '@/lib/focus/gap-suggestions'
import type { SprintGap } from '@/lib/focus/types'

interface FocusSetupProps {
  userId: string
  isAnonymous?: boolean
  suggestedGaps: GapSuggestion[]
  curriculumGaps: SprintGap[]
}

export function FocusSetup({ userId, isAnonymous = false, suggestedGaps, curriculumGaps }: FocusSetupProps) {
  const [selectedGaps, setSelectedGaps] = useState<SprintGap[]>([])
  const [durationDays, setDurationDays] = useState(7)
  const { activate, isActivating, stageLabel, errorMessage } = useSprintActivation(userId)

  const handleToggle = (gap: SprintGap) => {
    setSelectedGaps((prev) => {
      const exists = prev.some((g) => g.targetId === gap.targetId)
      if (exists) return prev.filter((g) => g.targetId !== gap.targetId)
      if (prev.length >= 2) return [prev[1], gap] // máximo 2 gaps por sprint
      return [...prev, gap]
    })
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <SetupHeader isAnonymous={isAnonymous} />

      <SkillsRadarPreview enabled={!isAnonymous} />

      <GapPickerTabs
        suggestedGaps={suggestedGaps}
        curriculumGaps={curriculumGaps}
        selectedGaps={selectedGaps}
        onToggle={handleToggle}
      />

      <div className="mb-8 flex flex-col gap-6 rounded-xl border border-border-subtle bg-surface-sunken p-4">
        <DurationSelector value={durationDays} onChange={setDurationDays} disabled={isActivating} />
        <SprintPlanPreview durationDays={durationDays} />
      </div>

      <SetupActivationBar
        selectedGaps={selectedGaps}
        isActivating={isActivating}
        stageLabel={stageLabel}
        errorMessage={errorMessage}
        onActivate={() => activate(selectedGaps, durationDays)}
      />
    </div>
  )
}
