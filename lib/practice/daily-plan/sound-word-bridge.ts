import type { WordBankEntry } from '@/lib/word-bank/types'

/**
 * Puente fonema ↔ vocabulario. Cruza un sonido débil (IPA) con las palabras del
 * word_bank del alumno para sesgar la selección de vocabulario hacia ese sonido.
 *
 * Heurística: solo IPA. Una palabra coincide si su `ipa` (no nula) contiene el
 * símbolo IPA del sonido, sin las barras (`sounds.ipa` se guarda como "/ɪ/",
 * `word_bank.ipa` como transcripción libre "ʃɪp"). Sin fallback ortográfico.
 */
export function wordMatchesSound(word: WordBankEntry, soundIpa: string): boolean {
  const symbol = soundIpa.replace(/\//g, '').trim()
  if (!symbol || !word.ipa) return false
  return word.ipa.includes(symbol)
}

/**
 * Sesgo suave: reserva hasta ceil(limit/2) huecos para palabras que contienen
 * `soundIpa`, rellena el resto con las no coincidentes en orden de entrada, y
 * después añade las coincidentes sobrantes si queda sitio. Devuelve como máximo
 * `limit` palabras, conservando el orden relativo dentro de cada grupo.
 *
 * Si `soundIpa` está vacío o no hay coincidencias, devuelve `words.slice(0, limit)`
 * sin cambios — fallback automático al comportamiento actual.
 */
export function biasWordsBySound(
  words: WordBankEntry[],
  soundIpa: string,
  limit: number,
): WordBankEntry[] {
  const matched = words.filter((w) => wordMatchesSound(w, soundIpa))
  if (matched.length === 0) return words.slice(0, limit)

  const matchedIds = new Set(matched.map((w) => w.id))
  const unmatched = words.filter((w) => !matchedIds.has(w.id))

  const quota = Math.ceil(limit / 2)
  const result = [...matched.slice(0, quota)]

  for (const w of unmatched) {
    if (result.length >= limit) break
    result.push(w)
  }

  for (const w of matched.slice(quota)) {
    if (result.length >= limit) break
    result.push(w)
  }

  return result
}
