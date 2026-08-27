/**
 * Vocales del inventario ARPAbet (CMU). Son las 15 que produce el
 * diccionario en `lib/pronunciation/phonemes.ts`: 10 monoftongos + ER
 * (vocal r-coloreada) + 4 diptongos.
 *
 * Importa porque el núcleo silábico es siempre una vocal: fallar el núcleo
 * rompe la inteligibilidad ("ship" vs "sheep"), mientras que fallar una
 * consonante de borde solo suena raro.
 */
const ARPABET_VOWELS: ReadonlySet<string> = new Set([
  'AA', 'AE', 'AH', 'AO', 'EH', 'ER', 'IH', 'IY', 'UH', 'UW',
  'AW', 'AY', 'EY', 'OW', 'OY',
])

/** Quita el dígito de acento del CMU: `IY1` → `IY`. */
export function stripStressDigit(phoneme: string): string {
  return phoneme.replace(/\d+$/, '')
}

export function isVowelPhoneme(phoneme: string): boolean {
  return ARPABET_VOWELS.has(stripStressDigit(phoneme).toUpperCase())
}
