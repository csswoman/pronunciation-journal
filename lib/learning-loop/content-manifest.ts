import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'
import { getDeckBySlug, listAllDecks } from '@/lib/courses/grammar-deck/decks'
import { getAllMiniLessons } from '@/lib/content/lessons'
import { loadEssentialWords } from '@/lib/essential-words/data'
import { essentialWordId } from '@/lib/essential-words/types'
import { listMissions } from '@/lib/ai-practice/missions/registry'
import { buildPronunciationPathCurriculum } from '@/lib/pronunciation/path/curriculum'
import { CONTENT_MAP } from '@/lib/pronunciation/targets/content-map'
import { getTarget, PRONUNCIATION_TARGETS } from '@/lib/pronunciation/targets/registry'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import {
  theoryTopicForDeck,
  theoryTopicForMiniLesson,
} from './theory-targets'
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
]

function pronunciationRefs(ids: readonly PronunciationTargetId[]) {
  return ids.map((id) => ({ namespace: 'pronunciation' as const, id }))
}

function courseEntries(): LearningContentManifestEntry[] {
  return [...COURSE_PATH_CURRICULUM.levels, ...COURSE_PATH_CURRICULUM.electiveTracks]
    .flatMap((level) => level.units.flatMap((unit) => unit.lessons.map((lesson) => {
      const slug = lesson.slug
      const topicRefs = slug
        ? [{ namespace: 'topic' as const, id: theoryTopicForDeck(slug) }]
        : []
      const targetRefs = [
        ...topicRefs,
        ...pronunciationRefs(lesson.pronunciationTargetIds ?? []),
        { namespace: 'lesson' as const, id: `${level.id}:${lesson.id}` },
      ]
      return {
        contentId: `course:${level.id}:${lesson.id}`,
        surface: 'course_path' as const,
        title: lesson.title,
        signals: ['exposure', 'completion'] as const,
        targetRefs,
        practice: slug
          ? { status: 'objective' as const, adapter: 'grammar_deck_quiz' }
          : { status: 'none' as const, reason: 'No authored deck slug.' },
        owners: slug
          ? ['lesson_completions', 'topic_srs'] as const
          : ['lesson_completions'] as const,
      }
    })))
}

function grammarDeckEntries(): LearningContentManifestEntry[] {
  return listAllDecks().map((summary) => {
    const deck = getDeckBySlug(summary.slug)
    return {
      contentId: `grammar-deck:${summary.slug}`,
      surface: 'grammar_deck',
      title: summary.title,
      signals: ['exposure', 'objective_evidence'],
      targetRefs: [
        { namespace: 'topic', id: theoryTopicForDeck(summary.slug) },
        ...pronunciationRefs(deck?.pronunciationTargetIds ?? []),
      ],
      practice: { status: 'objective', adapter: 'grammar_deck_topic_review' },
      owners: ['topic_srs', 'activity_sessions'],
    }
  })
}

async function miniLessonEntries(): Promise<LearningContentManifestEntry[]> {
  const miniLessons = await getAllMiniLessons()
  return miniLessons.map((lesson) => {
    const pronunciationTargetIds = CONTENT_MAP
      .filter((entry) => entry.kind === 'public_lesson' && entry.slug === lesson.slug)
      .map((entry) => entry.targetId)
    return {
      contentId: `mini-lesson:${lesson.slug}`,
      surface: 'mini_lesson',
      title: lesson.title,
      signals: ['exposure', 'completion', 'objective_evidence'],
      targetRefs: [
        { namespace: 'topic', id: theoryTopicForMiniLesson(lesson.slug) },
        { namespace: 'lesson', id: `mini-lessons:${lesson.slug}` },
        ...pronunciationRefs(pronunciationTargetIds),
      ],
      practice: { status: 'objective', adapter: 'mini_lesson_quiz' },
      owners: ['lesson_completions', 'topic_srs', 'activity_sessions'],
    }
  })
}

