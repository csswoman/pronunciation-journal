import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'

export type LearningSurface =
  | 'course_path'
  | 'grammar_deck'
  | 'mini_lesson'
  | 'essential_words'
  | 'sound_lab'
  | 'pronunciation_path'
  | 'oral_mission'
  | 'tracking'

export type LearningSignal =
  | 'exposure'
  | 'completion'
  | 'intent'
  | 'objective_evidence'
  | 'transfer'

export type ProgressOwner =
  | 'lesson_completions'
  | 'topic_srs'
  | 'essential_words'
  | 'pronunciation'
  | 'word_bank'
  | 'tracked_items'
  | 'activity_sessions'

export type LearningTargetRef =
  | { namespace: 'topic'; id: string }
  | { namespace: 'pronunciation'; id: PronunciationTargetId }
  | { namespace: 'essential_word'; id: string }
  | { namespace: 'word_bank'; id: 'dynamic:user-word-uuid' }
  | { namespace: 'tracked_item'; id: 'dynamic:tracked-item-uuid' }
  | { namespace: 'lesson'; id: string }

export type PracticeAvailability =
  | { status: 'objective'; adapter: string }
  | { status: 'activity_only'; adapter: string; reason: string }
  | { status: 'none'; reason: string }

export interface LearningContentManifestEntry {
  contentId: string
  surface: LearningSurface
  title: string
  signals: readonly LearningSignal[]
  targetRefs: readonly LearningTargetRef[]
  practice: PracticeAvailability
  owners: readonly ProgressOwner[]
}

export interface NonEvaluableContentAllowance {
  contentId: string
  reason: string
}

export type LearningManifestIssueCode =
  | 'duplicate_content_id'
  | 'unknown_pronunciation_target'
  | 'missing_target_ref'
  | 'missing_practice_adapter'
  | 'unallowlisted_non_evaluable_content'
  | 'stale_non_evaluable_allowance'

export interface LearningManifestIssue {
  code: LearningManifestIssueCode
  contentId: string
  detail: string
}
