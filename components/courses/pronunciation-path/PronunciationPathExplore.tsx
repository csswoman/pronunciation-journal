import Link from 'next/link'
import { ChevronDown } from '@/components/icons'
import { cn } from '@/lib/cn'
import Badge from '@/components/ui/Badge'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { targetIdToPronunciationPathRoute } from '@/lib/pronunciation/path/routes'
import {
  unitStateBadgeVariant,
  unitStateLabelEs,
} from '@/lib/pronunciation/path/unit-labels'
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
    <details className="group min-w-0">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 py-2 font-label text-fg-muted marker:content-none hover:text-fg [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={16}
          className="shrink-0 text-fg-subtle transition-transform duration-150 motion-reduce:transition-none group-open:rotate-180"
          aria-hidden
        />
        Ver todas las unidades
      </summary>
      <div className="flex min-w-0 flex-col gap-5 pb-2">
        {stages.map((stage) => (
          <section key={stage.id} className="flex min-w-0 flex-col gap-1">
            <h3 className="font-label text-fg">{stage.titleEs}</h3>
            <ul className="flex min-w-0 flex-col">
              {stage.units.map((unit) => {
                const { title } = getLearnerTargetCopy(unit.targetId)
                const isActive = unit.targetId === activeTargetId
                const state = unitStates.get(unit.targetId)
                return (
                  <li key={unit.targetId}>
                    <Link
                      href={targetIdToPronunciationPathRoute(unit.targetId)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn( 'flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-sm px-2 font-body-sm', isActive ? 'bg-primary-soft text-primary' : 'text-fg hover:bg-surface-raised' )}
                    >
                      <span className="min-w-0 truncate">{title}</span>
                      <Badge
                        label={unitStateLabelEs(state)}
                        variant={unitStateBadgeVariant(state)}
                        size="sm"
                        className="shrink-0"
                      />
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
