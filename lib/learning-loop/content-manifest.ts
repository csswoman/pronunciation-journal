import { immersionEntries, IMMERSION_NON_EVALUABLE_ALLOWANCES } from './immersion-entries'
import { getTarget } from '@/lib/pronunciation/targets/registry'
import {
  chunkEntries,
  courseEntries,
  essentialWordEntries,
  gameEntries,
  grammarDeckEntries,
  miniLessonEntries,
  missionEntries,
  pronunciationEntries,
  trackingEntries,
  userDeckEntries,
} from './content-manifest-builders'
import type {
  LearningContentManifestEntry,
  LearningManifestIssue,
  LearningSurface,
  NonEvaluableContentAllowance,
} from './types'

export const NON_EVALUABLE_CONTENT_ALLOWLIST: readonly NonEvaluableContentAllowance[] = [
  {
    contentId: 'tracking-source:lesson',
    reason: 'Tracking stores intent and links to the exact lesson; the saved row itself is not an exercise.',
  },
  ...IMMERSION_NON_EVALUABLE_ALLOWANCES,
]

export const PRACTICE_ROUTE_SURFACES: Record<string, readonly LearningSurface[]> = {
  chunks: ['chunks'],
  decks: ['grammar_deck', 'user_decks'],
  'essential-words': ['essential_words'],
  games: ['games'],
  immersion: ['immersion'],
  sounds: ['sound_lab', 'pronunciation_path'],
  'word-rain': ['games'],
  'word-search': ['games'],
}

/** Routes that are intentionally not backed by a manifest content surface. */
export const PRACTICE_ROUTES_WITHOUT_SURFACE: Readonly<Record<string, string>> = {
  'connected-speech': 'A route-level practice launcher; its target-level work is represented by pronunciation surfaces.',
  'core-1000': 'Legacy Essential Words entry point; the canonical content is essential_words.',
  'ed-drills': 'Conditional remediation route without standalone authored content.',
  intonation: 'Conditional pronunciation remediation route without standalone authored content.',
  reader: 'Reader passages are generated per session and do not have stable manifest content ids.',
  review: 'A queue over existing learning owners, not an independent content surface.',
}

export async function buildLearningContentManifest(): Promise<LearningContentManifestEntry[]> {
  return [
    ...courseEntries(),
    ...grammarDeckEntries(),
    ...await miniLessonEntries(),
    ...essentialWordEntries(),
    ...chunkEntries(),
    ...pronunciationEntries(),
    ...missionEntries(),
    ...trackingEntries(),
    ...userDeckEntries(),
    ...gameEntries(),
    ...immersionEntries(),
  ]
}

export function validateLearningContentManifest(
  entries: readonly LearningContentManifestEntry[],
  allowances: readonly NonEvaluableContentAllowance[] = NON_EVALUABLE_CONTENT_ALLOWLIST,
): LearningManifestIssue[] {
  const issues: LearningManifestIssue[] = []
  const seen = new Set<string>()
  const usedAllowances = new Set<string>()
  const allowanceByContent = new Map(allowances.map((entry) => [entry.contentId, entry]))

  for (const entry of entries) {
    if (seen.has(entry.contentId)) {
      issues.push({ code: 'duplicate_content_id', contentId: entry.contentId, detail: 'content id is not unique' })
    }
    seen.add(entry.contentId)
    if (entry.targetRefs.length === 0 && entry.practice.status === 'objective') {
      issues.push({ code: 'missing_target_ref', contentId: entry.contentId, detail: 'objective practice has no target' })
    }
    if (entry.practice.status !== 'none' && entry.practice.adapter.trim() === '') {
      issues.push({ code: 'missing_practice_adapter', contentId: entry.contentId, detail: 'practice has no adapter' })
    }
    for (const ref of entry.targetRefs) {
      if (ref.namespace === 'pronunciation' && !getTarget(ref.id).ok) {
        issues.push({
          code: 'unknown_pronunciation_target',
          contentId: entry.contentId,
          detail: `unknown target ${ref.id}`,
        })
      }
    }
    if (entry.practice.status === 'none') {
      if (allowanceByContent.has(entry.contentId)) usedAllowances.add(entry.contentId)
      else {
        issues.push({
          code: 'unallowlisted_non_evaluable_content',
          contentId: entry.contentId,
          detail: entry.practice.reason,
        })
      }
    }
  }

  for (const allowance of allowances) {
    if (!usedAllowances.has(allowance.contentId)) {
      issues.push({
        code: 'stale_non_evaluable_allowance',
        contentId: allowance.contentId,
        detail: allowance.reason,
      })
    }
  }
  return issues
}

export function summarizeLearningContentManifest(
  entries: readonly LearningContentManifestEntry[],
): Record<LearningSurface, number> {
  const summary = Object.fromEntries([
    'course_path', 'grammar_deck', 'mini_lesson', 'essential_words', 'chunks',
    'sound_lab', 'pronunciation_path', 'oral_mission', 'tracking', 'immersion', 'user_decks', 'games',
  ].map((surface) => [surface, 0])) as Record<LearningSurface, number>
  for (const entry of entries) summary[entry.surface] += 1
  return summary
}
