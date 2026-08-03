/** Small, deterministic helpers used by the journal's local writing hints. */

const TOKEN_PATTERN = /[a-z]+(?:'[a-z]+)?/gi

export function normalizeHintTokens(value: string): string[] {
  return value.toLocaleLowerCase('en').match(TOKEN_PATTERN) ?? []
}

function inflectedTokenVariants(token: string): string[] {
  const variants = new Set([token])
  variants.add(`${token}s`)
  variants.add(token.endsWith('e') ? `${token}d` : `${token}ed`)
  // Keep the simple -d/-ed tolerance explicit for seeds whose base already
  // ends in e (e.g. "notice" → "noticed").
  variants.add(`${token}d`)
  variants.add(`${token}ed`)
  return [...variants]
}

function seedVariants(seedText: string): string[][] {
  const tokens = normalizeHintTokens(seedText)
  if (tokens.length === 0) return []

  // A phrase can contain a verb before a particle ("manage to"), so allow a
  // simple inflection on any one token rather than only on the last token.
  const variants = new Set<string>()
  const baseKey = tokens.join(' ')
  variants.add(baseKey)
  tokens.forEach((token, index) => {
    for (const variant of inflectedTokenVariants(token)) {
      const next = [...tokens]
      next[index] = variant
      variants.add(next.join(' '))
    }
  })
  return [...variants].map((variant) => variant.split(' '))
}

function containsTokenSequence(contentTokens: string[], candidate: string[]): boolean {
  if (candidate.length > contentTokens.length) return false
  for (let start = 0; start <= contentTokens.length - candidate.length; start += 1) {
    if (candidate.every((token, offset) => contentTokens[start + offset] === token)) return true
  }
  return false
}

/** Returns true when the seed appears as a word/phrase, including simple forms. */
export function seedWordIsUsed(seedText: string, content: string): boolean {
  const contentTokens = normalizeHintTokens(content)
  return seedVariants(seedText).some((candidate) => containsTokenSequence(contentTokens, candidate))
}

export function activeStructureIndex(wordCount: number, targetLength: number): number {
  if (targetLength <= 0 || wordCount < targetLength / 3) return 0
  if (wordCount < (targetLength * 2) / 3) return 1
  return 2
}

/** Matches a sentence starter without treating its trailing ellipsis as text. */
export function sentenceStarterIsUsed(starter: string, content: string): boolean {
  const starterTokens = normalizeHintTokens(starter)
  if (starterTokens.length === 0) return false
  return containsTokenSequence(normalizeHintTokens(content), starterTokens)
}

export function firstUnusedStarterIndex(starters: string[], content: string): number {
  return starters.findIndex((starter) => !sentenceStarterIsUsed(starter, content))
}
