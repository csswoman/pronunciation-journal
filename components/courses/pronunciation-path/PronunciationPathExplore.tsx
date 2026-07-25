import Link from 'next/link'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { targetIdToPronunciationPathRoute } from '@/lib/pronunciation/path/routes'
import type { PathStage, UnitLearningState } from '@/lib/pronunciation/path/types'

interface PronunciationPathExploreProps {
  stages: readonly PathStage[]
  unitStates: ReadonlyMap<string, UnitLearningState>
  activeTargetId: string | null
}

export function PronunciationPathExplore({
  stages,
  unitStates,
  activeTargetId,
}: PronunciationPathExploreProps) {
  return (
    <details className="min-w-0 rounded-md border border-border bg-surface">
      <summary className="min-h-11 cursor-pointer list-none px-4 py-3 font-label text-fg marker:content-none [&::-webkit-details-marker]:hidden">
        Explorar todas las unidades
      </summary>
      <div className="flex min-w-0 flex-col gap-4 border-t border-border px-4 py-3">
        {stages.map((stage) => (
          <section key={stage.id} className="flex min-w-0 flex-col gap-2">
            <h3 className="font-label text-fg">{stage.titleEs}</h3>
            <ul className="flex min-w-0 flex-col gap-1">
              {stage.units.map((unit) => {
                const { title } = getLearnerTargetCopy(unit.targetId)
                const isActive = unit.targetId === activeTargetId
                return (
                  <li key={unit.targetId}>
                    <Link
                      href={targetIdToPronunciationPathRoute(unit.targetId)}
                      aria-current={isActive ? 'page' : undefined}
                      className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-sm px-2 font-body-sm text-fg hover:bg-surface-elevated"
                    >
                      <span className="min-w-0 truncate">{title}</span>
                      <span className="shrink-0 font-caption text-fg-subtle">
                        {unitStates.get(unit.targetId) ?? 'not_started'}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </details>
  )
}
