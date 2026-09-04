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
    <details open className="group min-w-0">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-1 py-2 font-label text-fg-muted marker:content-none hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={16}
          className="shrink-0 text-fg-subtle transition-transform duration-150 motion-reduce:transition-none group-open:rotate-180"
          aria-hidden
        />
        <span>Ver todas las unidades</span>
      </summary>
      <div className="flex min-w-0 flex-col gap-5 pb-2">
        {stages.map((stage) => (
          <section key={stage.id} className="flex min-w-0 flex-col gap-1">
            <h3 className="font-label text-fg">{stage.titleEs}</h3>
            <ul className="flex min-w-0 flex-col">
              {stage.units.map((unit) => {
                const { title, ipaHint } = getLearnerTargetCopy(unit.targetId)
                const isActive = unit.targetId === activeTargetId
                const state = unitStates.get(unit.targetId)
                return (
                  <li key={unit.targetId}>
                    <Link
                      href={targetIdToPronunciationPathRoute(unit.targetId)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex min-h-11 min-w-0 items-center gap-2 rounded-md px-2.5 font-body-sm transition-colors',
                        isActive
                          ? 'bg-primary-soft font-medium text-primary shadow-xs'
                          : 'text-fg hover:bg-surface-sunken active:bg-surface-sunken'
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{title}</span>
                      {ipaHint ? (
                        <span
                          className={cn( 'shrink-0 font-ipa text-caption', isActive ? 'text-primary' : 'text-fg-subtle' )}
                          lang="en-fonipa"
                        >
                          {ipaHint}
                        </span>
                      ) : null}
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
