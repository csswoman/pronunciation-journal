'use client'

// Planned structure:
// <PronunciationPathPage>
//   <PageHeader />
//   <PronunciationPathNextAction | PronunciationPathLoadingCard />
//   <PronunciationPathStageNav />
//   <PronunciationPathActiveUnit /> // only when exploring ≠ recommendation
//   <PronunciationPathExplore />
// </PronunciationPathPage>

import { useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { contentHrefForRefs } from '@/lib/pronunciation/path/content-href'
import { isPronunciationPathCopyEnabled } from '@/lib/pronunciation/path/copy-flag'
import {
  buildPronunciationPathCurriculum,
  getPathUnit,
  listPathUnitsInOrder,
  PATH_STAGE_ORDER,
  pickUnitForStage,
} from '@/lib/pronunciation/path/curriculum'
import {
  loadPathEvidence,
  type PathEvidenceBundle,
} from '@/lib/pronunciation/path/load-evidence'
import { recommendNextPathAction } from '@/lib/pronunciation/path/recommend'
import { targetIdToPronunciationPathRoute } from '@/lib/pronunciation/path/routes'
import type { PathStageId, PathUnit } from '@/lib/pronunciation/path/types'
import { deriveUnitLearningState, showNeedsEvidenceBadge } from '@/lib/pronunciation/path/unit-state'
import { PronunciationPathActiveUnit } from './PronunciationPathActiveUnit'
import { PronunciationPathExplore } from './PronunciationPathExplore'
import { PronunciationPathLoadingCard } from './PronunciationPathLoadingCard'
import { PronunciationPathNextAction } from './PronunciationPathNextAction'
import { PronunciationPathStageNav } from './PronunciationPathStageNav'

interface PronunciationPathPageProps {
  userId?: string
  initialTargetId?: string
  initialStage?: string
  /** Test override — defaults to env flag. */
  copyEnabled?: boolean
  /** Test override — skip Dexie load. */
  evidenceOverride?: PathEvidenceBundle
}

function resolveStageId(raw: string | undefined): PathStageId | null {
  if (!raw) return null
  if ((PATH_STAGE_ORDER as readonly string[]).includes(raw)) return raw as PathStageId
  const asIndex = Number(raw)
  if (Number.isInteger(asIndex) && asIndex >= 1 && asIndex <= PATH_STAGE_ORDER.length) {
    return PATH_STAGE_ORDER[asIndex - 1]!
  }
  return null
}

function hrefForUnit(unit: PathUnit | null): string {
  if (!unit) return '/courses/pronunciation'
  return (
    unit.practiceHref ??
    contentHrefForRefs(unit.contentRefs) ??
    targetIdToPronunciationPathRoute(unit.targetId)
  )
}

function ctaLabelForHref(href: string, hasTarget: boolean): string {
  if (!hasTarget) return 'Ver etapas'
  if (href.startsWith('/practice/sounds')) return 'Practicar en Sound Lab'
  if (href.startsWith('/mini-lessons')) return 'Abrir lección'
  return 'Abrir esta etapa'
}

const EMPTY_EVIDENCE: PathEvidenceBundle = {
  completedContentKeys: new Set(),
  spokenAttempts: [],
  diagnosticPriorityIds: [],
  diagnosticByTargetId: new Map(),
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
    evidenceOverride ?? EMPTY_EVIDENCE
  )
  const [evidenceReady, setEvidenceReady] = useState(Boolean(evidenceOverride))

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
        })
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
    [unitStates, evidence.diagnosticPriorityIds]
  )

  const stageFromParam = resolveStageId(initialStage)
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
  const activeState = unitStates.get(activeUnit.targetId) ?? 'not_started'
  const needsEvidence = showNeedsEvidenceBadge(
    evidence.diagnosticByTargetId.get(activeUnit.targetId)
  )

  const nextHref = hrefForUnit(recommendedUnit)
  const nextCtaLabel = ctaLabelForHref(nextHref, Boolean(recommendation.targetId))
  const recommendationOwnsPrimary =
    !recommendation.targetId || activeUnit.targetId === recommendation.targetId
  const recommendedLessonHref = recommendedUnit
    ? contentHrefForRefs(recommendedUnit.contentRefs)
    : null
  const recommendedNeedsEvidence = recommendedUnit
    ? showNeedsEvidenceBadge(evidence.diagnosticByTargetId.get(recommendedUnit.targetId))
    : false
  const recommendedTitle = recommendedUnit
    ? getLearnerTargetCopy(recommendedUnit.targetId).title
    : null
  const recommendedPathHref = recommendedUnit
    ? targetIdToPronunciationPathRoute(recommendedUnit.targetId)
    : null

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 pb-[max(5.5rem,env(safe-area-inset-bottom))] sm:gap-8 lg:pb-4">
      <PageHeader
        variant="compact"
        kicker="Pronunciación"
        title="Tu ruta"
        subtitle="De sonidos a frases reales. Un paso claro a la vez."
      />

      {evidenceReady ? (
        <PronunciationPathNextAction
          recommendation={recommendation}
          copyEnabled={copyEnabled}
          href={nextHref}
          ctaLabel={nextCtaLabel}
          mode={recommendationOwnsPrimary ? 'primary' : 'compact'}
          lessonHref={recommendationOwnsPrimary ? recommendedLessonHref : null}
          needsEvidence={recommendationOwnsPrimary ? recommendedNeedsEvidence : false}
        />
      ) : (
        <PronunciationPathLoadingCard />
      )}

      <PronunciationPathStageNav
        stages={curriculum.stages}
        activeStageId={activeStageId}
        recommendedStageId={evidenceReady ? recommendation.stageId : null}
      />

      {evidenceReady && !recommendationOwnsPrimary ? (
        <PronunciationPathActiveUnit
          unit={activeUnit}
          state={activeState}
          needsEvidence={needsEvidence}
          copyEnabled={copyEnabled}
          fallbackPracticeHref={
            recommendedUnit && recommendedUnit.targetId !== activeUnit.targetId
              ? hrefForUnit(recommendedUnit)
              : null
          }
          recommendedTitle={recommendedTitle}
          recommendedHref={recommendedPathHref}
        />
      ) : null}

      <PronunciationPathExplore
        stages={curriculum.stages}
        unitStates={unitStates}
        activeTargetId={activeUnit.targetId}
      />
    </div>
  )
}
