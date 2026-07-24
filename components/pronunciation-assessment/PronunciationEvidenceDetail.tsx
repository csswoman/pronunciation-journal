import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'

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

function measurementSummary(result: TargetResult): string {
  const { measurement } = result
  if (measurement.kind === 'scored') return `Puntaje interno: ${measurement.score}/100`
  if (measurement.kind === 'failed') return `No se pudo medir (${measurement.failureReason})`
  return `Sin medir (${measurement.abstentionReason})`
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
                      <span className="font-ipa font-normal text-fg-muted">({ipaHint})</span>
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
