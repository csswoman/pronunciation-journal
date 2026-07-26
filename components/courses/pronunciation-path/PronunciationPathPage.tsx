'use client'

// Planned structure:
// <PronunciationPathPage>
//   <PageHeader />
//   <PronunciationPathNextAction />
//   <PronunciationPathStageNav />
//   <PronunciationPathActiveUnit />
//   <PronunciationPathExplore />
// </PronunciationPathPage>

import { useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { contentHrefForRefs } from '@/lib/pronunciation/path/content-href'
import { isPronunciationPathCopyEnabled } from '@/lib/pronunciation/path/copy-flag'
import {
  buildPronunciationPathCurriculum,
  getPathUnit,
  listPathUnitsInOrder,
  PATH_STAGE_ORDER,
} from '@/lib/pronunciation/path/curriculum'
import {
  loadPathEvidence,
  type PathEvidenceBundle,
} from '@/lib/pronunciation/path/load-evidence'
import { recommendNextPathAction } from '@/lib/pronunciation/path/recommend'
import { targetIdToPronunciationPathRoute } from '@/lib/pronunciation/path/routes'
import type { PathStageId, UnitLearningState } from '@/lib/pronunciation/path/types'
import { deriveUnitLearningState, showNeedsEvidenceBadge } from '@/lib/pronunciation/path/unit-state'
import { PronunciationPathActiveUnit } from './PronunciationPathActiveUnit'
import { PronunciationPathExplore } from './PronunciationPathExplore'
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

  useEffect(() => {
    if (evidenceOverride) {
      setEvidence(evidenceOverride)
      return
    }
    if (!userId) {
      setEvidence(EMPTY_EVIDENCE)
      return
    }
    let cancelled = false
    void loadPathEvidence(userId).then((bundle) => {
      if (!cancelled) setEvidence(bundle)
    })
    return () => {
      cancelled = true
    }
  }, [userId, evidenceOverride])

  const unitStates = useMemo(() => {
    const map = new Map<string, UnitLearningState>()
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
  const activeUnit =
    unitFromParam ??
    (recommendation.targetId ? getPathUnit(recommendation.targetId) : null) ??
    curriculum.stages[0]!.units[0]!
  const activeStageId = stageFromParam ?? activeUnit.stageId
  const activeState = unitStates.get(activeUnit.targetId) ?? 'not_started'
  const needsEvidence = showNeedsEvidenceBadge(
    evidence.diagnosticByTargetId.get(activeUnit.targetId)
  )

  const nextHref = recommendation.targetId
    ? (getPathUnit(recommendation.targetId)?.practiceHref ??
        contentHrefForRefs(getPathUnit(recommendation.targetId)?.contentRefs ?? []) ??
        targetIdToPronunciationPathRoute(recommendation.targetId))
    : '/courses/pronunciation'

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 pb-[max(0px,env(safe-area-inset-bottom))]">
      <PageHeader
        kicker="Pronunciación"
        title="Tu ruta"
        subtitle="De sonidos a frases reales — un paso claro a la vez."
      />
      <PronunciationPathNextAction
        recommendation={recommendation}
        copyEnabled={copyEnabled}
        href={nextHref}
      />
      <PronunciationPathStageNav stages={curriculum.stages} activeStageId={activeStageId} />
      <PronunciationPathActiveUnit
        unit={activeUnit}
        state={activeState}
        needsEvidence={needsEvidence}
        copyEnabled={copyEnabled}
        showTransferPlaceholder={activeUnit.stageId === 'intonation-transfer'}
      />
      <PronunciationPathExplore
        stages={curriculum.stages}
        unitStates={unitStates}
        activeTargetId={activeUnit.targetId}
      />
    </div>
  )
}
