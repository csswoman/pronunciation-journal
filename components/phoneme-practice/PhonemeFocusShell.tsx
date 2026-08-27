'use client'

// Planned structure:
// <PhonemeFocusShell>
//   <TopChrome>
//     <ExitButton />
//     <ProgressBar />
//     <StepCounter />
//   </TopChrome>
//   <CenterStage>
//     <SessionCard>
//       {children}
//       <FeedbackBanner />
//     </SessionCard>
//   </CenterStage>
//   {footer}
// </PhonemeFocusShell>

import type { ReactNode } from 'react'
import { X, Check } from '@/components/icons'
import { cn } from '@/lib/cn'
import Button from '@/components/ui/Button'

export type PhonemeFocusFeedback = {
  isCorrect: boolean
  subtitle?: string
  onContinue?: () => void
}

interface Props {
  /** IPA symbol shown in the top bar if needed (deprecated in favor of card kicker). */
  badge?: string
  /** Session name shown below the topbar if needed. */
  sessionName?: string
  progressPct: number
  stepCurrent?: number
  stepTotal?: number
  progressLabel?: string
  onExit: () => void
  children: ReactNode
  feedback?: PhonemeFocusFeedback | null
  footer?: ReactNode
}

export function PhonemeFocusShell({
  progressPct,
  stepCurrent,
  stepTotal,
  progressLabel,
  onExit,
  children,
  feedback,
  footer,
}: Props) {
  const current = stepCurrent ?? Math.max(1, Math.round((progressPct / 100) * (stepTotal ?? 1)))
  const total = stepTotal ?? 1
  const pct = Math.min(100, Math.max(0, Math.round(progressPct)))

  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-layout-session-max flex-col gap-layout-stack px-4 py-4 sm:py-6">
      {/* Top Chrome matching Essential Words */}
      <header className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={onExit}
          aria-label="Salir de la práctica"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-fg-subtle transition-colors duration-150 ease-out-quart focus-ring hover:bg-surface-raised hover:text-fg-muted cursor-pointer"
        >
          <X size={16} aria-hidden />
        </button>

        <div
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={progressLabel ?? `Paso ${current} de ${total}`}
          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-sunken"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out-quart"
            style={{ width: `${pct}%` }}
          />
        </div>

        <span className="shrink-0 font-caption tabular-nums text-fg-muted">
          {current} / {total}
        </span>
      </header>

      {/* Main Center Stage with Card Container */}
      <main className="flex flex-1 flex-col items-center justify-center w-full">
        <div className="flex w-full flex-col rounded-2xl border border-border-subtle bg-surface-raised p-6 sm:p-8 shadow-xs gap-6">
          {children}

          {feedback && (
            <div
              className={cn(
                'flex items-center justify-between gap-4 rounded-xl border p-4 transition-all',
                feedback.isCorrect
                  ? 'border-success-border bg-success-soft text-success'
                  : 'border-error-border bg-error-soft text-error',
              )}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    feedback.isCorrect
                      ? 'bg-success/20 text-success'
                      : 'bg-error/20 text-error',
                  )}
                >
                  {feedback.isCorrect ? (
                    <Check size={16} aria-hidden />
                  ) : (
                    <X size={16} aria-hidden />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-body-sm font-semibold">
                    {feedback.isCorrect ? '¡Correcto!' : 'No exactamente'}
                  </span>
                  {feedback.subtitle && (
                    <span className="text-caption text-fg-muted">
                      {feedback.subtitle}
                    </span>
                  )}
                </div>
              </div>

              {feedback.onContinue && (
                <Button
                  variant={feedback.isCorrect ? 'primary' : 'secondary'}
                  size="md"
                  onClick={feedback.onContinue}
                >
                  Continuar
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      {footer}
    </div>
  )
}
