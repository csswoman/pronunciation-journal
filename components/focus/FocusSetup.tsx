'use client'

// Planned structure:
// <FocusSetup>
//   <PageLayout archetype="session">
//     <PageHeader />
//     <SetupHeader /> (aviso invitado)
//     <SkillsRadarPreview />
//     <SelectedGapsSummary />
//     <GapPickerTabs />
//     <DurationSelector />
//     <SprintPlanPreview />
//     <SetupActivationBar />
//   </PageLayout>
// </FocusSetup>

import { useState } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import { X } from '@/components/icons'
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
  const [limitNotice, setLimitNotice] = useState<string | null>(null)
  const { activate, isActivating, stageLabel, errorMessage } = useSprintActivation(userId)

  const handleToggle = (gap: SprintGap) => {
    setSelectedGaps((prev) => {
      const exists = prev.some((g) => g.targetId === gap.targetId)
      if (exists) {
        setLimitNotice(null)
        return prev.filter((g) => g.targetId !== gap.targetId)
      }
      if (prev.length >= 2) {
        setLimitNotice('Máximo 2 focos por sprint. Desmarca uno para elegir otro.')
        return prev
      }
      setLimitNotice(null)
      return [...prev, gap]
    })
  }

  return (
    <PageLayout archetype="session">
      <PageHeader
        kicker="Modo Foco"
        title="Elige tus focos de estudio"
        subtitle="Selecciona hasta 2 áreas que quieras dominar. Crearemos historias, ejercicios y diálogos guiados durante tu sprint."
      />

      <SetupHeader isAnonymous={isAnonymous} />

      <SkillsRadarPreview enabled={!isAnonymous} />

      {limitNotice && (
        <div
          role="status"
          className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-body-sm text-warning"
        >
          <span>{limitNotice}</span>
          <button
            type="button"
            onClick={() => setLimitNotice(null)}
            className="text-tiny font-medium underline hover:opacity-80"
          >
            Entendido
          </button>
        </div>
      )}

      {selectedGaps.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border-default bg-surface-raised p-3.5 shadow-xs">
          <span className="text-tiny font-semibold uppercase tracking-wider text-fg-subtle">
            Focos seleccionados ({selectedGaps.length}/2):
          </span>
          {selectedGaps.map((gap) => (
            <button
              key={gap.targetId}
              type="button"
              onClick={() => handleToggle(gap)}
              className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary-soft px-3 py-1 text-body-sm font-medium text-primary transition-colors hover:opacity-85"
              title={`Quitar ${gap.label}`}
            >
              <span>{gap.label}</span>
              <X className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      <GapPickerTabs
        suggestedGaps={suggestedGaps}
        curriculumGaps={curriculumGaps}
        selectedGaps={selectedGaps}
        onToggle={handleToggle}
      />

      <div className="mb-8 flex flex-col gap-6">
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
    </PageLayout>
  )
}

