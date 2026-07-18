export const INTEREST_OPTIONS = [
  'technology', 'travel', 'work', 'food', 'music', 'films', 'books',
  'sports', 'health', 'science', 'business', 'gaming',
] as const

export type Interest = (typeof INTEREST_OPTIONS)[number]

const ALLOWED_INTERESTS = new Set<string>(INTEREST_OPTIONS)

export function normalizeInterests(values: readonly unknown[]): Interest[] {
  const normalized = values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => ALLOWED_INTERESTS.has(value))

  return [...new Set(normalized)].slice(0, 10) as Interest[]
}
