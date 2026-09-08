export const ENABLE_PREVIEW_MODELS =
  process.env.GEMINI_ENABLE_PREVIEW_MODELS === 'true'

export const BASE_MODELS = [
  // Confirmed fast lite — goes first to avoid 404 round-trips on unavailable aliases
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  // Heavier fallbacks if lite quota is exhausted
  'gemini-2.5-flash',
  'gemini-3.7-flash',
  // Last-resort: may not be available in all regions/keys
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
] as const

export const PREVIEW_MODELS = ['gemini-3.1-flash-lite-preview'] as const

export const FALLBACK_MODELS: readonly string[] = ENABLE_PREVIEW_MODELS
  ? ['gemini-3.1-flash-lite-preview', ...BASE_MODELS]
  : [...BASE_MODELS]

const THINKING_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
])

/** Disables reasoning tokens for conversational speed on models with thinking enabled by default. */
export function getFastThinkingConfig(model: string): { thinkingBudget: 0 } | undefined {
  return THINKING_MODELS.has(model) ? { thinkingBudget: 0 } : undefined
}

export function getErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined
  const maybe = err as { status?: unknown; statusCode?: unknown }
  if (typeof maybe.status === 'number') return maybe.status
  if (typeof maybe.statusCode === 'number') return maybe.statusCode
  return undefined
}

export function shouldTryNextModel(err: unknown): boolean {
  const status = getErrorStatus(err)
  if (status === 400 || status === 401 || status === 403) return false
  if ([404, 408, 409, 425, 429].includes(status ?? -1)) return true
  if (typeof status === 'number' && status >= 500) return true
  const message = String((err as { message?: unknown })?.message ?? '').toLowerCase()
  return ['not found', 'quota', 'rate', 'resource exhausted', 'unavailable', 'timeout', 'internal']
    .some((term) => message.includes(term))
}
