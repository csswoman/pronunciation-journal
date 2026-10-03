'use client'

// Planned structure:
// <FocusSetup>
//   <PageLayout archetype="catalog">
//     <PageHeader />                 (título cambia por paso)
//     <SetupStepIndicator />
//     ── Paso 1: focus (se oculta, no se desmonta, para conservar pestaña/diagnóstico)
//     <SetupHeader />
//     <SkillsRadarPreview />
//     <LimitNotice />
//     <SelectedGapsChips />
//     <GapPickerTabs />
//     ── Paso 2: plan
//     <SelectedGapsChips onEdit />
//     <DurationSelector />
//     <SprintPlanPreview />
//     ──
//     <SetupActivationBar />         (Continuar en paso 1, Activar en paso 2)
//   </PageLayout>
// </FocusSetup>

import { useState } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import { SetupHeader } from './SetupHeader'
import { SkillsRadarPreview } from './SkillsRadarPreview'
import { GapPickerTabs } from './GapPickerTabs'
import { SprintPlanPreview } from './SprintPlanPreview'
import { DurationSelector } from './DurationSelector'
import { SetupActivationBar } from './SetupActivationBar'
import { SelectedGapsChips } from './SelectedGapsChips'
import { SetupStepIndicator, type SetupStep } from './SetupStepIndicator'
import { useSprintActivation } from '@/hooks/useSprintActivation'
import { setupSubtitle } from '@/lib/focus/setup-copy'
import type { GapSuggestion } from '@/lib/focus/gap-suggestions'
import type { SprintGap } from '@/lib/focus/types'

interface FocusSetupProps {
  userId: string
  isAnonymous?: boolean
  suggestedGaps: GapSuggestion[]
  curriculumGaps: SprintGap[]
}

const TITLE_BY_STEP: Record<SetupStep, string> = {
  focus: '¿Qué quieres dominar?',
  plan: '¿Cuántos días le dedicas?',
}

export function FocusSetup({ userId, isAnonymous = false, suggestedGaps, curriculumGaps }: FocusSetupProps) {
  const [selectedGaps, setSelectedGaps] = useState<SprintGap[]>([])
  const [durationDays, setDurationDays] = useState(7)
  const [limitNotice, setLimitNotice] = useState<string | null>(null)
  const [requestedStep, setRequestedStep] = useState<SetupStep>('focus')
  const { activate, isActivating, stageLabel, errorMessage } = useSprintActivation(userId)

  // Sin focos no hay plan que mostrar: se vuelve al paso 1 aunque se pidiera el 2.
  const step: SetupStep = selectedGaps.length === 0 ? 'focus' : requestedStep

  const goTo = (next: SetupStep) => {
    setRequestedStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
    <PageLayout archetype="catalog" className="mx-auto max-w-5xl pb-4 lg:pb-24">
      <PageHeader
        kicker="MODO FOCO"
        title={TITLE_BY_STEP[step]}
        subtitle={step === 'plan' ? setupSubtitle(step, selectedGaps.length, durationDays) : undefined}
      />
      <SetupStepIndicator step={step} />

      <div hidden={step !== 'focus'}>
        <SetupHeader isAnonymous={isAnonymous} />
        <SkillsRadarPreview enabled={!isAnonymous} />

        {limitNotice && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 ts-body text-warning shadow-xs"
          >
            <span>{limitNotice}</span>
            <button
              type="button"
              onClick={() => setLimitNotice(null)}
              className="cursor-pointer ts-button underline hover:opacity-80"
            >
              Entendido
            </button>
          </div>
        )}

        <SelectedGapsChips gaps={selectedGaps} onRemove={handleToggle} />
        <GapPickerTabs
          suggestedGaps={suggestedGaps}
          curriculumGaps={curriculumGaps}
          selectedGaps={selectedGaps}
          onToggle={handleToggle}
        />
      </div>

      {step === 'plan' && (
        <div className="mb-10 flex flex-col gap-6">
          <SelectedGapsChips gaps={selectedGaps} onRemove={handleToggle} onEdit={() => goTo('focus')} />
          <DurationSelector value={durationDays} onChange={setDurationDays} disabled={isActivating} />
          <SprintPlanPreview gaps={selectedGaps} durationDays={durationDays} />
        </div>
      )}

      <SetupActivationBar
        step={step}
        durationDays={durationDays}
        selectedGaps={selectedGaps}
        isActivating={isActivating}
        stageLabel={stageLabel}
        errorMessage={errorMessage}
        onBack={() => goTo('focus')}
        onPrimary={() => (step === 'focus' ? goTo('plan') : activate(selectedGaps, durationDays))}
      />
    </PageLayout>
  )
}
