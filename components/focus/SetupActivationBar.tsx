'use client'

// Planned structure:
// <SetupActivationBar>
//   <ErrorMessageBanner />
//   <FloatingCapsuleBar>
//     <BackButton />           (solo paso 2)
//     <PillSelectionCount />
//     <SummaryText />
//     <PrimaryButton />        (textos por estado: lib/focus/setup-copy.ts)
//   </FloatingCapsuleBar>
// </SetupActivationBar>

import type { SprintGap } from '@/lib/focus/types'
import { activationSummary, primaryActionLabel } from '@/lib/focus/setup-copy'
import type { SetupStep } from './SetupStepIndicator'

interface SetupActivationBarProps {
  step: SetupStep
  durationDays: number
  selectedGaps: SprintGap[]
  isActivating: boolean
  stageLabel: string | null
  errorMessage: string | null
  onBack: () => void
  onPrimary: () => void
}

/**
 * Resumen de selección y acción principal del setup, como cápsula flotante
 * al pie de la pantalla. En el paso 1 avanza; en el paso 2 activa el sprint.
 */
export function SetupActivationBar({
  step,
  durationDays,
  selectedGaps,
  isActivating,
  stageLabel,
  errorMessage,
  onBack,
  onPrimary,
}: SetupActivationBarProps) {
  const count = selectedGaps.length
  const isDisabled = count === 0 || isActivating
  const primaryLabel = primaryActionLabel(step, count, durationDays, stageLabel)
  const summary = activationSummary(step, selectedGaps, durationDays)

  return (
    <div className="pointer-events-none sticky bottom-4 z-30 mt-6 flex flex-col gap-3">
      {errorMessage && (
        <div className="pointer-events-auto mx-auto w-full max-w-5xl rounded-2xl border border-error-soft bg-error-soft p-3.5 text-body-sm text-error shadow-lg">
          {errorMessage}
        </div>
      )}

      <div className="pointer-events-auto mx-auto flex w-full max-w-5xl items-center justify-between gap-4 rounded-full border border-cta-fg/10 bg-cta-bg p-3 px-6 text-cta-fg shadow-2xl">
        <div className="flex min-w-0 items-center gap-3">
          {step === 'plan' && (
            <button
              type="button"
              onClick={onBack}
              disabled={isActivating}
              className="focus-ring shrink-0 cursor-pointer rounded-full px-2 py-1 text-body-sm font-semibold text-cta-fg/70 hover:text-cta-fg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span aria-hidden="true">← </span>Atrás
            </button>
          )}
          <span className="flex shrink-0 items-center justify-center rounded-full border border-dashed border-cta-fg/30 px-3.5 py-1 font-display text-body-sm font-extrabold">
            {count}/2
          </span>
          <div className="flex min-w-0 items-center gap-2 truncate">
            <span className="truncate text-body-sm font-semibold">{summary.headline}</span>
            {summary.hint && (
              <span className="hidden shrink-0 text-tiny font-normal text-cta-fg/60 sm:inline">{summary.hint}</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onPrimary}
          disabled={isDisabled}
          className="focus-ring flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-cta-fg/20 bg-cta-fg/15 px-6 py-2.5 font-display text-body-sm font-bold text-cta-fg transition-all hover:bg-cta-fg/25 active:bg-cta-fg/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>{primaryLabel}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}
