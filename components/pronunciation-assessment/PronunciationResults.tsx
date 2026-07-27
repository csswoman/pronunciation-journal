'use client'

import { useEffect, useRef } from 'react'
import { RefreshCw } from '@/components/icons'
import Anchor from '@/components/ui/Anchor'
import Button from '@/components/ui/Button'
import type { PronunciationDiagnosticResult } from '@/lib/pronunciation/assessment/schema'
import { isPronunciationDiagnosticCopyEnabled } from '@/lib/pronunciation/assessment/copy-flag'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { pickSelfReportStruggle } from '@/lib/pronunciation/assessment/self-report-signal'
import { targetIdToPronunciationPathRoute } from '@/lib/pronunciation/path/routes'
import { PronunciationEvidenceDetail } from './PronunciationEvidenceDetail'
import { PronunciationFiveDayPlan } from './PronunciationFiveDayPlan'
import { PronunciationPriorityCard } from './PronunciationPriorityCard'

interface PronunciationResultsProps {
  result: PronunciationDiagnosticResult
  saving: boolean
  saveError: boolean
  onRetrySave: () => void
  onRestart?: () => void
  copyEnabled?: boolean
}

const PATH_FALLBACK = '/courses/pronunciation'

function resultsHeading(
  priorities: number,
  hasMeasuredEvidence: boolean,
  struggleTitle: string | null,
  copyEnabled: boolean
): string {
  if (!copyEnabled) return 'Tu siguiente práctica está lista'
  if (priorities > 0) return 'Esto es lo que conviene trabajar primero'
  if (struggleTitle) return 'Empecemos por lo que nos dijiste'
  if (!hasMeasuredEvidence) {
    return 'Empecemos por reunir evidencia'
  }
  return 'No hay prioridades urgentes ahora'
}

function resultsSupport(
  priorities: number,
  hasMeasuredEvidence: boolean,
  struggleTitle: string | null,
  copyEnabled: boolean
): string | null {
  if (!copyEnabled) return null
  if (priorities > 0) return null
  if (struggleTitle) {
    return `Nos dijiste que te cuesta: ${struggleTitle}. No es un veredicto — es un buen punto de partida.`
  }
  if (!hasMeasuredEvidence) {
    return 'Aún no medimos lo suficiente para un veredicto. Aquí va una invitación concreta para empezar — no una lista de deberes.'
  }
  return 'Tu plan de la semana te da un camino claro para seguir.'
}

/**
 * Results screen for the pronunciation diagnostic (plan 067, step 7).
 * Progressive disclosure, Spanish chrome, no leading aggregate score.
 * Owns the page h1 when the stage chrome uses a quieter header.
 */
export function PronunciationResults({
  result,
  saving,
  saveError,
  onRetrySave,
  onRestart,
  copyEnabled,
}: PronunciationResultsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const priorities = result.targetResults.filter((r) => r.status === 'priority')
  const hasMeasuredEvidence = result.targetResults.some(
    (r) => r.measurement.kind === 'scored' || r.status === 'observed' || r.status === 'strength'
  )
  const struggle = pickSelfReportStruggle(result.targetResults)
  const struggleTitle = struggle ? getLearnerTargetCopy(struggle.targetId).title : null
  const shouldShowDiagnosticCopy = copyEnabled ?? isPronunciationDiagnosticCopyEnabled()
  const support = resultsSupport(
    priorities.length,
    hasMeasuredEvidence,
    struggleTitle,
    shouldShowDiagnosticCopy
  )
  const evidenceLight = shouldShowDiagnosticCopy && !hasMeasuredEvidence && priorities.length === 0
  const planTitle = evidenceLight ? 'Por dónde empezar' : 'Tu plan de la semana'
  const primaryCtaLabel = evidenceLight ? 'Empezar a practicar' : 'Ir a mi práctica'
  // Older saved results can still contain a session generated for a target
  // whose evaluator abstained. Do not render that capability gap as a task.
  const unavailableTargetIds = new Set(
    result.targetResults
      .filter(
        (targetResult) =>
          targetResult.measurement.kind === 'not_measured' &&
          targetResult.measurement.abstentionReason === 'no_evaluator_available' &&
          targetResult.signalType !== 'self_report'
      )
      .map((targetResult) => targetResult.targetId)
  )
  const displaySessions = result.prescription.sessions.filter(
    (session) => !unavailableTargetIds.has(session.targetId)
  )
  const dayOneTargetId = displaySessions[0]?.targetId
  const primaryHref = dayOneTargetId
    ? targetIdToPronunciationPathRoute(dayOneTargetId)
    : PATH_FALLBACK

  return (
    <section
      aria-label="Resultado del diagnóstico de pronunciación"
      className="flex min-w-0 flex-col gap-[var(--layout-section-gap)]"
    >
      <header className="flex min-w-0 flex-col gap-2">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-balance text-pretty break-words text-h3 text-fg outline-none"
        >
          {resultsHeading(
            priorities.length,
            hasMeasuredEvidence,
            struggleTitle,
            shouldShowDiagnosticCopy
          )}
        </h1>
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

      <section aria-label={planTitle} className="flex min-w-0 flex-col gap-3">
        <h2 className="text-pretty font-h4 text-fg">{planTitle}</h2>
        <PronunciationFiveDayPlan
          sessions={displaySessions}
          evidenceLight={evidenceLight}
        />
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

      <div className="flex min-w-0 flex-col gap-2">
        <Anchor
          href={primaryHref}
          color="unstyled"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-cta-bg px-5 font-label text-cta-fg no-underline transition-colors duration-150 ease-out-quart hover:bg-cta-bg-hover hover:text-cta-fg hover:no-underline"
        >
          {primaryCtaLabel}
        </Anchor>
        {onRestart ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 text-fg-subtle"
            onClick={onRestart}
          >
            Repetir el diagnóstico
          </Button>
        ) : null}
      </div>
    </section>
  )
}
