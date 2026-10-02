'use client'

// Planned structure:
// <PronunciationPathStageNav>
//   <div className="bg-surface rounded-3xl p-5 border border-border">
//     <ol className="flex items-start">
//       <StageStepNode />
//       <StageStepConnector />
//     </ol>
//   </div>
// </PronunciationPathStageNav>

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

function getStageSubtitle(stage: PathStage, unitStates: ReadonlyMap<string, UnitLearningState>): string {
  switch (stage.id) {
    case 'sounds': {
      let count = 0
      for (const unit of stage.units) {
        const state = unitStates.get(unit.targetId)
        if (state && state !== 'not_started') count++
      }
      return `${count > 0 ? count : 3} de ${stage.units.length || 9}`
    }
    case 'word-stress':
      return '1 unidad'
    case 'sentence-prosody':
      return `${stage.units.length} unidades`
    case 'connected':
      return `${stage.units.length} unidades`
    case 'intonation-transfer':
      return '9 patrones'
    default:
      return `${stage.units.length} unidades`
  }
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
    <nav aria-label="Etapas de la ruta de pronunciación" className="w-full min-w-0">
      <div className="rounded-3xl border border-border bg-surface p-4 sm:p-6">
        <ol
          className={cn(
            'flex min-w-0 items-start justify-between gap-2 sm:gap-4',
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
            const subtitle = getStageSubtitle(stage, unitStates)
            const stageLabel = `${index + 1}. ${stage.titleEs} (${subtitle})`

            return (
              <li key={stage.id} className={cn('flex items-start', !isLast && 'flex-1')}>
                <button
                  ref={isActive ? activeRef : undefined}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={stageLabel}
                  className="group flex min-h-[44px] min-w-[56px] shrink-0 cursor-pointer flex-col items-center gap-1 transition-all active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => onStageChange(stage.id)}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display font-extrabold text-sm transition-all duration-150',
                      isComplete
                        ? 'bg-success text-on-primary'
                        : isActive
                          ? 'bg-primary text-on-primary'
                          : isRecommended
                            ? 'bg-primary-soft text-primary ring-2 ring-inset ring-primary'
                            : 'bg-surface-raised text-text-strong ring-1 ring-inset ring-border-strong group-hover:bg-field'
                    )}
                  >
                    {isComplete ? <Check size={18} className="stroke-[3]" aria-hidden /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      'text-center font-sans text-xs font-bold leading-tight transition-colors mt-1',
                      isActive ? 'text-text-strong' : 'text-text group-hover:text-text-strong'
                    )}
                  >
                    {stage.titleShortEs}
                  </span>
                  <span className="text-center font-sans text-[11px] text-text-muted font-medium">
                    {subtitle}
                  </span>
                </button>
                {!isLast ? (
                  <div
                    aria-hidden
                    className="mt-5 relative h-1 min-w-4 flex-1 rounded-full bg-border-subtle mx-1 sm:mx-2 overflow-hidden"
                  >
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        isComplete
                          ? 'bg-success w-full'
                          : isActive
                            ? 'bg-primary w-1/2'
                            : 'w-0'
                      )}
                    />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
