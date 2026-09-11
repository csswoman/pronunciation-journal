/**
 * Sincroniza el catálogo de inmersión desde el RSS de EngVid y enriquece cada
 * lección con Gemini (vocabulario, frases y quiz reales en vez de plantillas).
 * El catálogo vive en Supabase (tabla immersion_lessons) — este script es la
 * única escritura permitida, usando SUPABASE_SERVICE_ROLE_KEY.
 *
 * Uso:
 *   pnpm sync:engvid                      # lecciones nuevas del RSS (solo las 10 más recientes)
 *   pnpm sync:engvid --archive --limit 20 # trae del archivo histórico (~2300 lecciones)
 *   pnpm sync:engvid --archive --level C1 # solo de un nivel (A2, B1 o C1)
 *   pnpm sync:engvid --balance --limit 30 # reparte el límite entre los tres niveles
 *   pnpm sync:engvid --archive --page 5   # empieza en otra página del archivo
 *   pnpm sync:engvid --url <engvid>       # una lección concreta
 *   pnpm sync:engvid --refresh            # re-enriquece las que tengan plantillas
 *
 * Requiere GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
 * Cada lección se hace upsert por youtube_video_id: nunca borra lo existente.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '../lib/supabase/types'
import { enrichImmersionLesson } from '../lib/gemini/immersion-enrich'
import {
  buildStudyCheckpoints,
  fetchArchiveLessonUrls,
  fetchLessonHtml,
  fetchRssLessonUrls,
  fetchYouTubeFacts,
  IMMERSION_LEVELS,
  isImmersionLevel,
  normalizeLevel,
  normalizeTopic,
  parseLessonPage,
} from '../lib/immersion/scrape'
import type { ImmersionLesson, ImmersionLevel, ImmersionTeacher } from '../lib/immersion/types'

const TEACHER_CHANNELS: Record<ImmersionTeacher, string> = {
  Adam: 'https://www.youtube.com/@engVidAdam',
  Alex: 'https://www.youtube.com/@engVidAlex',
  Benjamin: 'https://www.youtube.com/@engvidBenjamin',
  Emma: 'https://www.youtube.com/@engvidEmma',
  Gill: 'https://www.youtube.com/@engVidGill',
  Jade: 'https://www.youtube.com/@engVidJade',
  James: 'https://www.youtube.com/@JamesESL',
  Rebecca: 'https://www.youtube.com/@engVidRebecca',
  Ronnie: 'https://www.youtube.com/@EnglishWithRonnie',
  Jon: 'https://www.youtube.com/@engvid',
}

const DEFAULT_DURATION_MINUTES = 10

function getSupabaseAdmin(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('[sync] falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  return createClient<Database>(url, serviceKey)
}

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
  timestamps: Json
  key_vocabulary: Json
  target_phrases: Json
  quiz: Json
}

function toRow(lesson: ImmersionLesson): ImmersionLessonRow {
  return {
    id: lesson.id,
    slug: lesson.slug,
    youtube_video_id: lesson.youtubeVideoId,
    title: lesson.title,
    teacher: lesson.teacher,
    teacher_channel_url: lesson.teacherChannelUrl,
    level: lesson.level,
    topic: lesson.topic,
    duration_minutes: lesson.durationMinutes,
    summary: lesson.summary,
    timestamps: lesson.timestamps as unknown as Json,
    key_vocabulary: lesson.keyVocabulary as unknown as Json,
    target_phrases: lesson.targetPhrases as unknown as Json,
    quiz: lesson.quiz as unknown as Json,
  }
}

function fromRow(row: ImmersionLessonRow): ImmersionLesson {
  return {
    id: row.id,
    slug: row.slug,
    youtubeVideoId: row.youtube_video_id,
    title: row.title,
    teacher: row.teacher as ImmersionTeacher,
    teacherChannelUrl: row.teacher_channel_url,
    level: row.level as ImmersionLevel,
    topic: row.topic as ImmersionLesson['topic'],
    durationMinutes: row.duration_minutes,
    summary: row.summary,
    timestamps: row.timestamps as unknown as ImmersionLesson['timestamps'],
    keyVocabulary: row.key_vocabulary as unknown as ImmersionLesson['keyVocabulary'],
    targetPhrases: row.target_phrases as unknown as ImmersionLesson['targetPhrases'],
    quiz: row.quiz as unknown as ImmersionLesson['quiz'],
  }
}

async function fetchExistingCatalog(
  supabase: SupabaseClient<Database>,
): Promise<ImmersionLesson[]> {
  const { data, error } = await supabase
    .from('immersion_lessons')
    .select(
      'id, slug, youtube_video_id, title, teacher, teacher_channel_url, level, topic, duration_minutes, summary, timestamps, key_vocabulary, target_phrases, quiz',
    )
  if (error) throw error
  return ((data ?? []) as unknown as ImmersionLessonRow[]).map(fromRow)
}

async function buildLesson(url: string, apiKey: string): Promise<ImmersionLesson | null> {
  console.log(`[sync] ${url}`)

  const html = await fetchLessonHtml(url)
  if (!html) {
    console.warn('  ✗ página inaccesible')
    return null
  }

  const page = parseLessonPage(html, url)
  if (!page) {
    console.warn('  ✗ sin embed de YouTube o sin título')
    return null
  }

  const facts = await fetchYouTubeFacts(page.youtubeVideoId)
  if (!facts.teacher) {
    console.warn(`  ✗ profesor desconocido para ${page.slug}`)
    return null
  }

  const durationMinutes = facts.durationMinutes ?? DEFAULT_DURATION_MINUTES
  const level = normalizeLevel(page.categories)
  const topic = normalizeTopic(page.categories, page.title)

  const enrichment = await enrichImmersionLesson(apiKey, {
    title: page.title,
    teacher: facts.teacher,
    description: page.description,
    categories: page.categories,
    durationMinutes,
  })

  console.log(`  ✓ ${facts.teacher} · ${level} · ${topic} · ${enrichment.keyVocabulary.length} palabras`)

  return {
    id: `engvid-${facts.teacher.toLowerCase()}-${page.slug.slice(0, 30)}`,
    slug: page.slug,
    youtubeVideoId: page.youtubeVideoId,
    title: page.title,
    teacher: facts.teacher,
    teacherChannelUrl: TEACHER_CHANNELS[facts.teacher],
    level,
    topic,
    durationMinutes,
    summary: enrichment.summary,
    timestamps: buildStudyCheckpoints(durationMinutes),
    keyVocabulary: enrichment.keyVocabulary,
    targetPhrases: enrichment.targetPhrases,
    quiz: enrichment.quiz,
  }
}

async function upsertLessons(
  supabase: SupabaseClient<Database>,
  lessons: ImmersionLesson[],
): Promise<void> {
  const { error } = await supabase
    .from('immersion_lessons')
    .upsert(lessons.map(toRow), { onConflict: 'youtube_video_id' })
  if (error) throw error
  console.log(`[sync] ${lessons.length} lecciones escritas en Supabase`)
}

function readFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

/**
 * Detecta lecciones generadas por la versión anterior del script, que rellenaba
 * vocabulario con el slug, números sueltos y definiciones plantilla.
 */
