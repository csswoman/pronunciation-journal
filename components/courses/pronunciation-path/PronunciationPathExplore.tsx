'use client'

// Planned structure:
// <PronunciationPathExplore>
//   <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-border flex flex-col justify-between gap-4 h-full">
//     <HeaderWithTitleAndBadge />
//     <UnitsListStack />
//     <FooterNavigation />
//   </div>
// </PronunciationPathExplore>

import Link from 'next/link'
import { cn } from '@/lib/cn'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { targetIdToPronunciationPathRoute } from '@/lib/pronunciation/path/routes'
import type { PathStage, PathStageId, UnitLearningState } from '@/lib/pronunciation/path/types'

interface PronunciationPathExploreProps {
  stages: readonly PathStage[]
  activeStageId: PathStageId
  unitStates: ReadonlyMap<string, UnitLearningState>
  activeTargetId: string | null
  onSelectStage?: (stageId: PathStageId) => void
}

const UNIT_ESTIMATED_TIMES: Record<string, string> = {
  'contrast.b.v': '5 min',
  'contrast.æ.ʌ': '5 min',
  'contrast.s.z': '4 min',
  'contrast.ʃ.tʃ': '4 min',
  'phoneme.ɹ': '6 min',
  'prosody.sentence-stress': '5 min',
  'prosody.rhythm': '5 min',
}

export function PronunciationPathExplore({
  stages,
  activeStageId,
  unitStates,
  activeTargetId,
  onSelectStage,
}: PronunciationPathExploreProps) {
  const currentStage = stages.find((s) => s.id === activeStageId) ?? stages[0]!
  const currentStageIndex = stages.findIndex((s) => s.id === currentStage.id) + 1
  const nextStage = stages[currentStageIndex % stages.length] ?? stages[0]!
  const nextStageIndex = (currentStageIndex % stages.length) + 1

  return (
    <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-border flex flex-col justify-between gap-4 h-full">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
          <h3 className="font-kicker text-text-muted text-xs tracking-wider uppercase font-bold">
            UNIDADES DEL PASO {currentStageIndex} · {currentStage.titleShortEs.toUpperCase()}
          </h3>
          <span className="bg-surface-raised border border-border-strong text-text-muted text-xs font-semibold rounded-full px-3 py-0.5 shrink-0">
            3 en progreso
          </span>
        </div>

        {/* List of Units */}
        <ul className="flex flex-col">
          {currentStage.units.map((unit, idx) => {
            const { title, ipaHint } = getLearnerTargetCopy(unit.targetId)
            const isActive = unit.targetId === activeTargetId || (!activeTargetId && idx === 0 && currentStage.id === 'sounds')
            const state = unitStates.get(unit.targetId)
            const isLast = idx === currentStage.units.length - 1

            // Status badges
            let badgeNode = null
            if (isActive) {
              badgeNode = (
                <span className="bg-ink text-paper text-[11px] font-extrabold rounded-full px-2.5 py-0.5 uppercase tracking-wider shrink-0">
                  AHORA
                </span>
              )
            } else if (
              currentStage.id === 'sounds' && (idx === 1 || idx === 2 || state === 'learning' || state === 'ready_for_transfer')
            ) {
              badgeNode = (
                <span className="bg-butter text-ink text-[11px] font-extrabold rounded-full px-2.5 py-0.5 uppercase tracking-wider shrink-0">
                  EN PROGRESO
                </span>
              )
            } else {
              const estTime = UNIT_ESTIMATED_TIMES[unit.targetId] ?? '5 min'
              badgeNode = (
                <span className="ts-caption text-text-muted text-xs font-medium shrink-0">
                  {estTime}
                </span>
              )
            }

            return (
              <li key={unit.targetId}>
                <Link
                  href={targetIdToPronunciationPathRoute(unit.targetId)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center justify-between gap-3 p-3 transition-all cursor-pointer',
                    isActive
                      ? 'bg-coral-soft border border-coral-deep/40 text-ink rounded-2xl my-1.5'
                      : cn(
                          'hover:bg-surface-sunken/60 text-text-strong rounded-xl',
                          !isLast && 'border-b border-border-subtle/50'
                        )
                  )}
                >
                  {ipaHint ? (
                    <span
                      className={cn(
                        'font-ipa font-bold text-base w-14 shrink-0',
                        isActive ? '!text-ink font-bold' : '!text-text-strong font-bold'
                      )}
                      lang="en-fonipa"
                    >
                      {ipaHint}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      'font-body-sm font-semibold flex-1 truncate',
                      isActive ? '!text-ink font-bold' : 'text-text-strong'
                    )}
                  >
                    {title}
                  </span>
                  {badgeNode}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-4 mt-2">
        {onSelectStage ? (
          <button
            type="button"
            onClick={() => onSelectStage(nextStage.id)}
            className="bg-surface-raised border border-border-strong text-text-strong text-xs font-bold rounded-full px-4 py-2 hover:bg-field cursor-pointer transition-colors active:scale-95"
          >
            Paso {nextStageIndex} · {nextStage.titleShortEs}
          </button>
        ) : (
          <div />
        )}
        <span className="ts-caption text-text-muted text-xs font-medium">
          19 unidades en 5 pasos
        </span>
      </div>
    </div>
  )
}
