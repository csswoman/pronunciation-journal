/**
 * Espeak/IPA (lo que emite el modelo CTC) → ARPAbet (lo que anota L2-ARCTIC).
 *
 * Estas reglas se fijan ANTES de medir y cambian el recuento de errores del
 * benchmark, así que tocarlas exige su propio commit con una razón escrita.
 *
 * Regla de diseño: una entrada solo puede mapear a varios símbolos ARPAbet
 * cuando la distinción **no es fonémica** en inglés (el alófono flap, la
 * oclusión glotal). Nunca se colapsa un contraste de la lista prioritaria de
 * hispanohablantes — si /iː/ y /ɪ/ pudieran satisfacerse con el mismo token,
 * el benchmark aprobaría un detector que no detecta nada.
 */

/** Contrastes que el plan 038 vigila. Ninguna regla puede fusionar dos de estos. */
export const PRIORITY_ARPABET = [
  'V', 'B', 'SH', 'TH', 'DH', 'Z', 'IH', 'IY', 'AE', 'AH', 'HH', 'JH', 'NG',
] as const

/**
 * Cada token IPA a los ARPAbet que puede satisfacer. Varios valores = alófonos
 * de un mismo fonema o ambigüedad genuina del inglés americano.
 */
export const IPA_TO_ARPABET: Record<string, readonly string[]> = {
  // Vocales
  'ɑː': ['AA'], 'ɑ': ['AA'], 'ɒ': ['AA'], 'ɑ̃': ['AA'],
  'æ': ['AE'], 'ä': ['AE'],
  // espeak usa 'ʌ' tónica y 'ə' átona para el mismo fonema AH del ARPAbet.
  'ʌ': ['AH'], 'ə': ['AH'], 'ɐ': ['AH'],
  'ɔː': ['AO'], 'ɔ': ['AO'], 'ɔ̃': ['AO'],
  'aʊ': ['AW'], 'aɪ': ['AY'],
  'ɛ': ['EH'], 'ɛː': ['EH'], 'ɛ̃': ['EH'],
  // ER: rótica silábica, con o sin marca de longitud.
  'ɜː': ['ER'], 'ɜ': ['ER'], 'ɚ': ['ER'], 'ɝ': ['ER'], 'ɹ̩': ['ER'],
  'eɪ': ['EY'], 'eː': ['EY'],
  // 'ɪ' e 'iː' se dejan a propósito sin alternativas: son el contraste que se mide.
  'ɪ': ['IH'],
  'iː': ['IY'], 'i': ['IY'],
  'oʊ': ['OW'], 'oː': ['OW'], 'o': ['OW'],
  'ɔɪ': ['OY'],
  'ʊ': ['UH'],
  'uː': ['UW'], 'u': ['UW'],
  // Bare 'e' no existe como fonema aislado del inglés; espeak la emite en
  // epéntesis de hispanohablantes ("e-school"), que se cuenta como adición.
  'e': ['EY'],

  // Consonantes
  b: ['B'], 'β': ['B'],
  'tʃ': ['CH'],
  d: ['D'], 'ð': ['DH'],
  f: ['F'],
  'ɡ': ['G'], g: ['G'], 'ɣ': ['G'],
  h: ['HH'], 'ç': ['HH'], x: ['HH'],
  'dʒ': ['JH'],
  k: ['K'],
  l: ['L'], 'ɫ': ['L'], 'l̩': ['L'],
  m: ['M'], 'm̩': ['M'],
  n: ['N'], 'n̩': ['N'], 'ɲ': ['N'],
  'ŋ': ['NG'],
  p: ['P'],
  'ɹ': ['R'], r: ['R'], 'ɻ': ['R'], 'ɽ': ['R'],
  s: ['S'], 'ʃ': ['SH'],
  // Alófonos no fonémicos de /t/: flap intervocálico (también /d/) y glotal.
  t: ['T'], 'ɾ': ['T', 'D'], 'ʔ': ['T'],
  'θ': ['TH'],
  v: ['V'], 'ʋ': ['V'],
  w: ['W'], j: ['Y'],
  z: ['Z'], 'ʒ': ['ZH'],
}

/** Diacríticos de longitud/tono que espeak añade y que no cambian el fonema. */
const STRIPPABLE = /[ˈˌː]/g

/** Quita el dígito de acento del ARPAbet de L2-ARCTIC: `IY1` → `IY`. */
export function bareArpabet(symbol: string): string {
  return symbol.replace(/\d+$/, '').toUpperCase()
}

/**
 * ARPAbet que un token del modelo puede satisfacer. Vacío = token fuera del
 * inventario del inglés (otra lengua del modelo multilingüe): el llamador debe
 * abstenerse, no adivinar.
 */
export function arpabetCandidates(ipa: string): readonly string[] {
  const direct = IPA_TO_ARPABET[ipa]
  if (direct) return direct
  // 'iːː', 'tˈ' y compañía: reintenta sin diacríticos antes de rendirse.
  const stripped = ipa.replace(STRIPPABLE, '')
  return IPA_TO_ARPABET[stripped] ?? IPA_TO_ARPABET[ipa.normalize('NFC')] ?? []
}

/** True si el token reconocido puede contar como el ARPAbet esperado. */
export function satisfies(recognizedIpa: string, expectedArpabet: string): boolean {
  return arpabetCandidates(recognizedIpa).includes(bareArpabet(expectedArpabet))
}