export function hasTemplateContent(lesson: ImmersionLesson): boolean {
  return lesson.keyVocabulary.some(
    (item) =>
      /^\d+$/.test(item.word.trim()) ||
      item.ipa.replace(/\//g, '').trim().toLowerCase() === item.word.trim().toLowerCase() ||
      item.definition.includes('Término o estructura clave'),
  )
}

/**
 * El archivo va de lo más nuevo a lo más viejo, así que se avanza por páginas
 * hasta juntar `limit` lecciones que aún no estén en el catálogo.
 */
async function collectFromArchive(options: {
  limit: number
  knownSlugs: Set<string>
  startPage: number
  level?: ImmersionLevel
}): Promise<string[]> {
  const { limit, knownSlugs, startPage, level } = options
  const label = level ? `${level} ` : ''
  const fresh: string[] = []
  for (let page = startPage; page < startPage + 20 && fresh.length < limit; page += 1) {
    const posts = await fetchArchiveLessonUrls({ page, perPage: 100, level })
    if (posts.length === 0) break
    for (const post of posts) {
      if (!knownSlugs.has(post.slug)) {
        fresh.push(post.link)
        // Una lección puede estar en dos categorías de nivel. Reservarla aquí
        // evita enriquecerla dos veces y gastar una llamada a Gemini de más.
        knownSlugs.add(post.slug)
      }
      if (fresh.length >= limit) break
    }
    console.log(`[sync] archivo ${label}página ${page}: ${fresh.length}/${limit} candidatas`)
  }
  return fresh.slice(0, limit)
}

/** Reparte el presupuesto entre los tres niveles para que ninguno se quede vacío. */
export function splitLimitByLevel(limit: number, levels: ImmersionLevel[]): Map<ImmersionLevel, number> {
  const base = Math.floor(limit / levels.length)
  let remainder = limit % levels.length
  return new Map(
    levels.map((level) => {
      const extra = remainder > 0 ? 1 : 0
      remainder -= extra
      return [level, base + extra]
    }),
  )
}

async function collectBalanced(
  limit: number,
  knownSlugs: Set<string>,
  startPage: number,
): Promise<string[]> {
  const quota = splitLimitByLevel(limit, IMMERSION_LEVELS)
  const urls: string[] = []
  for (const level of IMMERSION_LEVELS) {
    const share = quota.get(level) ?? 0
    if (share === 0) continue
    urls.push(...(await collectFromArchive({ limit: share, knownSlugs, startPage, level })))
  }
  return urls
}

async function resolveUrls(args: string[], existingCatalog: ImmersionLesson[]): Promise<string[]> {
  const single = readFlag(args, '--url')
  if (single) return [single]

  const limit = Number(readFlag(args, '--limit') ?? 10)

  if (args.includes('--refresh')) {
    const stale = existingCatalog.filter(hasTemplateContent)
    console.log(`[sync] ${stale.length} lecciones con contenido de plantilla`)
    return stale.slice(0, limit).map((lesson) => `https://www.engvid.com/${lesson.slug}/`)
  }

  const knownSlugs = new Set(existingCatalog.map((lesson) => lesson.slug))

  if (args.includes('--balance')) {
    return collectBalanced(limit, knownSlugs, Number(readFlag(args, '--page') ?? 1))
  }

  if (args.includes('--archive')) {
    const startPage = Number(readFlag(args, '--page') ?? 1)
    const level = readFlag(args, '--level')
    if (level && !isImmersionLevel(level)) {
      console.error(`[sync] nivel desconocido "${level}" — usa ${IMMERSION_LEVELS.join(', ')}`)
      return []
    }
    return collectFromArchive({
      limit,
      knownSlugs,
      startPage,
      level: level as ImmersionLevel | undefined,
    })
  }

  const rssUrls = await fetchRssLessonUrls()
  const fresh = rssUrls.filter((url) => !knownSlugs.has(url.replace(/\/+$/, '').split('/').pop() ?? ''))
  console.log(`[sync] ${rssUrls.length} en el feed, ${fresh.length} nuevas`)
  if (fresh.length === 0 && rssUrls.length > 0) {
    console.log('[sync] el RSS solo lista las 10 más recientes — usa --archive para traer del histórico')
  }
  return fresh.slice(0, limit)
}

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[sync] falta GEMINI_API_KEY')
    process.exit(1)
  }

  const supabase = getSupabaseAdmin()
  const existingCatalog = await fetchExistingCatalog(supabase)

  const args = process.argv.slice(2)
  const urls = await resolveUrls(args, existingCatalog)
  if (urls.length === 0) {
    console.log('[sync] no hay lecciones nuevas')
    return
  }

  const lessons: ImmersionLesson[] = []
  for (const url of urls) {
    try {
      const lesson = await buildLesson(url, apiKey)
      if (lesson) lessons.push(lesson)
    } catch (err) {
      // Una lección fallida no debe abortar el lote completo.
      console.warn(`  ✗ ${url}: ${(err as Error).message}`)
    }
  }

  if (lessons.length === 0) {
    console.log('[sync] ninguna lección se pudo procesar; catálogo sin cambios')
    return
  }

  await upsertLessons(supabase, lessons)
}

if (process.argv[1]?.includes('sync-engvid-lessons')) {
  main().catch((err) => {
    console.error('[sync] error:', err)
    process.exit(1)
  })
}
