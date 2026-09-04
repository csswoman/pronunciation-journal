/**
 * Clasificación y guías de duración acústica vocálica para hispanohablantes.
 * En español, las vocales duran uniformemente ~150ms. En inglés, la tensión y longitud
 * temporal (tensas ~280ms vs laxas ~120ms) es el principal contraste distintivo.
 */

const TENSE_VOWELS = new Set([
  'iː', 'uː', 'ɑː', 'ɔː', 'ɜːr', 'eɪ', 'aɪ', 'oʊ', 'aʊ', 'ɔɪ',
  'IY', 'UW', 'AA', 'AO', 'ER', 'EY', 'AY', 'OW', 'AW', 'OY',
])

const LAX_VOWELS = new Set([
  'ɪ', 'ʊ', 'ʌ', 'æ', 'ə', 'ɛ',
  'IH', 'UH', 'AH', 'AE', 'AX', 'AXR', 'EH',
])

export type VowelDurationType = 'tense' | 'lax'

export interface VowelDurationGuidance {
  category: VowelDurationType
  badge: string
  targetMs: string
  tipEs: string
}

export function cleanPhonemeSymbol(raw: string): string {
  return raw.replace(/^\/+|\/+$/g, '').replace(/[0-9]/g, '').trim()
}

export function getVowelDurationCategory(phonemeOrIpa: string): VowelDurationType | null {
  const clean = cleanPhonemeSymbol(phonemeOrIpa)
  if (TENSE_VOWELS.has(clean) || TENSE_VOWELS.has(clean.toUpperCase())) {
    return 'tense'
  }
  if (LAX_VOWELS.has(clean) || LAX_VOWELS.has(clean.toUpperCase())) {
    return 'lax'
  }
  return null
}

export function getVowelDurationGuidance(phonemeOrIpa: string): VowelDurationGuidance | null {
  const category = getVowelDurationCategory(phonemeOrIpa)
  if (!category) return null

  if (category === 'tense') {
    return {
      category: 'tense',
      badge: '⏳ Vocal tensa (larga)',
      targetMs: '~250-300 ms',
      tipEs: 'Alarga la vocal: en inglés dura casi el doble que en español. Mantén el sonido sin cortarlo.',
    }
  }

  return {
    category: 'lax',
    badge: '⚡ Vocal laxa (corta)',
    targetMs: '~100-140 ms',
    tipEs: 'Vocal breve y relajada: emite un pulso acústico rápido sin tensar labios ni lengua.',
  }
}
