'use client'

import { useEffect, useRef } from 'react'
import { Check } from '@/components/icons'
import { cn } from '@/lib/cn'
import { deriveStageProgress } from '@/lib/pronunciation/path/stage-progress'
import type { PathStage, PathStageId, UnitLearningState } from '@/lib/pronunciation/path/types'

interface PronunciationPathStageNavProps {
  stages: readonly PathStage[]
  activeStageId: PathStageId
  unitStates: ReadonlyMap<string, UnitLearningState>
  recommendedStageId?: PathStageId | null
  onStageChange: (stageId: PathStageId) => void
}

export function PronunciationPathStageNav({
  stages,
  activeStageId,
  unitStates,
  recommendedStageId = null,
  onStageChange,
}: PronunciationPathStageNavProps) {
  const activeRef = useRef<HTMLButtonElement | null>(null)

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
              <button
                ref={isActive ? activeRef : undefined}
                type="button"
                aria-pressed={isActive}
                aria-label={stageLabel}
                className="group flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-md px-1.5 pt-1.5 pb-1 transition-all active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={() => onStageChange(stage.id)}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-label text-caption transition-all duration-150',
                    isComplete
                      ? 'bg-success-soft text-success ring-1 ring-inset ring-success-border'
                      : isActive
                        ? 'bg-primary-soft text-primary ring-2 ring-inset ring-primary shadow-xs'
                        : isRecommended
                          ? 'bg-primary-soft text-primary ring-1 ring-inset ring-badge-primary-border'
                          : 'bg-surface-raised text-fg-subtle ring-1 ring-inset ring-border-subtle group-hover:text-fg group-hover:ring-border-default'
                  )}
                >
                  {isComplete ? <Check size={16} aria-hidden /> : index + 1}
                </span>
                <span
                  className={cn(
                    'max-w-20 text-pretty text-center font-caption leading-snug transition-colors',
                    isActive ? 'font-medium text-fg' : 'text-fg-muted group-hover:text-fg'
                  )}
                >
                  {stage.titleShortEs}
                </span>
              </button>
              {!isLast ? (
                <div
                  aria-hidden
                  className={cn(
                    'mt-5 h-px min-w-4 flex-1 sm:min-w-8 transition-colors',
                    isComplete ? 'bg-success-border' : 'bg-border-default'
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
