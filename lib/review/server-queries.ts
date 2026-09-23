import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSoundsDueForHome } from '@/lib/home/queries'
import {
  getWeakWordsForReviewServer,
  getWordsDueForReview,
} from '@/lib/word-bank/server-queries'
import {
  computeCanStartReview,
  resolveFailedSentenceLookups,
  rowsToFailedItems,
  SENTENCE_EXERCISE_IDS,
  type FailedHistoryRow,
} from '@/lib/review/failed-sentences-core'
import type { ReviewHubSummary, TopicSrsRow } from '@/lib/review/types'
import { filterReviewableTopics, getDueEssentialWords } from '@/lib/review/candidate-queries'

const LESSON_REVIEW_INTERVAL_DAYS = 7

async function loadFailedSentenceItemsServer(
  userId: string,
  limit: number,
): Promise<import('@/lib/review/types').FailedSentenceItem[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('answer_history')
    .select('content_id, exercise_type_id, answered_at, target_word, user_answer, exercise_types(slug)')
    .eq('user_id', userId)
    .eq('is_correct', false)
    .in('exercise_type_id', [...SENTENCE_EXERCISE_IDS])
    .order('answered_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  const rows = data as FailedHistoryRow[]

  // Find the most recent failure timestamp per content_id so we can check
  // if the user has since answered it correctly (i.e. "redeemed" it).
  const latestFailAt = new Map<string, string>()
  for (const row of rows) {
    if (!row.content_id || !row.answered_at) continue
    if (!latestFailAt.has(row.content_id)) latestFailAt.set(row.content_id, row.answered_at)
  }

  const contentIds = [...latestFailAt.keys()]
  const redeemedIds = new Set<string>()

  if (contentIds.length > 0) {
    const { data: successes } = await supabase
      .from('answer_history')
      .select('content_id, answered_at')
      .eq('user_id', userId)
      .eq('is_correct', true)
      .in('content_id', contentIds)

    for (const row of successes ?? []) {
      if (!row.content_id || !row.answered_at) continue
      const failedAt = latestFailAt.get(row.content_id)
      if (failedAt && row.answered_at > failedAt) redeemedIds.add(row.content_id)
    }
  }

  const unredeemed = rows.filter((r) => r.content_id && !redeemedIds.has(r.content_id))

  const { fragments, words } = await resolveFailedSentenceLookups(
    unredeemed,
    async (ids) => {
      const { data: fragments } = await supabase
        .from('text_fragments')
        .select('id, content, title')
        .in('id', ids)
      return fragments ?? []
    },
    async (ids) => {
      const { data: bankWords } = await supabase
        .from('word_bank')
        .select('id, text, example')
        .in('id', ids)
      return bankWords ?? []
    },
  )
  return rowsToFailedItems(unredeemed, limit, fragments, words)
}

const TOPIC_COLS = 'id, topic, interval_days, next_review_at, srs_status, ease_factor, last_reviewed_at'

async function getDueTopicsForReview(userId: string, limit = 6): Promise<TopicSrsRow[]> {
  const supabase = await createSupabaseServerClient()
  const today = new Date().toISOString()
  const { data, error } = await supabase
    .from('topic_srs')
    .select(TOPIC_COLS)
    .eq('user_id', userId)
    .in('srs_status', ['review', 'mastered'])
    .lte('next_review_at', today)
    .order('next_review_at', { ascending: true })
    .limit(limit)
  if (error) {
    console.error('[review] getDueTopicsForReview failed', error)
    return []
  }
  return (data ?? []) as TopicSrsRow[]
}

async function getWeakTopicsForReview(userId: string, limit = 6): Promise<TopicSrsRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('topic_srs')
    .select(TOPIC_COLS)
    .eq('user_id', userId)
    .in('srs_status', ['new', 'learning'])
    .order('ease_factor', { ascending: true })
    .limit(limit)
  if (error) {
    console.error('[review] getWeakTopicsForReview failed', error)
    return []
  }
  return (data ?? []) as TopicSrsRow[]
}

async function getDueLessonsForReview(
  userId: string,
  limit = 4,
): Promise<import('./types').LessonReviewItem[]> {
  const supabase = await createSupabaseServerClient()
  const items: import('./types').LessonReviewItem[] = []

  try {
    const cutoff = new Date(Date.now() - LESSON_REVIEW_INTERVAL_DAYS * 86_400_000).toISOString()
    // 1. Lecciones de inmersión vistas
    const { data: immersionData } = await supabase
      .from('immersion_lesson_progress')
      .select('lesson_id, watched_at, quiz_score, updated_at')
      .eq('user_id', userId)
      .eq('watched', true)
      .lte('updated_at', cutoff)
      .order('updated_at', { ascending: true })
      .limit(limit)

    if (immersionData && immersionData.length > 0) {
      const lessonIds = immersionData.map((d) => d.lesson_id)
      const { data: lessons } = await supabase
        .from('immersion_lessons')
        .select('id, slug, title, teacher, level, summary')
        .in('id', lessonIds)

      const lessonMap = new Map((lessons ?? []).map((l) => [l.id, l]))

      for (const p of immersionData) {
        const l = lessonMap.get(p.lesson_id)
        if (l) {
          const lastStudiedAt = p.updated_at || p.watched_at || new Date().toISOString()
          const daysSinceStudy = Math.max(
            0,
            0,
            Math.floor((Date.now() - new Date(lastStudiedAt).getTime()) / (1000 * 60 * 60 * 24)),
          )
          const dueAt = new Date(
            new Date(lastStudiedAt).getTime() + LESSON_REVIEW_INTERVAL_DAYS * 86_400_000,
          ).toISOString()
          items.push({
            id: `immersion:${l.id}`,
            title: l.title,
            type: 'immersion',
            typeLabel: `Inmersión · ${l.level} (Teacher ${l.teacher})`,
            url: `/practice/immersion/${l.slug}`,
            lastStudiedAt,
            dueAt,
            daysSinceStudy,
            summary: l.summary,
          })
        }
      }
    }
  } catch (err) {
    console.error('[review] getDueLessonsForReview failed', err)
  }

  return items.slice(0, limit)
}

