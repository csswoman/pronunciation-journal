// Variante server-side de lib/immersion/queries.ts, para Server Components
// (app/(authenticated)/practice/immersion/*). Misma tabla, mismo mapeo de
// filas; solo cambia el cliente de Supabase usado.
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type {
  ImmersionLesson,
  ImmersionLessonMetadata,
  ImmersionLevel,
  ImmersionQuizQuestion,
  ImmersionTeacher,
  ImmersionTopic,
  KeyVocabularyItem,
  LessonTimestamp,
  TargetPhraseItem,
} from './types'

interface ImmersionLessonRow {
  id: string
  slug: string
  youtube_video_id: string
  title: string
  teacher: string
  teacher_channel_url: string
  level: string
  topic: string
  duration_minutes: number
  summary: string
  timestamps: LessonTimestamp[]
  key_vocabulary: KeyVocabularyItem[]
  target_phrases: TargetPhraseItem[]
  quiz: ImmersionQuizQuestion[]
  metadata?: ImmersionLessonMetadata
}

const SELECT_COLUMNS =
  'id, slug, youtube_video_id, title, teacher, teacher_channel_url, level, topic, duration_minutes, summary, timestamps, key_vocabulary, target_phrases, quiz, metadata'

function toLesson(row: ImmersionLessonRow): ImmersionLesson {
  return {
    id: row.id,
    slug: row.slug,
    youtubeVideoId: row.youtube_video_id,
    title: row.title,
    teacher: row.teacher as ImmersionTeacher,
    teacherChannelUrl: row.teacher_channel_url,
    level: row.level as ImmersionLevel,
    topic: row.topic as ImmersionTopic,
    durationMinutes: row.duration_minutes,
    summary: row.summary,
    timestamps: row.timestamps,
    keyVocabulary: row.key_vocabulary,
    targetPhrases: row.target_phrases,
    quiz: row.quiz,
    metadata: row.metadata ?? {},
  }
}

export async function fetchImmersionLessonsServer(): Promise<ImmersionLesson[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('immersion_lessons')
    .select(SELECT_COLUMNS)
    .order('slug', { ascending: true })

  if (error) throw error
  return ((data ?? []) as unknown as ImmersionLessonRow[]).map(toLesson)
}

export async function fetchImmersionLessonBySlugServer(slug: string): Promise<ImmersionLesson | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('immersion_lessons')
    .select(SELECT_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data ? toLesson(data as unknown as ImmersionLessonRow) : null
}

export async function fetchServerImmersionLessonForTopic(
  topicSlug: string,
): Promise<ImmersionLesson | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('immersion_lessons')
    .select(SELECT_COLUMNS)
    .filter('metadata->>canonicalTopic', 'eq', topicSlug)
    .limit(10)

  if (error || !data || data.length === 0) return null
  const lessons = (data as unknown as ImmersionLessonRow[]).map(toLesson)
  const exact = lessons.find((l) => l.metadata?.relation === 'exact')
  if (exact) return exact
  const related = lessons.find((l) => l.metadata?.relation === 'related')
  if (related) return related
  return lessons[0] ?? null
}

interface ProgressRow {
  lesson_id: string
  watched: boolean
  watched_at: string | null
  quiz_score: number | null
  updated_at: string
}

export async function fetchUserImmersionProgressServer(
  userId: string,
): Promise<import('./types').ImmersionProgressMap> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('immersion_lesson_progress')
    .select('lesson_id, watched, watched_at, quiz_score, updated_at')
    .eq('user_id', userId)

  if (error || !data) return {}

  const rows = data as unknown as ProgressRow[]
  const map: import('./types').ImmersionProgressMap = {}

  for (const r of rows) {
    let status: import('./types').ImmersionLessonStatus = 'not_started'
    if (r.quiz_score != null) {
      status = r.quiz_score >= 70 ? 'completed' : 'in_progress'
    } else if (r.watched) {
      status = 'in_progress'
    }

    map[r.lesson_id] = {
      lessonId: r.lesson_id,
      watched: r.watched,
      status,
      watchedAt: r.watched_at ?? undefined,
      quizScore: r.quiz_score ?? undefined,
      completedAt: status === 'completed' ? (r.updated_at ?? r.watched_at ?? undefined) : undefined,
    }
  }

  return map
}

const TOPIC_ALIASES: Record<string, string[]> = {
  'connected-speech': ['cs-linking', 'cs-reductions', 'cs-elision', 'cs-assimilation'],
  reductions: ['cs-reductions'],
  intonation: ['c1-entonacion-actitud-cortesia', 'c1-prosodia-thought-groups-foco-nuclear'],
  pronunciacion: ['a1-pronunciacion-basica', 'b2-pronunciacion-intermedia', 'c1-pronunciacion-avanzada'],
}

/**
 * Devuelve un mapa con todas las lecciones de inmersión indexadas por canonicalTopic
 * para Server Components (ej. catálogo de cursos /courses).
 * Prioriza relación 'exact' sobre 'related'.
 */
export async function fetchServerTopicImmersionMap(): Promise<Record<string, ImmersionLesson>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('immersion_lessons')
    .select(SELECT_COLUMNS)
    .not('metadata->>canonicalTopic', 'is', null)

  if (error || !data) return {}

  const lessons = (data as unknown as ImmersionLessonRow[]).map(toLesson)
  const map: Record<string, ImmersionLesson> = {}

  for (const lesson of lessons) {
    const topic = lesson.metadata?.canonicalTopic
    if (!topic) continue

    const targetTopics = [topic, ...(TOPIC_ALIASES[topic] ?? [])]

    for (const t of targetTopics) {
      const existing = map[t]
      if (!existing) {
        map[t] = lesson
        continue
      }

      const isExact = lesson.metadata?.relation === 'exact'
      const existingIsExact = existing.metadata?.relation === 'exact'
      if (isExact && !existingIsExact) {
        map[t] = lesson
      }
    }
  }

  return map
}


