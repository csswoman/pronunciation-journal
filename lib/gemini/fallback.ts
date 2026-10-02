import type { ThinkingConfig, ThinkingLevel } from '@google/genai'

export const BASE_MODELS = [
  // High-volume tasks use models with the largest confirmed free quotas first.
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  // Legacy fallback; current access is restricted to existing users.
  'gemini-2.5-flash-lite',
] as const

/** Quality-sensitive turns keep one low-quota Flash model as a last resort. */
export const QUALITY_FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
] as const

/** Reserved for future measured, low-volume tasks where first-pass quality matters most. */
export const PREMIUM_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'] as const

export const FALLBACK_MODELS: readonly string[] = BASE_MODELS

/** Gemini 3 uses levels, not Gemini 2.5's token budgets. */
export function getFastThinkingConfig(model: string, effort: 'minimal' | 'low' = 'minimal'): ThinkingConfig | undefined {
  if (['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash'].includes(model)) {
    return { thinkingLevel: (effort === 'low' ? 'LOW' : 'MINIMAL') as ThinkingLevel }
  }
  if (['gemini-3.7-flash', 'gemini-3.8-flash'].includes(model)) {
    return { thinkingLevel: 'LOW' as ThinkingLevel }
  }
  if (model === 'gemini-2.5-flash-lite') return { thinkingBudget: 0 }
  return undefined
}

export function getErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined
  const maybe = err as { status?: unknown; statusCode?: unknown }
  if (typeof maybe.status === 'number') return maybe.status
  if (typeof maybe.statusCode === 'number') return maybe.statusCode
  return undefined
}

export function isTimeoutLikeError(err: unknown): boolean {
  const name = String((err as { name?: unknown })?.name ?? '').toLowerCase()
  if (name === 'aborterror' || name === 'timeouterror') return true
  const message = String((err as { message?: unknown })?.message ?? '').toLowerCase()
  return ['timeout', 'timed out', 'aborted'].some((term) => message.includes(term))
}

export function shouldTryNextModel(err: unknown): boolean {
  const status = getErrorStatus(err)
  if (status === 400 || status === 401 || status === 403) return false
  if ([404, 408, 409, 425, 429].includes(status ?? -1)) return true
  if (typeof status === 'number' && status >= 500) return true
  if (isTimeoutLikeError(err)) return true
  const message = String((err as { message?: unknown })?.message ?? '').toLowerCase()
  return ['not found', 'quota', 'rate', 'resource exhausted', 'unavailable', 'internal']
    .some((term) => message.includes(term))
}