import { fetchExactReviewQueueCounts } from './queue-count-queries'
import type { AggregatedReviewSummary } from './summary-types'

export { fetchExactReviewQueueCounts }
export type { AggregatedReviewSummary }

/** Server: full hub summary for `/practice/review`. */
export async function getReviewHubSummary(userId: string): Promise<ReviewHubSummary> {
  const [failedSentences, weakWords, dueWords, soundsDueRaw, dueTopicsRaw, weakTopicsRaw, dueLessons, essentialWordsDue] =
    await Promise.all([
      loadFailedSentenceItemsServer(userId, 5),
      getWeakWordsForReviewServer(userId, 6),
      getWordsDueForReview(userId, 6),
      getSoundsDueForHome(userId),
      getDueTopicsForReview(userId, 6),
      getWeakTopicsForReview(userId, 6),
      getDueLessonsForReview(userId, 4),
      getDueEssentialWords(userId, 12),
    ])
  const soundsDue = soundsDueRaw.filter((sound) => sound.soundId > 0)
  const dueTopics = filterReviewableTopics(dueTopicsRaw)
  const weakTopics = filterReviewableTopics(weakTopicsRaw)

  const queueCounts = await fetchExactReviewQueueCounts(userId, {
    soundsDueCount: soundsDue.length,
    chunksDueCount: 0,
  })

  const sessionCandidates = {
    failedSentences,
    weakWords,
    dueWords,
    soundsDue,
    dueTopics,
    weakTopics,
    dueLessons,
    essentialWordsDue,
  }

  const canStartReview = computeCanStartReview({
    failedSentences,
    weakWords,
    dueWords,
    soundsDue,
    dueTopics,
    weakTopics,
    dueLessons,
    essentialWordsDue,
  })

  return {
    failedSentences,
    weakWords,
    dueWords,
    soundsDue,
    dueTopics,
    weakTopics,
    dueLessons,
    essentialWordsDue,
    queueCounts,
    sessionCandidates,
    counts: queueCounts,
    nothingDue: queueCounts.executable === 0,
    canStartReview,
  }
}

export async function getAggregatedReviewSummary(userId: string): Promise<AggregatedReviewSummary> {
  const soundsDue = (await getSoundsDueForHome(userId)).filter((s) => s.soundId > 0)
  const queueCounts = await fetchExactReviewQueueCounts(userId, {
    soundsDueCount: soundsDue.length,
  })

  const hasPendingReview = queueCounts.executable > 0

  let primaryQueue: AggregatedReviewSummary['primaryQueue'] = null
  let headline = 'Todo al día'
  let subtext = 'No tienes repasos pendientes por ahora.'

  if (queueCounts.dueWords > 0) {
    primaryQueue = 'words'
    headline = `${queueCounts.dueWords} ${queueCounts.dueWords === 1 ? 'palabra espera' : 'palabras esperan'} repaso`
    subtext = 'Repasarlas hoy las mantiene en memoria a largo plazo · unos 5 min'
  } else if (queueCounts.essentialWordsDue > 0) {
    primaryQueue = 'essential_words'
    headline = `${queueCounts.essentialWordsDue} palabras esenciales esperan repaso`
    subtext = 'Afianza vocabulario de alta frecuencia para hablar con soltura.'
  } else if (queueCounts.dueTopics > 0) {
    primaryQueue = 'topics'
    headline = `${queueCounts.dueTopics} temas gramaticales esperan repaso`
    subtext = 'Refuerza los conceptos antes de que se olviden.'
  } else if (queueCounts.failedSentences > 0) {
    primaryQueue = 'sentences'
    headline = `${queueCounts.failedSentences} oraciones esperan corrección`
    subtext = 'Corrige tus errores recientes para no repetirlos.'
  } else if (queueCounts.dueLessons > 0) {
    primaryQueue = 'lessons'
    headline = `${queueCounts.dueLessons} lecciones esperan repaso`
    subtext = 'Vuelve a repasar el contenido visto en inmersión.'
  } else if (queueCounts.soundsDue > 0) {
    primaryQueue = 'sounds'
    headline = `${queueCounts.soundsDue} sonidos esperan repaso`
    subtext = 'Entrena tu oído con pares mínimos.'
  } else if (queueCounts.weakWords > 0) {
    primaryQueue = 'words'
    headline = `${queueCounts.weakWords} palabras nuevas o en aprendizaje`
    subtext = 'Practica para afianzarlas en tu vocabulario.'
  }

  return {
    hasPendingReview,
    totalDue: queueCounts.executable,
    queueCounts,
    primaryQueue,
    headline,
    subtext,
  }
}
