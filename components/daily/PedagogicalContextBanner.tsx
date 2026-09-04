'use client'

import type { SessionArc } from '@/lib/practice/types'
import { Sparkles } from '@/components/icons'

interface Props {
  arc?: SessionArc
}

export function PedagogicalContextBanner({ arc }: Props) {
  if (!arc) return null
  const { diagnosticPrescription, journalRepairs } = arc
  if (!diagnosticPrescription && !journalRepairs) return null

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border-default bg-surface-raised text-body-sm shadow-xs mb-3">
      <div className="flex items-center gap-1.5 font-semibold text-primary">
        <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
        <span>Foco personalizado:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {diagnosticPrescription && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft text-primary px-2.5 py-0.5 text-caption font-medium border border-primary/20">
            🎯 Diagnóstico día {diagnosticPrescription.dayIndex}/{diagnosticPrescription.totalDays}: {diagnosticPrescription.soundIpa}
          </span>
        )}

        {journalRepairs && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken text-fg px-2.5 py-0.5 text-caption font-medium border border-border-subtle">
            🔄 Reparación de {journalRepairs.count} {journalRepairs.count === 1 ? 'error del Journal' : 'errores del Journal'}
          </span>
        )}
      </div>
    </div>
  )
}
