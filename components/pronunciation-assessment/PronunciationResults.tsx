'use client'

import { useEffect, useRef } from 'react'
import { RefreshCw } from '@/components/icons'
import Anchor from '@/components/ui/Anchor'
import Button from '@/components/ui/Button'
import type { PronunciationDiagnosticResult } from '@/lib/pronunciation/assessment/schema'
import { isPronunciationDiagnosticCopyEnabled } from '@/lib/pronunciation/assessment/copy-flag'
import { PronunciationEvidenceDetail } from './PronunciationEvidenceDetail'
import { PronunciationFiveDayPlan } from './PronunciationFiveDayPlan'
import { PronunciationPriorityCard } from './PronunciationPriorityCard'

interface PronunciationResultsProps {
  result: PronunciationDiagnosticResult
  saving: boolean
  saveError: boolean
  onRetrySave: () => void
  copyEnabled?: boolean
}

function resultsHeading(
  priorities: number,
  hasMeasuredEvidence: boolean,
  copyEnabled: boolean
): string {
  if (!copyEnabled) return 'Tu siguiente práctica está lista'
  if (priorities > 0) return 'Esto es lo que conviene trabajar primero'
  if (!hasMeasuredEvidence) {
    return 'Aún no pudimos medir lo suficiente'
  }
  return 'No hay prioridades urgentes ahora'
}

function resultsSupport(
  priorities: number,
  hasMeasuredEvidence: boolean,
  copyEnabled: boolean
): string | null {
  if (!copyEnabled) return null
  if (priorities > 0) return null
  if (!hasMeasuredEvidence) {
    return 'Estos son focos para seguir practicando y reunir evidencia — no un veredicto final.'
  }
  return 'Tu plan de cinco días te da un camino claro para seguir.'
}

/**
 * Results screen for the pronunciation diagnostic (plan 067, step 7).
 * Progressive disclosure, Spanish chrome, no leading aggregate score.
 * Uses h2 because PageHeader already owns the page h1.
 */
export function PronunciationResults({ result, saving, saveError, onRetrySave, copyEnabled }: PronunciationResultsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const priorities = result.targetResults.filter((r) => r.status === 'priority')
  const hasMeasuredEvidence = result.targetResults.some(
    (r) => r.measurement.kind === 'scored' || r.status === 'observed' || r.status === 'strength'
  )
  const shouldShowDiagnosticCopy = copyEnabled ?? isPronunciationDiagnosticCopyEnabled()
  const support = resultsSupport(priorities.length, hasMeasuredEvidence, shouldShowDiagnosticCopy)

  return (
    <section
      aria-label="Resultado del diagnóstico de pronunciación"
      className="flex min-w-0 flex-col gap-8"
    >
      <header className="flex min-w-0 flex-col gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-balance text-pretty break-words text-h3 text-fg outline-none"
        >
          {resultsHeading(priorities.length, hasMeasuredEvidence, shouldShowDiagnosticCopy)}
        </h2>
        {support ? (
          <p className="max-w-prose text-pretty font-body-sm text-fg-muted">{support}</p>
        ) : null}
      </header>

      {shouldShowDiagnosticCopy && priorities.length > 0 && (
        <ul className="flex min-w-0 flex-col gap-3">
          {priorities.map((priorityResult, index) => (
            <PronunciationPriorityCard
              key={priorityResult.targetId}
              result={priorityResult}
              rank={index + 1}
            />
          ))}
        </ul>
      )}

      <section aria-label="Plan de cinco días" className="flex min-w-0 flex-col gap-3">
        <h3 className="text-pretty font-h4 text-fg">Tu plan de cinco días</h3>
        <PronunciationFiveDayPlan sessions={result.prescription.sessions} />
      </section>

      <PronunciationEvidenceDetail
        targetResults={result.targetResults}
        copyEnabled={shouldShowDiagnosticCopy}
      />

      {saving && (
        <p role="status" aria-live="polite" className="font-body-sm text-fg-muted">
          Guardando resultado…
        </p>
      )}
      {saveError && (
        <div
          role="alert"
          className="flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-error bg-error-soft p-3 font-body-sm text-error"
        >
          <span className="min-w-0 text-pretty">No se pudo guardar el resultado.</span>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={onRetrySave}
            icon={<RefreshCw size={14} aria-hidden />}
          >
            Reintentar
          </Button>
        </div>
      )}

      <Anchor
        href="/practice/sounds"
        color="unstyled"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-cta-bg px-5 font-label text-cta-fg no-underline transition-colors duration-150 ease-out-quart hover:bg-[var(--cta-bg-hover)] hover:no-underline"
      >
        Ir a mi práctica
      </Anchor>
    </section>
  )
}
