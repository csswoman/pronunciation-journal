'use client'

import { useEffect, useRef } from 'react'
import { RefreshCw } from '@/components/icons'
import Anchor from '@/components/ui/Anchor'
import type { PronunciationDiagnosticResult } from '@/lib/pronunciation/assessment/schema'
import { PronunciationEvidenceDetail } from './PronunciationEvidenceDetail'
import { PronunciationFiveDayPlan } from './PronunciationFiveDayPlan'
import { PronunciationPriorityCard } from './PronunciationPriorityCard'

interface PronunciationResultsProps {
  result: PronunciationDiagnosticResult
  saving: boolean
  saveError: boolean
  onRetrySave: () => void
}

/**
 * Results screen for the pronunciation diagnostic (plan 067, step 7).
 * Progressive disclosure, Spanish chrome, no leading aggregate score:
 *   1. "Qué trabajar primero" — up to 3 priority targets, each a direct CTA.
 *   2. Five-day plan — the generated prescription sessions.
 *   3. Evidence detail — full per-target breakdown, collapsed by default.
 */
export function PronunciationResults({ result, saving, saveError, onRetrySave }: PronunciationResultsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const priorities = result.targetResults.filter((r) => r.status === 'priority')

  return (
    <section aria-label="Resultado del diagnóstico de pronunciación" className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">Diagnóstico completo</p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-[15px] font-semibold text-[var(--text-primary)] outline-none"
        >
          {priorities.length > 0
            ? 'Esto es lo que conviene trabajar primero'
            : 'Buen trabajo — no encontramos prioridades urgentes'}
        </h1>
      </header>

      {priorities.length > 0 && (
        <ul className="flex flex-col gap-3">
          {priorities.map((result, index) => (
            <PronunciationPriorityCard key={result.targetId} result={result} rank={index + 1} />
          ))}
        </ul>
      )}

      <section aria-label="Plan de cinco días" className="flex flex-col gap-2">
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Tu plan de cinco días</h2>
        <PronunciationFiveDayPlan sessions={result.prescription.sessions} />
      </section>

      <PronunciationEvidenceDetail targetResults={result.targetResults} />

      {saving && (
        <p role="status" aria-live="polite" className="text-[13px] text-[var(--text-secondary)]">
          Guardando resultado…
        </p>
      )}
      {saveError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-[var(--error)] bg-[var(--error-soft)] p-3 text-[13px] text-[var(--error)]"
        >
          <span>No se pudo guardar el resultado.</span>
          <button
            type="button"
            onClick={onRetrySave}
            className="inline-flex items-center gap-1 font-semibold underline"
          >
            <RefreshCw size={14} aria-hidden />
            Reintentar
          </button>
        </div>
      )}

      <Anchor href="/practice/sounds" color="primary">
        Ir a mi práctica
      </Anchor>
    </section>
  )
}
