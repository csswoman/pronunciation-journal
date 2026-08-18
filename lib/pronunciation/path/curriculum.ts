import { getContentForTarget } from '@/lib/pronunciation/targets/content-map'
import {
  contrastTargetId,
  getTarget,
  phonemeTargetId,
  targetId,
} from '@/lib/pronunciation/targets/registry'
import { targetIdToPracticeRoute } from '@/lib/pronunciation/target-route'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import {
  PATH_STAGE_ORDER,
  type PathStage,
  type PathStageId,
  type PathUnit,
  type PronunciationPathCurriculum,
  type UnitLearningState,
} from './types'

const STAGE_TITLES: Record<PathStageId, string> = {
  sounds: 'Sonidos',
  'word-stress': 'Acento de palabra',
  'sentence-prosody': 'Ritmo y énfasis',
  connected: 'Habla conectada',
  'intonation-transfer': 'Entonación',
}

/** Mobile-first chips — avoids truncation / horizontal scroll on narrow screens. */
const STAGE_TITLES_SHORT: Record<PathStageId, string> = {
  sounds: 'Sonidos',
  'word-stress': 'Acento',
  'sentence-prosody': 'Ritmo',
  connected: 'Conectada',
  'intonation-transfer': 'Entonación',
}

/** Canonical target order per stage — single source for grouping. */
const STAGE_TARGET_IDS: Record<PathStageId, readonly PronunciationTargetId[]> = {
  sounds: [
    contrastTargetId('/θ/', '/ð/'),
    contrastTargetId('/iː/', '/ɪ/'),
    phonemeTargetId('/ə/'),
    contrastTargetId('/b/', '/v/'),
    contrastTargetId('/æ/', '/ʌ/'),
    contrastTargetId('/s/', '/z/'),
    contrastTargetId('/ʃ/', '/tʃ/'),
    phonemeTargetId('/ɹ/'),
  ],
  'word-stress': [targetId('prosody.word-stress')],
  'sentence-prosody': [targetId('prosody.sentence-stress'), targetId('prosody.rhythm')],
  connected: [
    targetId('connected.reduction.gonna'),
    targetId('connected.linking'),
    targetId('connected.elision'),
    targetId('connected.assimilation'),
  ],
  'intonation-transfer': [targetId('prosody.intonation.rising-question')],
}

function buildUnit(targetIdValue: PronunciationTargetId, stageId: PathStageId): PathUnit {
  const lookup = getTarget(targetIdValue)
  if (!lookup.ok) {
    throw new Error(`path curriculum: unknown target "${targetIdValue}"`)
  }
  return {
    targetId: targetIdValue,
    stageId,
    contentRefs: getContentForTarget(targetIdValue),
    practiceHref: targetIdToPracticeRoute(targetIdValue),
  }
}

export function buildPronunciationPathCurriculum(): PronunciationPathCurriculum {
  const stages: PathStage[] = PATH_STAGE_ORDER.map((id) => ({
    id,
    titleEs: STAGE_TITLES[id],
    titleShortEs: STAGE_TITLES_SHORT[id],
    units: STAGE_TARGET_IDS[id].map((tid) => buildUnit(tid, id)),
  }))
  return { stages }
}

export function listPathUnitsInOrder(): PathUnit[] {
  return buildPronunciationPathCurriculum().stages.flatMap((s) => [...s.units])
}

export function getPathUnit(targetIdValue: string): PathUnit | null {
  return listPathUnitsInOrder().find((u) => u.targetId === targetIdValue) ?? null
}

/** Prefer the first non-retained unit in a stage; otherwise the first unit. */
export function pickUnitForStage(
  stageId: PathStageId,
  unitStates: ReadonlyMap<string, UnitLearningState>
): PathUnit | null {
  const stage = buildPronunciationPathCurriculum().stages.find((s) => s.id === stageId)
  if (!stage || stage.units.length === 0) return null
  const open = stage.units.find((unit) => unitStates.get(unit.targetId) !== 'retained')
  return open ?? stage.units[0]!
}

export { PATH_STAGE_ORDER }
