import {
  IMMERSION_TOPIC_RELEVANCE_SYSTEM_PROMPT,
  buildImmersionTopicRelevanceUserPrompt,
} from '@/lib/ai-prompts'
import type { ImmersionTopicRelation } from '@/lib/immersion/types'
import { callWithFallback, shouldTryNextModel } from './client'

export interface TopicRelevanceInput {
  canonicalTopic: {
    title: string
    slug?: string
    description?: string
    keywords?: string
    level?: string
  }
  candidateVideo: {
    title: string
    description: string
    categories: string[]
    level: string
  }
}

export interface TopicRelevanceResult {
  relevance: ImmersionTopicRelation
  confidence: number
  reason: string
}

const ALLOWED_RELEVANCE: ReadonlySet<ImmersionTopicRelation> = new Set([
  'exact',
  'related',
  'complementary',
  'irrelevant',
  'needs_review',
])

export function parseTopicRelevance(rawText: string): TopicRelevanceResult {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('Invalid JSON output for topic relevance')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Expected JSON object for topic relevance')
  }

  const obj = parsed as Record<string, unknown>
  const relevance = typeof obj.relevance === 'string' ? obj.relevance.toLowerCase() : ''

  if (!ALLOWED_RELEVANCE.has(relevance as ImmersionTopicRelation)) {
    throw new Error(`Unexpected relevance value: "${obj.relevance}"`)
  }

  const confidence =
    typeof obj.confidence === 'number' && Number.isFinite(obj.confidence)
      ? Math.max(0, Math.min(1, obj.confidence))
      : 0.8

  const reason =
    typeof obj.reason === 'string' && obj.reason.trim().length > 0
      ? obj.reason.trim().slice(0, 200)
      : 'Clasificado según correspondencia temática observable.'

  return {
    relevance: relevance as ImmersionTopicRelation,
    confidence,
    reason,
  }
}

/**
 * Clasifica la relevancia semántica de un video de EngVid frente a un tema canónico de la Ruta.
 * Usa Gemini con modo JSON y la cadena de fallback compartida.
 */
export async function classifyTopicRelevance(
  apiKey: string,
  input: TopicRelevanceInput,
): Promise<TopicRelevanceResult> {
  return callWithFallback(
    apiKey,
    {
      contents: buildImmersionTopicRelevanceUserPrompt(input),
      config: {
        systemInstruction: IMMERSION_TOPIC_RELEVANCE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    },
    parseTopicRelevance,
    {
      shouldRetry: (err) => shouldTryNextModel(err),
    },
  )
}
