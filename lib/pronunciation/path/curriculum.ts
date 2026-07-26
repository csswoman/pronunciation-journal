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
} from './types'

const STAGE_TITLES: Record<PathStageId, string> = {
  sounds: 'Sonidos y contrastes',
  'word-stress': 'Sílabas y word stress',
  'sentence-prosody': 'Sentence stress, ritmo y weak forms',
  connected: 'Linking, reductions, elision y assimilation',
  'intonation-transfer': 'Intonation y transferencia',
}

/** Canonical target order per stage — single source for grouping. */
const STAGE_TARGET_IDS: Record<PathStageId, readonly PronunciationTargetId[]> = {
  sounds: [
    contrastTargetId('/θ/', '/ð/'),
    contrastTargetId('/iː/', '/ɪ/'),
    phonemeTargetId('/ə/'),
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

export { PATH_STAGE_ORDER }
