/** Parse answer_history.content_id values like "word_bank:uuid" or "text_fragments:cs-assimilation". */
export function parseContentRef(contentId: string): { source: string; id: string } | null {
  const idx = contentId.indexOf(':')
  if (idx <= 0) return null
  return { source: contentId.slice(0, idx), id: contentId.slice(idx + 1) }
}

const UUID_RE = /^[0-9a-f-]{36}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

/** Extract word_bank row id from a content_id. */
export function parseWordBankId(contentId: string): string | null {
  const ref = parseContentRef(contentId)
  if (ref?.source === 'word_bank' && ref.id.length > 0) return ref.id
  if (isUuid(contentId)) return contentId
  return null
}

/** Turn slugs like "cs-assimilation" into readable text. */
export function humanizeSlug(slug: string): string {
  const stripped = slug.replace(/^cs-/, '')
  return stripped
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const CONNECTED_SPEECH_DECK_TITLES: Record<string, string> = {
  'cs-linking': 'Linking',
  'cs-reductions': 'Reductions',
  'cs-assimilation': 'Assimilation',
  'cs-elision': 'Elision',
}

type CsDeckSlug = keyof typeof CONNECTED_SPEECH_DECK_TITLES

export function connectedSpeechDeckTitle(slug: string): string | null {
  return CONNECTED_SPEECH_DECK_TITLES[slug] ?? null
}

export function isConnectedSpeechDeckSlug(slug: string): slug is CsDeckSlug {
  return slug in CONNECTED_SPEECH_DECK_TITLES
}

export type { CsDeckSlug }
