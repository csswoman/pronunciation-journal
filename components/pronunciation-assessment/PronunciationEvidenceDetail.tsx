import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { isSelfReportStruggle } from '@/lib/pronunciation/assessment/self-report-signal'
import type {
  AbstentionReason,
  FailureReason,
  TargetResult,
} from '@/lib/pronunciation/assessment/types'

interface PronunciationEvidenceDetailProps {
  targetResults: readonly TargetResult[]
  copyEnabled?: boolean
}

const STATUS_LABEL: Record<TargetResult['status'], string> = {
  priority: 'Prioridad',
  observed: 'Observado',
  needs_evidence: 'Falta evidencia',
  strength: 'Fortaleza',
}

const ABSTENTION_LABEL: Record<AbstentionReason, string> = {
  skipped_by_user: 'La saltaste',
  no_evaluator_available: 'No había evaluador disponible',
  mic_permission_denied: 'El micrófono no tenía permiso',
  stt_unavailable: 'El reconocimiento de voz no estaba disponible',
  browser_unsupported: 'Este navegador no soporta la medición',
}

const FAILURE_LABEL: Record<FailureReason, string> = {
  stt_error: 'Falló el reconocimiento de voz',
  empty_transcript: 'No capturamos palabras claras',
  mic_error: 'Hubo un problema con el micrófono',
  timeout: 'Se agotó el tiempo de espera',
  unknown_error: 'No se pudo medir esta vez',
}

function measurementSummary(result: TargetResult): string {
  const { measurement } = result
  if (measurement.kind === 'scored') {
    if (measurement.score < 50) return 'Señal débil en esta prueba'
    if (measurement.score < 75) return 'Señal mixta: conviene seguir practicando'
    return 'Señal clara en esta prueba'
  }
  if (measurement.kind === 'failed') {
    return FAILURE_LABEL[measurement.failureReason] ?? 'No se pudo medir esta vez'
  }
  if (measurement.abstentionReason === 'skipped_by_user') {
    return ABSTENTION_LABEL.skipped_by_user
  }
  if (result.signalType === 'self_report') {
    return isSelfReportStruggle(result)
      ? 'Nos dijiste que te cuesta'
      : 'Nos dijiste que te desenvuelves bien'
  }
  return ABSTENTION_LABEL[measurement.abstentionReason] ?? 'Aún no hay evidencia suficiente'
}

/**
 * Collapsed-by-default evidence layer. Flat details — no raised card chrome
 * competing with priority CTAs above.
 */
export function PronunciationEvidenceDetail({ targetResults, copyEnabled = true }: PronunciationEvidenceDetailProps) {
  return (
    <details className="min-w-0 border-t border-border-subtle pt-4">
      <summary className="cursor-pointer font-label text-fg">
        {copyEnabled ? 'Ver todo lo que medimos' : 'Registro del diagnóstico'}
      </summary>
      <ul className="mt-3 flex min-w-0 flex-col gap-3">
        {targetResults.map((result) => {
          const { title, ipaHint } = getLearnerTargetCopy(result.targetId)
          return (
            <li key={result.targetId} className="flex min-w-0 flex-col gap-0.5">
              <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                <span className="min-w-0 text-pretty break-words font-body-sm font-medium text-fg">
                  {title}
                  {ipaHint ? (
                    <>
                      {' '}
                      <span className="font-ipa font-normal text-fg-muted" aria-label={title}>
                        ({ipaHint})
                      </span>
                    </>
                  ) : null}
                </span>
                {copyEnabled && (
                  <span className="shrink-0 font-caption text-fg-subtle">
                    {STATUS_LABEL[result.status]}
                  </span>
                )}
              </div>
              <p className="text-pretty break-words font-caption text-fg-muted">
                {copyEnabled ? measurementSummary(result) : 'Evidencia guardada para una próxima práctica.'}
              </p>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
