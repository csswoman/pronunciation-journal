'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Check } from '@/components/icons'
import { cn } from '@/lib/cn'
import { deriveStageProgress } from '@/lib/pronunciation/path/stage-progress'
import { stageIdToPronunciationPathRoute } from '@/lib/pronunciation/path/routes'
import type { PathStage, PathStageId, UnitLearningState } from '@/lib/pronunciation/path/types'

interface PronunciationPathStageNavProps {
  stages: readonly PathStage[]
  activeStageId: PathStageId
  unitStates: ReadonlyMap<string, UnitLearningState>
  recommendedStageId?: PathStageId | null
}

export function PronunciationPathStageNav({
  stages,
  activeStageId,
  unitStates,
  recommendedStageId = null,
}: PronunciationPathStageNavProps) {
  const activeRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    const node = activeRef.current
    if (!node || typeof node.scrollIntoView !== 'function') return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    node.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      inline: 'nearest',
      block: 'nearest',
    })
  }, [activeStageId])

  return (
    <nav aria-label="Etapas de la ruta de pronunciación" className="min-w-0">
      <ol
        className={cn(
          'flex min-w-0 items-start',
          'overflow-x-auto pb-1',
          'scrollbar-thin [scrollbar-color:var(--border-subtle)_transparent]'
        )}
      >
        {stages.map((stage, index) => {
          const isActive = stage.id === activeStageId
          const isRecommended = stage.id === recommendedStageId
          const isLast = index === stages.length - 1
          const progress = deriveStageProgress(stage, unitStates)
          const isComplete = progress === 'complete'
          const stageLabel = isRecommended
            ? `${index + 1}. ${stage.titleEs} (siguiente práctica)`
            : `${index + 1}. ${stage.titleEs}`

          return (
            <li key={stage.id} className={cn('flex items-start', !isLast && 'flex-1')}>
              <Link
                ref={isActive ? activeRef : undefined}
                href={stageIdToPronunciationPathRoute(stage.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={stageLabel}
                className="group flex shrink-0 flex-col items-center gap-1.5 rounded-sm px-1 pt-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-label text-caption transition-colors',
                    isComplete
                      ? 'bg-primary text-on-primary'
                      : isActive
                        ? 'bg-primary-soft text-primary ring-2 ring-inset ring-primary'
                        : isRecommended
                          ? 'bg-surface-sunken text-fg ring-1 ring-inset ring-badge-primary-border'
                          : 'bg-surface-sunken text-fg-subtle group-hover:text-fg'
                  )}
                >
                  {isComplete ? <Check size={16} aria-hidden /> : index + 1}
                </span>
                <span
                  className={cn(
                    'max-w-20 text-pretty text-center font-caption leading-snug',
                    isActive ? 'text-fg' : 'text-fg-muted group-hover:text-fg'
                  )}
                >
                  {stage.titleShortEs}
                </span>
              </Link>
              {!isLast ? (
                <div
                  aria-hidden
                  className={cn(
                    'mt-4 h-px min-w-4 flex-1 sm:min-w-8',
                    isComplete ? 'bg-primary' : 'bg-border-default'
                  )}
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
