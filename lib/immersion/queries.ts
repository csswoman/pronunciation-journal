// Toda lectura del catálogo de inmersión pasa por aquí — regla de acceso a
// Supabase. La tabla es contenido de sistema (igual para todos los usuarios,
// sin user_id); la escritura solo ocurre desde scripts/sync-engvid-lessons.ts
// con la service_role key, nunca desde el cliente.
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
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

/** Catálogo completo, para /practice/immersion (filtrado en el cliente). */
export async function fetchImmersionLessons(): Promise<ImmersionLesson[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('immersion_lessons')
    .select(SELECT_COLUMNS)
    .order('slug', { ascending: true })

  if (error) throw error
  return ((data ?? []) as unknown as ImmersionLessonRow[]).map(toLesson)
}

export async function fetchImmersionLessonBySlug(slug: string): Promise<ImmersionLesson | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('immersion_lessons')
    .select(SELECT_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data ? toLesson(data as unknown as ImmersionLessonRow) : null
}

/**
 * Busca una lección de inmersión asociada a un tema canónico de la Ruta.
 * Prioriza relación 'exact', luego 'related'.
 */
export async function fetchImmersionLessonForTopic(
  topicSlug: string,
): Promise<ImmersionLesson | null> {
  const client = getSupabaseBrowserClient()
  const { data, error } = await client
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

/**
 * Candidata para el paso "immersion_lesson" del plan diario: una lección del
 * nivel del usuario, evitando las que ya vio. Sin match de nivel, cede a la
 * lección más corta disponible en vez de dejar el paso vacío.
 * Si se indica `preferTopic`, prioriza una lección vinculada a dicho tema.
 */
export async function fetchImmersionLessonForDay(
  level: ImmersionLevel,
  excludeIds: Set<string>,
  preferTopic?: string,
): Promise<ImmersionLesson | null> {
  if (preferTopic) {
    const topicMatch = await fetchImmersionLessonForTopic(preferTopic).catch(() => null)
    if (topicMatch && !excludeIds.has(topicMatch.id)) {
      return topicMatch
    }
  }

  const client = getSupabaseBrowserClient()

  const { data, error } = await client
    .from('immersion_lessons')
    .select(SELECT_COLUMNS)
    .eq('level', level)
    .order('duration_minutes', { ascending: true })
    .limit(50)

  if (error) throw error

  const candidates = ((data ?? []) as unknown as ImmersionLessonRow[]).map(toLesson)
  const fresh = candidates.find((lesson) => !excludeIds.has(lesson.id))
  if (fresh) return fresh
  if (candidates.length > 0) return candidates[0]

  // Nivel sin lecciones todavía: cualquier lección no vista es mejor que nada.
  const { data: fallbackData, error: fallbackError } = await client
    .from('immersion_lessons')
    .select(SELECT_COLUMNS)
    .order('duration_minutes', { ascending: true })
    .limit(50)

  if (fallbackError) throw fallbackError
  const fallback = ((fallbackData ?? []) as unknown as ImmersionLessonRow[]).map(toLesson)
  return fallback.find((lesson) => !excludeIds.has(lesson.id)) ?? fallback[0] ?? null
}

const TOPIC_ALIASES: Record<string, string[]> = {
  'connected-speech': ['cs-linking', 'cs-reductions', 'cs-elision', 'cs-assimilation'],
  reductions: ['cs-reductions'],
  intonation: ['c1-entonacion-actitud-cortesia', 'c1-prosodia-thought-groups-foco-nuclear'],
  pronunciacion: ['a1-pronunciacion-basica', 'b2-pronunciacion-intermedia', 'c1-pronunciacion-avanzada'],
}

/**
 * Devuelve un mapa con todas las lecciones de inmersión indexadas por canonicalTopic
 * para componentes de cliente.
 * Prioriza relación 'exact' sobre 'related'.
 */
export async function fetchTopicImmersionMap(): Promise<Record<string, ImmersionLesson>> {
  const client = getSupabaseBrowserClient()
  const { data, error } = await client
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


