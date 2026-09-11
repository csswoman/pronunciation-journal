import { decodeHtmlEntities } from './decode-html'
import {
  normalizeImmersionTeacher,
  type ImmersionLevel,
  type ImmersionTeacher,
  type ImmersionTopic,
  type LessonTimestamp,
} from './types'

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export interface ScrapedLessonPage {
  slug: string
  youtubeVideoId: string
  title: string
  description: string
  /** engVid's own category slugs, e.g. ["2-intermediate", "pronunciation"]. */
  categories: string[]
}

export function extractSlug(url: string): string {
  const parts = url.replace(/\/+$/, '').split('/')
  return parts[parts.length - 1] || 'lesson'
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim()
}

export function parseCategories(html: string): string[] {
  const block = html.match(/<div class="featured_category_list">([\s\S]*?)<\/div>/)
  if (!block) return []
  return Array.from(block[1].matchAll(/<a[^>]*>(.*?)<\/a>/g)).map((m) => stripTags(m[1]).toLowerCase())
}

/**
 * engVid etiqueta cada leccion con uno de tres niveles. No publica nada mas
 * fino, asi que el mapeo se queda en tres puntos del MCER en vez de inventar
 * una precision que la fuente no da.
 *
 * Algunas lecciones estan en dos niveles a la vez. Se elige el mas alto: una
 * leccion anunciada como mas facil de lo que es frustra al estudiante.
 */
export function normalizeLevel(categories: string[]): ImmersionLevel {
  const joined = categories.join(' ')
  if (joined.includes('advanced')) return 'C1'
  if (joined.includes('intermediate')) return 'B1'
  if (joined.includes('beginner')) return 'A2'
  return 'B1'
}

export function normalizeTopic(categories: string[], title: string): ImmersionTopic {
  const joined = `${categories.join(' ')} ${title.toLowerCase()}`
  if (joined.includes('pronunciation')) return 'pronunciation'
  if (joined.includes('stress') || joined.includes('intonation')) return 'intonation'
  if (joined.includes('connected') || joined.includes('linking')) return 'connected-speech'
  if (joined.includes('conversation') || joined.includes('speaking')) return 'conversation'
  if (joined.includes('vocabulary') || joined.includes('words') || joined.includes('idiom')) return 'vocabulary'
  return 'speaking'
}

export function parseLessonPage(html: string, url: string): ScrapedLessonPage | null {
  const embed = html.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (!embed) return null

  const titleMatch =
    html.match(/<h1 class="posttitle">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a><\/h1>/) ?? html.match(/<title>([\s\S]*?)<\/title>/)
  const title = titleMatch
    ? stripTags(titleMatch[1]).replace(/\s*[·&]\s*(middot;\s*)?engVid\s*$/i, '').trim()
    : ''
  if (!title) return null

  const descMatch = html.match(/<span class="featured_description"[^>]*>([\s\S]*?)<\/span>/)
  const description = descMatch ? stripTags(descMatch[1]) : ''

  return {
    slug: extractSlug(url),
    youtubeVideoId: embed[1],
    title,
    description,
    categories: parseCategories(html),
  }
}

/**
 * engVid's sidebar links every teacher, so the first `english-teacher/<name>`
 * match in the page is alphabetical, not the lesson's author. The YouTube
 * channel title is the reliable source.
 */
export function teacherFromChannelTitle(authorName: string): ImmersionTeacher | null {
  for (const word of authorName.split(/[^A-Za-z]+/)) {
    const teacher = normalizeImmersionTeacher(word)
    if (teacher) return teacher
  }
  return null
}

export interface YouTubeVideoFacts {
  teacher: ImmersionTeacher | null
  durationMinutes: number | null
}

/** YouTube gates its player API inconsistently, so duration is tried from
 *  several public surfaces and the first plausible answer wins. */
export function parseDurationSeconds(body: string): number | null {
  const match = body.match(/"lengthSeconds"\s*:\s*"?(\d+)/) ?? body.match(/"approxDurationMs"\s*:\s*"?(\d+)/)
  if (!match) return null
  const raw = Number(match[1])
  if (!Number.isFinite(raw) || raw <= 0) return null
  const seconds = match[0].includes('approxDurationMs') ? Math.round(raw / 1000) : raw
  // Guard against parsing an unrelated number from the page shell.
  return seconds > 0 && seconds < 60 * 60 * 12 ? seconds : null
}

