'use client'

// Planned structure:
// <PronunciationPathPage>
//   <PronunciationPathStageNav />
//   <MainTwoColumnGrid>
//     <LeftColumnStack>
//       <PronunciationPathNextAction />
//       <PronunciationPathProgressCard />
//     </LeftColumnStack>
//     <RightColumnAside>
//       <PronunciationPathExplore />
//     </RightColumnAside>
//   </MainTwoColumnGrid>
// </PronunciationPathPage>

import { useCallback, useEffect, useMemo, useState } from 'react'
import { isPronunciationPathCopyEnabled } from '@/lib/pronunciation/path/copy-flag'
import {
  buildPronunciationPathCurriculum,
  getPathUnit,
  listPathUnitsInOrder,
  pickUnitForStage,
} from '@/lib/pronunciation/path/curriculum'
import {
  loadPathEvidence,
  type PathEvidenceBundle,
} from '@/lib/pronunciation/path/load-evidence'
import { recommendNextPathAction } from '@/lib/pronunciation/path/recommend'
import type { PathStageId } from '@/lib/pronunciation/path/types'
import { deriveUnitLearningState, showNeedsEvidenceBadge } from '@/lib/pronunciation/path/unit-state'
import { PronunciationPathExplore } from './PronunciationPathExplore'
import { PronunciationPathLoadingCard } from './PronunciationPathLoadingCard'
import { PronunciationPathNextAction } from './PronunciationPathNextAction'
import { PronunciationPathProgressCard } from './PronunciationPathProgressCard'
import { PronunciationPathStageNav } from './PronunciationPathStageNav'
import {
  ctaLabelForHref,
  EMPTY_EVIDENCE,
  hrefForUnit,
  resolveStageId,
} from './pronunciation-path-page-helpers'

interface PronunciationPathPageProps {
  userId?: string
  initialTargetId?: string
  initialStage?: string
  copyEnabled?: boolean
  evidenceOverride?: PathEvidenceBundle
}

export function PronunciationPathPage({
  userId,
  initialTargetId,
  initialStage,
  copyEnabled = isPronunciationPathCopyEnabled(),
  evidenceOverride,
}: PronunciationPathPageProps) {
  const curriculum = useMemo(() => buildPronunciationPathCurriculum(), [])
  const [evidence, setEvidence] = useState<PathEvidenceBundle>(
    evidenceOverride ?? EMPTY_EVIDENCE,
  )
  const [evidenceReady, setEvidenceReady] = useState(Boolean(evidenceOverride))
  const [selectedStageId, setSelectedStageId] = useState<PathStageId | null>(() =>
    resolveStageId(initialStage),
  )

  useEffect(() => {
    if (evidenceOverride) {
      setEvidence(evidenceOverride)
      setEvidenceReady(true)
      return
    }
    let cancelled = false
    setEvidenceReady(false)
    void loadPathEvidence(userId).then((bundle) => {
      if (cancelled) return
      setEvidence(bundle)
      setEvidenceReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [userId, evidenceOverride])

  useEffect(() => {
    setSelectedStageId(resolveStageId(initialStage))
  }, [initialStage])

  const selectStage = useCallback((stageId: PathStageId) => {
    setSelectedStageId(stageId)

    const params = new URLSearchParams(window.location.search)
    params.set('tab', 'path')
    params.set('stage', stageId)
    window.history.pushState(
      null,
      '',
      `${window.location.pathname}?${params.toString()}`,
    )
  }, [])

  useEffect(() => {
    const onPopState = () => {
      setSelectedStageId(
        resolveStageId(new URLSearchParams(window.location.search).get('stage') ?? undefined),
      )
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const unitStates = useMemo(() => {
    const map = new Map<string, ReturnType<typeof deriveUnitLearningState>>()
    for (const unit of listPathUnitsInOrder()) {
      const diagnostic = evidence.diagnosticByTargetId.get(unit.targetId)
      map.set(
        unit.targetId,
        deriveUnitLearningState({
          unit,
          completedContentKeys: evidence.completedContentKeys,
          spokenAttempts: evidence.spokenAttempts,
          diagnosticScored: diagnostic?.measurement.kind === 'scored',
        }),
      )
    }
    return map
  }, [evidence])

  const recommendation = useMemo(
    () =>
      recommendNextPathAction({
        unitStates,
        diagnosticPriorityIds: evidence.diagnosticPriorityIds,
      }),
    [unitStates, evidence.diagnosticPriorityIds],
  )

  const stageFromParam = selectedStageId
  const unitFromParam = initialTargetId ? getPathUnit(initialTargetId) : null
  const recommendedUnit = recommendation.targetId
    ? getPathUnit(recommendation.targetId)
    : null

  const activeUnit =
    unitFromParam ??
    (stageFromParam ? pickUnitForStage(stageFromParam, unitStates) : null) ??
    recommendedUnit ??
    curriculum.stages[0]!.units[0]!

  const activeStageId = activeUnit.stageId
  const needsEvidence = showNeedsEvidenceBadge(
    evidence.diagnosticByTargetId.get(activeUnit.targetId),
  )

  const nextHref = hrefForUnit(recommendedUnit ?? activeUnit)
  const nextCtaLabel = ctaLabelForHref(nextHref, Boolean(recommendation.targetId))

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 pb-[max(5.5rem,env(safe-area-inset-bottom))] lg:pb-4">
      {evidenceReady ? (
        <>
          <PronunciationPathStageNav
            stages={curriculum.stages}
            activeStageId={activeStageId}
            unitStates={unitStates}
            recommendedStageId={evidenceReady ? recommendation.stageId : null}
            onStageChange={selectStage}
          />

          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,24rem)] lg:items-start">
            <main className="flex min-w-0 flex-col gap-6">
              <PronunciationPathNextAction
                activeUnit={activeUnit}
                activeStageId={activeStageId}
                recommendation={recommendation}
                copyEnabled={copyEnabled}
                href={nextHref}
                ctaLabel={nextCtaLabel}
                needsEvidence={needsEvidence}
              />

              <PronunciationPathProgressCard
                unitStates={unitStates}
                totalUnits={listPathUnitsInOrder().length}
              />
            </main>

            <aside className="min-w-0 lg:sticky lg:top-4">
              <PronunciationPathExplore
                stages={curriculum.stages}
                activeStageId={activeStageId}
                unitStates={unitStates}
                activeTargetId={activeUnit.targetId}
                onSelectStage={selectStage}
              />
            </aside>
          </div>
        </>
      ) : (
        <PronunciationPathLoadingCard />
      )}
    </div>
  )
}
