import Anchor from '@/components/ui/Anchor'
import { getTarget } from '@/lib/pronunciation/targets/registry'
import { targetIdToPracticeRoute } from '@/lib/pronunciation/target-route'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'

interface PronunciationPriorityCardProps {
  result: TargetResult
  rank: number
}

/**
 * One "qué trabajar primero" card — a single priority target with a direct
 * CTA to practice it. Leads the results screen (plan 067, step 7); never
 * shows a raw numeric score, only the target label and a short reason.
 */
export function PronunciationPriorityCard({ result, rank }: PronunciationPriorityCardProps) {
  const lookup = getTarget(result.targetId)
  const label = lookup.ok ? lookup.target.label : result.targetId
  const route = targetIdToPracticeRoute(result.targetId)

  return (
    <li className="flex flex-col gap-2 rounded-md border border-[var(--border-default)] bg-[var(--surface-raised)] p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--cta-bg)] text-[13px] font-semibold text-[var(--cta-fg)]">
          {rank}
        </span>
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{label}</h3>
      </div>
      {route ? (
        <Anchor href={route} color="primary">
          Practicar ahora
        </Anchor>
      ) : (
        <p className="text-[13px] text-[var(--text-secondary)]">
          Este objetivo se trabaja en tu plan de cinco días más abajo.
        </p>
      )}
    </li>
  )
}
