'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type PhonemeFocusFeedback = {
  isCorrect: boolean
  subtitle?: string
  onContinue?: () => void
}

interface Props {
  /** IPA or short label shown in the top bar (e.g. /iː/, Hoy, Repaso). */
  badge: string
  progressPct: number
  onExit: () => void
  children: ReactNode
  feedback?: PhonemeFocusFeedback | null
  footer?: ReactNode
}

export function PhonemeFocusShell({
  badge,
  progressPct,
  onExit,
  children,
  feedback,
  footer,
}: Props) {
  return (
    <div className="phoneme-focus">
      <div className="phoneme-focus__phone">
          <div className="phoneme-focus__topbar">
            <button
              type="button"
              className="phoneme-focus__exit"
              onClick={onExit}
              aria-label="Salir de la práctica"
            >
              ✕
            </button>
            <div
              className="phoneme-focus__progress"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso de la sesión"
            >
              <span style={{ width: `${progressPct}%` }} />
            </div>
            <span
              className={cn(
                'phoneme-focus__badge',
                !badge.startsWith('/') && 'phoneme-focus__badge--text',
              )}
            >
              {badge}
            </span>
          </div>

          <div className="phoneme-focus__stage">{children}</div>

          {feedback && (
            <div
              className={cn(
                'phoneme-focus__footer',
                feedback.isCorrect ? 'phoneme-focus__footer--ok' : 'phoneme-focus__footer--bad',
              )}
              role="status"
              aria-live="polite"
            >
              <div className="phoneme-focus__fb">
                <span className="phoneme-focus__fb-icon" aria-hidden>
                  {feedback.isCorrect ? '✓' : '✕'}
                </span>
                <div className="phoneme-focus__fb-text">
                  <b>{feedback.isCorrect ? '¡Correcto!' : 'No exactamente'}</b>
                  {feedback.subtitle && <span>{feedback.subtitle}</span>}
                </div>
              </div>
              {feedback.onContinue && (
                <button
                  type="button"
                  className={cn(
                    'phoneme-focus__footer-cta',
                    feedback.isCorrect ? 'phoneme-focus__footer-cta--ok' : 'phoneme-focus__footer-cta--bad',
                  )}
                  onClick={feedback.onContinue}
                >
                  Continuar
                </button>
              )}
            </div>
          )}

          {footer}
        </div>
    </div>
  )
}
