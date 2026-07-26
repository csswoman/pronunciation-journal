import Link from 'next/link'
import { cn } from '@/lib/cn'
import { stageIdToPronunciationPathRoute } from '@/lib/pronunciation/path/routes'
import type { PathStage, PathStageId } from '@/lib/pronunciation/path/types'

interface PronunciationPathStageNavProps {
  stages: readonly PathStage[]
  activeStageId: PathStageId
  recommendedStageId?: PathStageId | null
}

export function PronunciationPathStageNav({
  stages,
  activeStageId,
  recommendedStageId = null,
}: PronunciationPathStageNavProps) {
  return (
    <nav aria-label="Etapas de la ruta de pronunciación" className="min-w-0">
      <p className="mb-2 font-mono text-caption text-fg-subtle">Etapas</p>
      <ul className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory scroll-px-1 [&::-webkit-scrollbar]:hidden">
        {stages.map((stage, index) => {
          const isActive = stage.id === activeStageId
          const isRecommended = stage.id === recommendedStageId
          return (
            <li key={stage.id} className="shrink-0 snap-start">
              <Link
                href={stageIdToPronunciationPathRoute(stage.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 max-w-[9.5rem] items-center rounded-sm px-3 font-label sm:max-w-none',
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : isRecommended
                      ? 'bg-surface-sunken text-fg ring-1 ring-inset ring-badge-primary-border'
                      : 'bg-surface-sunken text-fg-muted hover:bg-surface-raised hover:text-fg'
                )}
              >
                <span
                  className={cn(
                    'font-mono text-caption',
                    isActive ? 'text-primary' : 'text-fg-subtle'
                  )}
                >
                  {index + 1}.
                </span>
                <span className="ml-1.5 text-pretty leading-snug">{stage.titleEs}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
