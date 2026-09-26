import { db, type GradedAnswerRecord } from '@/lib/db'
import { gradeProduction } from './grade-production-client'
import type { GradeProductionInput, ProductionGradeResult } from './production-grade'

const CACHE_VERSION = 'v1'
const CONTRACTIONS: Record<string, string> = {
  "can't": 'cannot', "won't": 'will not', "don't": 'do not', "doesn't": 'does not',
  "didn't": 'did not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not',
  "weren't": 'were not', "haven't": 'have not', "hasn't": 'has not', "hadn't": 'had not',
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are',
  "it's": 'it is', "i've": 'i have', "you've": 'you have', "we've": 'we have',
  "they've": 'they have', "i'll": 'i will', "you'll": 'you will', "we'll": 'we will',
  "they'll": 'they will', "i'd": 'i would', "you'd": 'you would', "shouldn't": 'should not',
  "wouldn't": 'would not', "couldn't": 'could not', "mustn't": 'must not',
}

export function normalizeAcceptedAnswer(value: string): string {
  let normalized = value.toLocaleLowerCase('en-US').replaceAll('’', "'").trim()
  for (const [short, expanded] of Object.entries(CONTRACTIONS)) {
    normalized = normalized.replace(new RegExp(`\\b${short.replace("'", "\\'")}\\b`, 'g'), expanded)
  }
  return normalized.replace(/[.!?]+$/g, '').replace(/[^a-z0-9'\s]/g, '').replace(/\s+/g, ' ').trim()
}

export function matchesAcceptedAnswer(answer: string, candidates: readonly string[]): boolean {
  const normalized = normalizeAcceptedAnswer(answer)
  return candidates.some((candidate) => normalizeAcceptedAnswer(candidate) === normalized)
}

function localResult(correct: boolean, feedback: string, corrections?: string): ProductionGradeResult {
  return {
    correct, usedTarget: correct, grammaticallyCorrect: correct, constraintMet: correct,
    feedback, corrections, score: correct ? 100 : 0,
  }
}

async function cacheKey(userId: string, exerciseKey: string, normalized: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${CACHE_VERSION}:${userId}:${exerciseKey}:${normalized}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export interface LocalFirstInput {
  userId: string
  exerciseKey: string
  gradeInput: GradeProductionInput
  acceptedAnswers?: readonly string[]
  sourceSentence?: string
  fixedReference?: boolean
  /**
   * Runs once the local branches miss, right before spending a request. Throw
   * to answer the attempt locally instead; nothing is cached in that case.
   * See `grading-attempts.ts`.
   */
  beforeAiCall?: () => void
}

export interface GradingPipelineDeps {
  gradeProduction: (input: GradeProductionInput) => Promise<ProductionGradeResult>
  isAccepted: (userId: string, exerciseKey: string, normalized: string) => Promise<boolean>
  getCached: (key: string) => Promise<ProductionGradeResult | undefined>
  save: (record: GradedAnswerRecord) => Promise<void>
}

/** Dexie-backed cache and answer bank; only usable for a signed-in account. */
export const dexieGradingDeps: GradingPipelineDeps = {
  gradeProduction,
  async isAccepted(userId, exerciseKey, normalized) {
    const row = await db.gradedAnswers
      .where('[userId+exerciseKey+normalized]').equals([userId, exerciseKey, normalized]).first()
    return row?.accepted === 1
  },
  async getCached(key) { return (await db.gradedAnswers.get(key))?.result },
  async save(record) { await db.gradedAnswers.put(record) },
}

/**
 * Cache for anonymous practice: lives as long as the component, never touches
 * the device database, and still stops a resubmission from paying twice.
 */
export function createMemoryGradingDeps(
  store: Map<string, ProductionGradeResult> = new Map(),
): GradingPipelineDeps {
  return {
    gradeProduction,
    async isAccepted() { return false },
    async getCached(key) { return store.get(key) },
    async save(record) { store.set(record.key, record.result) },
  }
}

export async function gradeWithLocalFirst(
  input: LocalFirstInput,
  deps: GradingPipelineDeps = dexieGradingDeps,
): Promise<ProductionGradeResult> {
  const normalized = normalizeAcceptedAnswer(input.gradeInput.production)
  const reference = input.acceptedAnswers?.[0]
  if (normalized.split(' ').filter(Boolean).length < 2) {
    return localResult(false, 'Escribe al menos dos palabras para poder revisar la respuesta.', reference)
  }
  if (input.sourceSentence && normalized === normalizeAcceptedAnswer(input.sourceSentence)) {
    return localResult(false, 'No transformaste la oración.', reference)
  }
  if (matchesAcceptedAnswer(normalized, input.acceptedAnswers ?? [])) {
    return localResult(true, '¡Correcto!')
  }
  if (await deps.isAccepted(input.userId, input.exerciseKey, normalized)) {
    return localResult(true, '¡Correcto!')
  }
  const key = await cacheKey(input.userId, input.exerciseKey, normalized)
  const cached = await deps.getCached(key)
  if (cached) return cached

  input.beforeAiCall?.()
  const result = await deps.gradeProduction(input.gradeInput)
  await deps.save({
    key, userId: input.userId, exerciseKey: input.exerciseKey, normalized,
    result, createdAt: new Date().toISOString(),
    accepted: input.fixedReference && result.correct && result.score >= 90 ? 1 : 0,
  })
  return result
}
