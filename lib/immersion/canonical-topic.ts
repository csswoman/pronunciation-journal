import { COURSE_PATH_CURRICULUM } from '../courses/curriculum'
import type { CoursePathLesson, CoursePathLevel } from '../courses/types'
import type { ImmersionLevel } from './types'

const ALL_LEVELS: CoursePathLevel[] = [
  ...COURSE_PATH_CURRICULUM.levels,
  ...COURSE_PATH_CURRICULUM.electiveTracks,
]

export interface CanonicalTopic {
  title: string
  slug: string
  level: string
  engVidLevel: ImmersionLevel
  description?: string
  keywords?: string
  searchTerms: string[]
}

export function cefrToEngVidLevel(cefr: string): ImmersionLevel {
  const upper = cefr.trim().toUpperCase()
  if (upper.startsWith('C')) return 'C1'
  if (upper.startsWith('B')) return 'B1'
  return 'A2'
}

export const SPANISH_TO_ENGLISH_GRAMMAR: Record<string, string> = {
  presente: 'present',
  pasado: 'past',
  futuro: 'future',
  simple: 'simple',
  continuo: 'continuous',
  perfecto: 'perfect',
  articulos: 'articles',
  artículos: 'articles',
  demostrativos: 'demonstratives',
  plurales: 'plurals',
  adverbios: 'adverbs',
  preposiciones: 'prepositions',
  rutinas: 'routines',
  habitos: 'habits',
  hábitos: 'habits',
  preguntas: 'questions',
  condicionales: 'conditionals',
  posesivos: 'possessives',
  pronombres: 'pronouns',
  verbos: 'verbs',
  comparativos: 'comparatives',
  superlativos: 'superlatives',
  modales: 'modals',
  imperativo: 'imperative',
  ingles: 'english',
  inglés: 'english',
  principiantes: 'beginners',
  frases: 'phrases',
  saludos: 'greetings',
  experiencias: 'experiences',
  planes: 'plans',
  descripciones: 'descriptions',
  comparaciones: 'comparisons',
  cuantificadores: 'quantifiers',
  esenciales: 'essential',
  expresiones: 'expressions',
  tiempo: 'time',
  grado: 'degree',
  colocaciones: 'collocations',
  comunes: 'common',
  indefinidos: 'indefinite',
  obligacion: 'obligation',
  obligación: 'obligation',
  prohibicion: 'prohibition',
  prohibición: 'prohibition',
  consejo: 'advice',
  posibilidad: 'possibility',
  respuestas: 'answers',
  indirectas: 'indirect',
  confusos: 'confusing',
  reflexivos: 'reflexive',
  determinantes: 'determiners',
  propuestas: 'proposals',
  permisos: 'permissions',
  entonacion: 'intonation',
  entonación: 'intonation',
  prosodia: 'prosody',
  reducciones: 'reductions',
  reduccion: 'reduction',
  pronunciacion: 'pronunciation',
  pronunciación: 'pronunciation',
  sonidos: 'sounds',
  enlazar: 'linking',
  enlace: 'linking',
  elision: 'elision',
  elisión: 'elision',
  asimilacion: 'assimilation',
  asimilación: 'assimilation',
  conectado: 'connected',
  actitud: 'attitude',
  cortesia: 'politeness',
  cortesía: 'politeness',
  foco: 'focus',
  nuclear: 'nuclear',
}

export function extractEnglishSearchTerms(slug: string, title: string): string[] {
  const terms = new Set<string>()

  const parenMatch = title.match(/\((.*?)\)/)
  if (parenMatch?.[1]) {
    const raw = parenMatch[1].toLowerCase()
    const converted = raw
      .split(/\s+/)
      .map((w) => SPANISH_TO_ENGLISH_GRAMMAR[w] || w)
      .join(' ')
    terms.add(converted)
  }

  const slugWords = slug
    .replace(/^[abc][12]-/, '')
    .split('-')
    .map((w) => SPANISH_TO_ENGLISH_GRAMMAR[w.toLowerCase()] || w)
  if (slugWords.length > 0) {
    terms.add(slugWords.join(' '))
  }

  const quotesMatch = title.match(/['"“](.*?)['"”]/)
  if (quotesMatch?.[1]) terms.add(quotesMatch[1])

  return Array.from(terms).filter((t) => t.length > 2)
}

export function buildCanonicalTopic(lesson: CoursePathLesson, trackId: string): CanonicalTopic {
  const searchTerms = extractEnglishSearchTerms(lesson.slug || lesson.id, lesson.title)

  if (lesson.keywords) {
    const kw = lesson.keywords
      .split(/[·,]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 2 && /^[a-zA-Z\s]+$/.test(k))
      .slice(0, 2)
    if (kw.length > 0) searchTerms.push(kw.join(' '))
  }

  return {
    title: lesson.title,
    slug: lesson.slug || lesson.id,
    level: trackId.toUpperCase(),
    engVidLevel: cefrToEngVidLevel(trackId),
    description: lesson.description,
    keywords: lesson.keywords,
    searchTerms: searchTerms.length > 0 ? searchTerms : [lesson.title],
  }
}

export function findCanonicalTopic(slugOrId: string): CanonicalTopic | null {
  for (const level of ALL_LEVELS) {
    for (const unit of level.units) {
      const lesson = unit.lessons.find(
        (l) => l.slug === slugOrId || l.id === slugOrId || l.topicId === slugOrId,
      )
      if (lesson) return buildCanonicalTopic(lesson, level.id)
    }
  }

  const cleanSlug = slugOrId.trim().toLowerCase()
  const levelPrefix = cleanSlug.split('-')[0]
  const levelStr = /^[abc][12]$/.test(levelPrefix) ? levelPrefix.toUpperCase() : 'A2'
  const title = cleanSlug
    .replace(/^[abc][12]-/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return {
    title,
    slug: cleanSlug,
    level: levelStr,
    engVidLevel: cefrToEngVidLevel(levelStr),
    searchTerms: [title],
  }
}

export function getCurriculumTopicSlugs(levelId?: string): string[] {
  const levelsToScan = levelId
    ? ALL_LEVELS.filter((l) => l.id.toLowerCase() === levelId.toLowerCase())
    : COURSE_PATH_CURRICULUM.levels

  const slugs: string[] = []
  for (const level of levelsToScan) {
    for (const unit of level.units) {
      for (const lesson of unit.lessons) {
        const s = lesson.slug || lesson.id
        if (s && !slugs.includes(s)) {
          slugs.push(s)
        }
      }
    }
  }
  return slugs
}

