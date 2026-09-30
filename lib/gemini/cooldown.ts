import { getErrorStatus } from './fallback'

const DEFAULT_COOLDOWN_MS = 60_000
const cooldownUntilByModel = new Map<string, number>()

function parseDuration(value: unknown, unit: 'seconds' | 'milliseconds'): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return unit === 'seconds' ? value * 1_000 : value
  }
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  const duration = trimmed.match(/^(\d+(?:\.\d+)?)\s*(ms|milliseconds?|s|seconds?)?$/i)
  if (duration) {
    const amount = Number(duration[1])
    const suffix = duration[2]?.toLowerCase()
    return suffix?.startsWith('ms') ? amount : amount * 1_000
  }

  if (unit === 'seconds') {
    const retryAt = Date.parse(trimmed)
    if (Number.isFinite(retryAt)) return Math.max(0, retryAt - Date.now())
  }
  return undefined
}

function headerValue(headers: unknown, name: string): unknown {
  if (!headers || typeof headers !== 'object') return undefined
  const maybeHeaders = headers as { get?: (key: string) => string | null } & Record<string, unknown>
  if (typeof maybeHeaders.get === 'function') return maybeHeaders.get(name)
  const found = Object.entries(maybeHeaders).find(([key]) => key.toLowerCase() === name.toLowerCase())
  return found?.[1]
}

export function getRetryDelayMs(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const visited = new Set<object>()
  const pending: Array<{ value: unknown; depth: number }> = [{ value: error, depth: 0 }]

  while (pending.length) {
    const current = pending.shift()
    if (!current || !current.value || typeof current.value !== 'object' || visited.has(current.value)) continue
    visited.add(current.value)
    const record = current.value as Record<string, unknown>
    const retryAfter = parseDuration(headerValue(record.headers, 'Retry-After'), 'seconds')
    if (retryAfter !== undefined) return retryAfter

    for (const [key, value] of Object.entries(record)) {
      if (/^retry[_-]?after$/i.test(key)) {
        const parsed = parseDuration(value, 'seconds')
        if (parsed !== undefined) return parsed
      }
      if (/^retry[_-]?delay$/i.test(key)) {
        const parsed = parseDuration(value, 'milliseconds')
        if (parsed !== undefined) return parsed
      }
      if (current.depth < 4 && value && typeof value === 'object') {
        pending.push({ value, depth: current.depth + 1 })
      }
    }
  }

  const message = String((error as { message?: unknown }).message ?? '')
  const messageDelay = message.match(/retry(?:\s+after|\s+in)\s+(\d+(?:\.\d+)?)\s*(ms|s|seconds?)/i)
  if (!messageDelay) return undefined
  return parseDuration(`${messageDelay[1]}${messageDelay[2]}`, 'milliseconds')
}

export function markCooldown(model: string, retryAfterMs = DEFAULT_COOLDOWN_MS): void {
  const duration = Number.isFinite(retryAfterMs) && retryAfterMs > 0 ? retryAfterMs : DEFAULT_COOLDOWN_MS
  cooldownUntilByModel.set(model, Date.now() + duration)
}

export function markCooldownFromError(model: string, error: unknown): void {
  if (getErrorStatus(error) !== 429) return
  markCooldown(model, getRetryDelayMs(error))
}

export function filterAvailable(models: readonly string[]): readonly string[] {
  const now = Date.now()
  const available = models.filter((model) => {
    const until = cooldownUntilByModel.get(model)
    if (!until) return true
    if (until <= now) {
      cooldownUntilByModel.delete(model)
      return true
    }
    return false
  })
  return available.length > 0 ? available : models
}

export function _resetModelCooldowns(): void {
  cooldownUntilByModel.clear()
}
