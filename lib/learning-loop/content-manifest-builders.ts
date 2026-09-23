import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'
import { getDeckBySlug, listAllDecks } from '@/lib/courses/grammar-deck/decks'
import { getAllMiniLessons } from '@/lib/content/lessons'
import { loadEssentialWords } from '@/lib/essential-words/data'
import { essentialWordId } from '@/lib/essential-words/types'
import { LEARNING_CHUNKS } from '@/lib/chunk-of-day/catalog'
import { listMissions } from '@/lib/ai-practice/missions/registry'
import { buildPronunciationPathCurriculum } from '@/lib/pronunciation/path/curriculum'
import { CONTENT_MAP } from '@/lib/pronunciation/targets/content-map'
import { PRONUNCIATION_TARGETS } from '@/lib/pronunciation/targets/registry'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import {
  theoryTopicForDeck,
  theoryTopicForMiniLesson,
} from './theory-targets'
import type { LearningContentManifestEntry } from './types'

function pronunciationRefs(ids: readonly PronunciationTargetId[]) {
  return ids.map((id) => ({ namespace: 'pronunciation' as const, id }))
}

export function courseEntries(): LearningContentManifestEntry[] {
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

export function grammarDeckEntries(): LearningContentManifestEntry[] {
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

export function chunkEntries(): LearningContentManifestEntry[] {
  return LEARNING_CHUNKS.map((chunk) => ({
    contentId: `chunk:${chunk.id}`,
    surface: 'chunks',
    title: chunk.chunk,
    signals: ['exposure', 'objective_evidence'],
    targetRefs: [{ namespace: 'chunks', id: chunk.id }],
    practice: { status: 'objective', adapter: 'chunk_practice' },
    owners: ['chunk_srs', 'activity_sessions'],
  }))
}

export async function miniLessonEntries(): Promise<LearningContentManifestEntry[]> {
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

export function essentialWordEntries(): LearningContentManifestEntry[] {
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

export function pronunciationEntries(): LearningContentManifestEntry[] {
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

export function missionEntries(): LearningContentManifestEntry[] {
  return listMissions().map((mission) => {
    const targetRefs = pronunciationRefs(mission.targets.map((target) => target.targetId))
    if (targetRefs.length === 0) {
      return {
        contentId: `mission:${mission.id}`,
        surface: 'oral_mission' as const,
        title: mission.communicativeGoal,
        signals: ['objective_evidence'] as const,
        targetRefs,
        practice: {
          status: 'activity_only' as const,
          adapter: 'oral_mission_launch',
          reason: 'Scripted mission with no pronunciation target; grades the script but has nothing to attribute progress to.',
        },
        owners: ['activity_sessions'] as const,
      }
    }
    return {
      contentId: `mission:${mission.id}`,
      surface: 'oral_mission' as const,
      title: mission.communicativeGoal,
      signals: ['objective_evidence', 'transfer'] as const,
      targetRefs,
      practice: { status: 'objective' as const, adapter: 'oral_mission_launch' },
      owners: ['pronunciation', 'activity_sessions'] as const,
    }
  })
}

export function trackingEntries(): LearningContentManifestEntry[] {
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

export function userDeckEntries(): LearningContentManifestEntry[] {
  return [{
    contentId: 'user-deck:word-bank',
    surface: 'user_decks',
    title: 'Mazos personales de vocabulario',
    signals: ['objective_evidence'],
    targetRefs: [{ namespace: 'word_bank', id: 'dynamic:user-word-uuid' }],
    practice: { status: 'objective', adapter: 'user_deck_word_bank_review' },
    owners: ['word_bank', 'activity_sessions'],
  }]
}

export function gameEntries(): LearningContentManifestEntry[] {
  return [
    {
      contentId: 'game:word-rain',
      surface: 'games',
      title: 'Lluvia de palabras',
      signals: ['exposure'],
      targetRefs: [],
      practice: {
        status: 'activity_only',
        adapter: 'word_rain_activity',
        reason: 'Typing speed game has no canonical learner-word target or evaluated answer.',
      },
      owners: ['activity_sessions'],
    },
    {
      contentId: 'game:word-search',
      surface: 'games',
      title: 'Sopa de letras',
      signals: ['exposure'],
      targetRefs: [],
      practice: {
        status: 'activity_only',
        adapter: 'word_search_activity',
        reason: 'Word-finding game records play activity; only its separate word-bank repetition updates SRS.',
      },
      owners: ['activity_sessions'],
    },
  ]
}
