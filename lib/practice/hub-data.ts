// Server-side data bundle for the free-practice hub (/practice).
//
// Fetches everything that lives in Supabase and benefits from a single
// server round-trip (deck counts, word-bank signals, retention, course-path
// position, immersion totals). Dexie-backed, offline-first signals (essential
// words learned/total, stored CEFR level, last practice mode, immersion
// *watched* count) stay on the client in PracticeHubClient — this module never
// touches IndexedDB.
//
// Every field degrades to null / 0 on failure: the hub must render for guests
// and offline, so nothing here is allowed to throw. Shared types + the empty
// bundle live in `hub-data-types.ts` so client components can import them
// without pulling in `server-only`.

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'
import {
  deriveLevelView,
  getCoreLessons,
  lessonProgressKey,
} from '@/lib/courses/progress'
import type { CefrLevelId, CoursePathLevel } from '@/lib/courses/types'
import {
  emptyPracticeHubData,
  type PracticeHubData,
  type PracticeHubDecksData,
  type PracticeHubCourseData,
  type PracticeHubRecommendedData,
} from './hub-data-types'

export {
  emptyPracticeHubData,
  type PracticeHubData,
  type PracticeHubDecksData,
  type PracticeHubCourseData,
  type PracticeHubRecommendedData,
} from './hub-data-types'

const LEVEL_LABELS: Record<CefrLevelId, string> = {
  a1: 'A1 · Principiante',
  a2: 'A2 · Básico',
  b1: 'B1 · Intermedio',
  b2: 'B2 · Intermedio alto',
  c1: 'C1 · Avanzado',
  c2: 'C2 · Dominio',
}

const RETENTION_MIN_ANSWERS = 12

export async function getPracticeHubData(userId: string | null): Promise<PracticeHubData> {
  const empty = emptyPracticeHubData()
  if (!userId) return empty

  const supabase = await createSupabaseServerClient()

  const [recommended, decks, reader, immersion, course] = await Promise.all([
    loadRecommended(supabase, userId).catch(() => empty.recommended),
    loadDecks(supabase, userId).catch(() => empty.decks),
    loadReader(supabase).catch(() => empty.reader),
    loadImmersion(supabase).catch(() => empty.immersion),
    loadCourse(supabase, userId).catch(() => null),
  ])

  return { recommended, decks, reader, immersion, course }
}

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

async function loadRecommended(
  supabase: ServerClient,
  userId: string,
): Promise<PracticeHubRecommendedData> {
  const nowIso = new Date().toISOString()
  const since7 = new Date()
  since7.setDate(since7.getDate() - 7)

  const [dueResult, previewResult, accuracyResult] = await Promise.all([
    supabase
      .from('word_bank')
      .select('repetitions')
      .eq('user_id', userId)
      .not('next_review_at', 'is', null)
      .lte('next_review_at', nowIso),
    supabase
      .from('word_bank')
      .select('text')
      .eq('user_id', userId)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('answer_history')
      .select('grade, is_correct')
      .eq('user_id', userId)
      .gte('answered_at', since7.toISOString())
      .not('answered_at', 'is', null),
  ])

  const dueRows = (dueResult.data ?? []) as { repetitions: number }[]
  const dueCount = dueRows.length
  const criticalCount = dueRows.filter((r) => (r.repetitions ?? 0) === 0).length

  const previewWords = ((previewResult.data ?? []) as { text: string }[])
    .map((r) => r.text)
    .filter(Boolean)

  const answerRows = (accuracyResult.data ?? []) as {
    grade: number | null
    is_correct: boolean | null
  }[]
  let retentionPct: number | null = null
  if (answerRows.length >= RETENTION_MIN_ANSWERS) {
    let weighted = 0
    for (const row of answerRows) {
      if (row.grade !== null && row.grade !== undefined) weighted += (row.grade / 5) * 100
      else weighted += row.is_correct ? 100 : 0
    }
    retentionPct = Math.round(weighted / answerRows.length)
  }

  return { dueCount, criticalCount, retentionPct, previewWords }
}

