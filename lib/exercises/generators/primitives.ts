import { shuffle, tokenize } from '@/lib/exercises/utils'

const SPANISH_MARKERS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'que', 'y',
  'en', 'con', 'por', 'para', 'voy', 'soy', 'es', 'son', 'mi', 'tu', 'su',
  'ver', 'cada', 'muchas', 'este', 'esta', 'al', 'del', 'mes', 'semana',
])

function cleanToken(token: string): string {
  return token.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '')
}

/** Shared only by fragment adapters that use the same conservative language gate. */
export function isLikelyEnglish(text: string): boolean {
  if (/[¿¡áíóúñ]/i.test(text)) return false
  const words = tokenize(text).map((word) => cleanToken(word).toLowerCase()).filter(Boolean)
  if (words.length === 0) return false
  return words.filter((word) => SPANISH_MARKERS.has(word)).length / words.length <= 0.34
}

/** Shuffles without mutating input, retrying the original order at most ten times. */
export function shuffleDistinct<T>(items: readonly T[]): T[] {
  if (items.length <= 1) return [...items]
  let result = shuffle([...items])
  for (let attempt = 0; attempt < 10 && result.every((item, index) => item === items[index]); attempt++) {
    result = shuffle([...items])
  }
  return result
}