function essentialWordEntries(): LearningContentManifestEntry[] {
  const entries = new Map<string, LearningContentManifestEntry>()
  for (const word of loadEssentialWords()) {
    const wordId = essentialWordId(word.word)
    if (entries.has(wordId)) continue
    entries.set(wordId, {
      contentId: `essential-word:${wordId}`,
      surface: 'essential_words',
      title: word.word,
      signals: ['exposure', 'objective_evidence'],
      targetRefs: [{ namespace: 'essential_word', id: wordId }],
      practice: { status: 'objective', adapter: 'essential_words_runtime' },
      owners: ['essential_words', 'activity_sessions'],
    })
  }
  return [...entries.values()]
}

function pronunciationEntries(): LearningContentManifestEntry[] {
  const soundLab = Object.values(PRONUNCIATION_TARGETS).map((target) => ({
    contentId: `sound-lab:${target.id}`,
    surface: 'sound_lab' as const,
    title: target.label,
    signals: ['objective_evidence'] as const,
    targetRefs: pronunciationRefs([target.id]),
    practice: { status: 'objective' as const, adapter: 'target_practice_route' },
    owners: ['pronunciation', 'activity_sessions'] as const,
  }))
  const path = buildPronunciationPathCurriculum().stages.flatMap((stage) =>
    stage.units.map((unit) => ({
      contentId: `pronunciation-path:${unit.targetId}`,
      surface: 'pronunciation_path' as const,
      title: `${stage.titleEs}: ${unit.targetId}`,
      signals: ['exposure', 'completion'] as const,
      targetRefs: pronunciationRefs([unit.targetId]),
      practice: { status: 'objective' as const, adapter: 'target_practice_route' },
      owners: ['pronunciation'] as const,
    })),
  )
  return [...soundLab, ...path]
}

function missionEntries(): LearningContentManifestEntry[] {
  return listMissions().map((mission) => ({
    contentId: `mission:${mission.id}`,
    surface: 'oral_mission',
    title: mission.communicativeGoal,
    signals: ['objective_evidence', 'transfer'],
    targetRefs: pronunciationRefs(mission.targets.map((target) => target.targetId)),
    practice: { status: 'objective', adapter: 'oral_mission_launch' },
    owners: ['pronunciation', 'activity_sessions'],
  }))
}

function trackingEntries(): LearningContentManifestEntry[] {
  return [
    {
      contentId: 'tracking-source:word',
      surface: 'tracking',
      title: 'Palabra personal guardada',
      signals: ['intent'],
      targetRefs: [{ namespace: 'word_bank', id: 'dynamic:user-word-uuid' }],
      practice: { status: 'objective', adapter: 'tracking_word_review' },
      owners: ['word_bank', 'activity_sessions'],
    },
    {
      contentId: 'tracking-source:phrase',
      surface: 'tracking',
      title: 'Frase personal guardada',
      signals: ['intent'],
      targetRefs: [{ namespace: 'tracked_item', id: 'dynamic:tracked-item-uuid' }],
      practice: {
        status: 'activity_only',
        adapter: 'tracking_phrase_shadow',
        reason: 'A phrase needs explicit target refs before it may update a learning owner.',
      },
      owners: ['tracked_items', 'activity_sessions'],
    },
    {
      contentId: 'tracking-source:lesson',
      surface: 'tracking',
      title: 'Lección guardada',
      signals: ['intent'],
      targetRefs: [{ namespace: 'tracked_item', id: 'dynamic:tracked-item-uuid' }],
      practice: { status: 'none', reason: 'Tracking links to the lesson; it does not grade the bookmark.' },
      owners: ['tracked_items'],
    },
  ]
}

export async function buildLearningContentManifest(): Promise<LearningContentManifestEntry[]> {
  return [
    ...courseEntries(),
    ...grammarDeckEntries(),
    ...await miniLessonEntries(),
    ...essentialWordEntries(),
    ...pronunciationEntries(),
    ...missionEntries(),
    ...trackingEntries(),
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
    'course_path', 'grammar_deck', 'mini_lesson', 'essential_words',
    'sound_lab', 'pronunciation_path', 'oral_mission', 'tracking',
  ].map((surface) => [surface, 0])) as Record<LearningSurface, number>
  for (const entry of entries) summary[entry.surface] += 1
  return summary
}
