import Link from 'next/link'
import { cn } from '@/lib/cn'
import { stageIdToPronunciationPathRoute } from '@/lib/pronunciation/path/routes'
import type { PathStage, PathStageId } from '@/lib/pronunciation/path/types'

interface PronunciationPathStageNavProps {
  stages: readonly PathStage[]
  activeStageId: PathStageId
}

export function PronunciationPathStageNav({
  stages,
  activeStageId,
}: PronunciationPathStageNavProps) {
  return (
    <nav aria-label="Etapas de la ruta de pronunciación" className="min-w-0">
      <ul className="flex min-w-0 flex-wrap gap-2">
        {stages.map((stage, index) => {
          const isActive = stage.id === activeStageId
          return (
            <li key={stage.id} className="min-w-0">
              <Link
                href={stageIdToPronunciationPathRoute(stage.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 min-w-0 items-center rounded-md border px-3 font-label',
                  isActive
                    ? 'border-accent bg-accent-soft text-fg'
                    : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg'
                )}
              >
                <span className="font-mono text-caption text-fg-subtle">{index + 1}.</span>
                <span className="ml-1.5 max-w-[12rem] truncate sm:max-w-none">{stage.titleEs}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
