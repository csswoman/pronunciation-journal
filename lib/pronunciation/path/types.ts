import type { ContentMapEntry } from '@/lib/pronunciation/targets/content-map'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'

export const PATH_STAGE_ORDER = [
  'sounds',
  'word-stress',
  'sentence-prosody',
  'connected',
  'intonation-transfer',
] as const

export type PathStageId = (typeof PATH_STAGE_ORDER)[number]

export type UnitLearningState =
  | 'not_started'
  | 'learning'
  | 'ready_for_transfer'
  | 'retained'

export interface PathUnit {
  targetId: PronunciationTargetId
  stageId: PathStageId
  contentRefs: readonly ContentMapEntry[]
  /** Direct practice route when one exists; otherwise null. */
  practiceHref: string | null
}

export interface PathStage {
  id: PathStageId
  titleEs: string
  /** Compact label for narrow viewports — same meaning, fewer characters. */
  titleShortEs: string
  units: readonly PathUnit[]
}

export interface PronunciationPathCurriculum {
  stages: readonly PathStage[]
}

export type RecommendReasonKind =
  | 'diagnostic_priority'
  | 'canonical_next'
  | 'all_retained'

export interface PathRecommendation {
  targetId: PronunciationTargetId | null
  stageId: PathStageId | null
  reasonKind: RecommendReasonKind
  /** Learner-facing Spanish; may be outcome-flavored — gate behind copy flag in UI. */
  reasonEs: string
}
