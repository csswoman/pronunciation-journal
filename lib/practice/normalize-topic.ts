/**
 * Light normalization for SRS topic keys. Lowercases, trims, collapses
 * separators (spaces/underscores/hyphens) to a single space, and preserves
 * any leading `domain:` prefix so e.g. `grammar:articles` and `vocab:articles`
 * stay distinct concepts. Returns null when there is nothing meaningful.
 */
export function normalizeTopic(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null

  const colon = trimmed.indexOf(':')
  const prefix = colon >= 0 ? trimmed.slice(0, colon) : null
  const body = colon >= 0 ? trimmed.slice(colon + 1) : trimmed

  const normBody = body
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (normBody === '') return null
  return prefix !== null ? `${prefix.toLowerCase().trim()}:${normBody}` : normBody
}