async function loadDecks(
  supabase: ServerClient,
  userId: string,
): Promise<PracticeHubDecksData> {
  const [decksResult, entriesResult] = await Promise.all([
    supabase
      .from('decks')
      .select('id, name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase.from('deck_entries').select('deck_id'),
  ])

  const decks = (decksResult.data ?? []) as { id: string; name: string }[]
  const deckIds = new Set(decks.map((d) => d.id))
  const cardCount = ((entriesResult.data ?? []) as { deck_id: string }[]).filter((row) =>
    deckIds.has(row.deck_id),
  ).length

  return {
    deckCount: decks.length,
    cardCount,
    topDeckNames: decks.slice(0, 3).map((d) => d.name).filter(Boolean),
  }
}

async function loadReader(supabase: ServerClient): Promise<{ recentWordCount: number }> {
  const { count } = await supabase
    .from('word_bank')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'ready')
  return { recentWordCount: count ?? 0 }
}

async function loadImmersion(supabase: ServerClient): Promise<{ totalCount: number }> {
  const { count } = await supabase
    .from('immersion_lessons')
    .select('id', { count: 'exact', head: true })
  return { totalCount: count ?? 0 }
}

async function loadCourse(
  supabase: ServerClient,
  userId: string,
): Promise<PracticeHubCourseData | null> {
  const [completionsResult, profileResult] = await Promise.all([
    supabase
      .from('lesson_completions')
      .select('course_slug, lesson_slug')
      .eq('user_id', userId),
    supabase.from('user_profiles').select('cefr_level').eq('id', userId).maybeSingle(),
  ])

  const completions = (completionsResult.data ?? []) as {
    course_slug: string
    lesson_slug: string
  }[]

  // deriveLevelView keys completions as `${levelId}:${lessonId}`.
  const completedKeys = new Set(
    completions.map((row) => `${row.course_slug}:${row.lesson_slug}`),
  )

  const activeLevel = resolveActiveLevel(
    completedKeys,
    normalizeCefr((profileResult.data as { cefr_level?: string | null } | null)?.cefr_level),
  )
  if (!activeLevel) return null

  const view = deriveLevelView(activeLevel, completedKeys)

  const currentUnit = view.units.find((u) => u.status === 'active') ?? null
  const currentLesson =
    currentUnit?.lessons.find((l) => l.state === 'current') ??
    view.units.flatMap((u) => u.lessons).find((l) => l.state === 'current') ??
    null

  return {
    levelId: activeLevel.id as CefrLevelId,
    levelLabel: LEVEL_LABELS[activeLevel.id as CefrLevelId] ?? String(activeLevel.id).toUpperCase(),
    progressPct: view.progressPercent,
    currentUnitTitle: currentUnit?.unit.title ?? null,
    currentLessonTitle: currentLesson?.title ?? null,
  }
}

/**
 * Mirrors CoursePathAutoLevelSync: the active level is the highest CEFR level
 * with at least one completed core lesson, else the user's stored estimate,
 * else null (no course started yet).
 */
function resolveActiveLevel(
  completedKeys: Set<string>,
  storedLevel: CefrLevelId | null,
): CoursePathLevel | null {
  const levels = COURSE_PATH_CURRICULUM.levels

  for (let i = levels.length - 1; i >= 0; i--) {
    const level = levels[i]
    const hasProgress = getCoreLessons(level).some((lesson) =>
      completedKeys.has(lessonProgressKey(level.id, lesson.id)),
    )
    if (hasProgress) return level
  }

  if (storedLevel) {
    return levels.find((l) => l.id === storedLevel) ?? null
  }

  return null
}

const RESOLVABLE_LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1'] as const

function normalizeCefr(value: string | null | undefined): CefrLevelId | null {
  if (!value) return null
  const lower = value.toLowerCase()
  if (lower === 'c2') return 'c1'
  return (RESOLVABLE_LEVELS as readonly string[]).includes(lower)
    ? (lower as CefrLevelId)
    : null
}