async function fetchDurationSeconds(videoId: string): Promise<number | null> {
  const attempts: Array<() => Promise<string>> = [
    async () => {
      const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': BROWSER_UA,
          'X-Youtube-Client-Name': '1',
          'X-Youtube-Client-Version': '2.20240101.00.00',
        },
        body: JSON.stringify({
          context: { client: { clientName: 'WEB', clientVersion: '2.20240101.00.00', hl: 'en', gl: 'US' } },
          videoId,
        }),
      })
      return res.ok ? res.text() : ''
    },
    async () => {
      const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': BROWSER_UA,
          'Accept-Language': 'en-US,en;q=0.9',
          Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+000',
        },
      })
      return res.ok ? res.text() : ''
    },
  ]

  for (const attempt of attempts) {
    try {
      const body = await attempt()
      const seconds = parseDurationSeconds(body)
      if (seconds !== null) return seconds
    } catch {
      // Try the next surface.
    }
  }
  return null
}

/** Author name comes from oEmbed, duration from the surfaces above. Both best-effort. */
export async function fetchYouTubeFacts(videoId: string): Promise<YouTubeVideoFacts> {
  let teacher: ImmersionTeacher | null = null
  let durationMinutes: number | null = null

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { 'User-Agent': BROWSER_UA } },
    )
    if (res.ok) {
      const json = (await res.json()) as { author_name?: string }
      if (json.author_name) teacher = teacherFromChannelTitle(json.author_name)
    }
  } catch {
    // Non-fatal: the caller falls back to the engVid page hint.
  }

  const seconds = await fetchDurationSeconds(videoId)
  if (seconds !== null) durationMinutes = Math.max(1, Math.round(seconds / 60))

  return { teacher, durationMinutes }
}

/**
 * Without a transcript there is no honest way to label a moment, so chapters
 * are evenly spaced study checkpoints derived from the real duration rather
 * than fabricated claims about what happens on screen.
 */
export function buildStudyCheckpoints(durationMinutes: number): LessonTimestamp[] {
  const total = Math.max(60, durationMinutes * 60)
  const labels = [
    'Escucha completa sin pausas',
    'Repite en voz alta con el profesor',
    'Anota las frases que te cuesten',
    'Resume la idea principal en voz alta',
  ]
  return labels.map((label, index) => ({
    seconds: Math.round((total * index) / labels.length),
    label,
  }))
}

export async function fetchLessonHtml(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA } })
  if (!res.ok) return null
  return res.text()
}

export async function fetchRssLessonUrls(): Promise<string[]> {
  const res = await fetch('https://www.engvid.com/feed/', { headers: { 'User-Agent': BROWSER_UA } })
  if (!res.ok) return []
  const xml = await res.text()
  return Array.from(xml.matchAll(/<item>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/g)).map((m) => m[1].trim())
}

/** Una entrada del archivo histórico de engVid (API de WordPress). */
export interface ArchivePost {
  slug: string
  link: string
}

export function parseArchivePosts(payload: unknown): ArchivePost[] {
  if (!Array.isArray(payload)) return []
  return payload.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return []
    const post = entry as { slug?: unknown; link?: unknown }
    return typeof post.slug === 'string' && typeof post.link === 'string'
      ? [{ slug: post.slug, link: post.link }]
      : []
  })
}

/**
 * Ids de las categorías de nivel en el WordPress de engVid. Filtrar por
 * categoría evita descargar y descartar páginas de otros niveles.
 */
const LEVEL_CATEGORY_IDS: Record<ImmersionLevel, number> = {
  A2: 8, // 1-Beginner
  B1: 9, // 2-Intermediate
  C1: 10, // 3-Advanced
}

export const IMMERSION_LEVELS: ImmersionLevel[] = ['A2', 'B1', 'C1']

export function isImmersionLevel(value: string): value is ImmersionLevel {
  return (IMMERSION_LEVELS as string[]).includes(value)
}

/**
 * El RSS solo expone las 10 lecciones más recientes. La API de WordPress
 * pagina el archivo completo (~2300 lecciones), de la más nueva a la más
 * antigua, y es la única vía para crecer más allá del feed. Con `level` la
 * consulta se restringe a la categoría de ese nivel.
 */
export async function fetchArchiveLessonUrls(options: {
  page?: number
  perPage?: number
  level?: ImmersionLevel
} = {}): Promise<ArchivePost[]> {
  const page = options.page ?? 1
  const perPage = Math.min(options.perPage ?? 50, 100)
  const category = options.level ? `&categories=${LEVEL_CATEGORY_IDS[options.level]}` : ''
  const res = await fetch(
    `https://www.engvid.com/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&_fields=slug,link${category}`,
    { headers: { 'User-Agent': BROWSER_UA } },
  )
  if (!res.ok) return []
  return parseArchivePosts(await res.json())
}
