import { getTarget } from '@/lib/pronunciation/targets/registry'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'

interface PronunciationEvidenceDetailProps {
  targetResults: readonly TargetResult[]
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
 * Full per-target evidence breakdown — the last, most detailed layer of
 * progressive disclosure on the results screen. Wrapped in a native
 * `<details>` so it stays collapsed by default (plan 067, step 7: "evidence
 * detail" comes after the priority list and five-day plan, not before).
 */
export function PronunciationEvidenceDetail({ targetResults }: PronunciationEvidenceDetailProps) {
  return (
    <details className="rounded-md border border-[var(--border-default)] bg-[var(--surface-raised)] p-4">
      <summary className="cursor-pointer text-[14px] font-semibold text-[var(--text-primary)]">
        Ver todo lo que medimos
      </summary>
      <ul className="mt-3 flex flex-col gap-2">
        {targetResults.map((result) => {
          const lookup = getTarget(result.targetId)
          const label = lookup.ok ? lookup.target.label : result.targetId
          return (
            <li
              key={result.targetId}
              className="flex flex-col gap-0.5 border-t border-[var(--border-default)] pt-2 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-[var(--text-primary)]">{label}</span>
                <span className="text-[12px] text-[var(--text-secondary)]">{STATUS_LABEL[result.status]}</span>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)]">
                {measurementSummary(result)} · confianza {Math.round(result.confidence * 100)}%
              </p>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
