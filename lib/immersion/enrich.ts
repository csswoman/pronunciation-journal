// Schema y parser puros del enriquecimiento de inmersión. La llamada a Gemini
// vive en lib/gemini/immersion-enrich.ts, según la regla de acceso a la API.
import { z } from 'zod'
import { stripJsonFences } from '@/lib/gemini/client'
import type {
  ImmersionQuizQuestion,
  KeyVocabularyItem,
  TargetPhraseItem,
} from './types'

/** Raw lesson facts scraped from engVid + YouTube, before AI enrichment. */
export interface ImmersionLessonSeed {
  title: string
  teacher: string
  description: string
  categories: string[]
  durationMinutes: number
}

export interface ImmersionEnrichment {
  summary: string
  keyVocabulary: KeyVocabularyItem[]
  targetPhrases: TargetPhraseItem[]
  quiz: ImmersionQuizQuestion[]
}

const ipa = z.string().min(2).max(120)

export const ImmersionEnrichmentSchema = z.object({
  summary: z.string().min(20).max(400),
  keyVocabulary: z.array(z.object({
    word: z.string().min(1).max(60),
    ipa,
    definition: z.string().min(5).max(260),
    contextSentence: z.string().min(5).max(200),
  }).strict()).min(3).max(8),
  targetPhrases: z.array(z.object({
    phrase: z.string().min(2).max(160),
    ipa,
    note: z.string().min(3).max(200),
  }).strict()).min(2).max(6),
  quiz: z.array(z.object({
    question: z.string().min(5).max(320),
    options: z.array(z.string().min(1).max(220)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(5).max(320),
  }).strict()).min(2).max(5),
}).strict()

/**
 * Rejects the placeholder output the old template-based sync produced —
 * bare numbers, slug fragments, and IPA that just echoes the word.
 */
export function isPlaceholderVocabulary(item: { word: string; ipa: string }): boolean {
  const word = item.word.trim()
  if (word.length < 2) return true
  if (/^\d+$/.test(word)) return true
  if (item.ipa.replace(/\//g, '').trim().toLowerCase() === word.toLowerCase()) return true
  return false
}

export function parseImmersionEnrichment(raw: string): ImmersionEnrichment {
  const parsed = ImmersionEnrichmentSchema.parse(JSON.parse(stripJsonFences(raw)))
  if (parsed.keyVocabulary.some(isPlaceholderVocabulary)) {
    throw new Error('enrichment produced placeholder vocabulary')
  }
  return {
    ...parsed,
    quiz: parsed.quiz.map((q, index) => ({ id: `q${index + 1}`, ...q })),
  }
}

/** Un fallo de forma o una plantilla justifican reintentar con otro modelo. */
export function isRetryableEnrichmentError(err: unknown): boolean {
  return (
    err instanceof SyntaxError ||
    err instanceof z.ZodError ||
    String((err as { message?: unknown })?.message ?? '').includes('placeholder')
  )
}
