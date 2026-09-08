// lib/pronunciation/phoneme-in-word.ts
import type { PhonemeAlignment } from '@/lib/types'
import { ARPABET_TO_IPA } from './phonemes'
import { stripStressDigit } from './arpabet-vowels'

export type ExplanationSegment = { text: string; emphasis?: 'grapheme' | 'ipa' }

export interface PhonemeInWordExplanation {
  /** Sentence split into segments; the UI emphasises the marked ones. */
  segments: ExplanationSegment[]
  /** Same sentence as flat text — used for aria-label and tests. */
  plainEs: string
  /** "dijiste /s/ (sin voz)" | "ese sonido no se te oyó" | null */
  contrastEs: string | null
}

/** Bare IPA symbol (no slashes) for an alignment entry, or null. */
function ipaSymbol(a: Pick<PhonemeAlignment, 'phoneme' | 'ipa'>): string | null {
  if (a.ipa) return a.ipa
  const bare = stripStressDigit(a.phoneme ?? '').toUpperCase()
  return ARPABET_TO_IPA[bare] ?? null
}

/** Voicing note for the sound actually produced, when it clarifies the error. */
function voicingNote(gotIpa: string, targetIpa: string): string {
  const voiceless = new Set(['s', 'f', 'θ', 'p', 't', 'k', 'ʃ', 'tʃ'])
  const voiced = new Set(['z', 'v', 'ð', 'b', 'd', 'g', 'ʒ', 'dʒ'])
  if (voiceless.has(gotIpa) && voiced.has(targetIpa)) return ' (sin voz)'
  if (voiced.has(gotIpa) && voiceless.has(targetIpa)) return ' (con voz)'
  return ''
}

function buildContrast(culprit: PhonemeAlignment, targetIpa: string): string | null {
  if (culprit.status === 'missing') return 'ese sonido no se te oyó'
  const gotIpa = culprit.gotIpa ?? (culprit.got ? ipaSymbol({ phoneme: culprit.got }) : null)
  if (gotIpa && gotIpa !== targetIpa) {
    return `dijiste /${gotIpa}/${voicingNote(gotIpa, targetIpa)}`
  }
  return null
}

function flatten(segments: ExplanationSegment[]): string {
  return segments.map((s) => s.text).join('')
}

interface Pattern {
  /** True when this pattern explains the given culprit in the given syllable. */
  match: (culprit: PhonemeAlignment, syllableText: string, targetIpa: string) => boolean
  /** Build the emphasised sentence. */
  build: (syllableText: string, targetIpa: string, culprit: PhonemeAlignment) => ExplanationSegment[]
}

const LONG_VOWELS = new Set(['iː', 'uː', 'ɑː', 'ɔː', 'ɜː'])
const lower = (s: string) => s.toLowerCase()

const PATTERNS: Pattern[] = [
  // /z/ final, spelled with "s" (plurals, 3rd person, "is/was")
  {
    match: (c, syl) => c.ipa === 'z' && /s$/i.test(syl),
    build: (syl) => [
      { text: 'la «' },
      { text: 's', emphasis: 'grapheme' },
      { text: '» final de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» suena ' },
      { text: '/z/', emphasis: 'ipa' },
      { text: ' (con voz), no /s/' },
    ],
  },
  // /ɪ/ produced as /iː/
  {
    match: (c) => c.ipa === 'ɪ',
    build: (syl) => [
      { text: 'la ' },
      { text: '«i»', emphasis: 'grapheme' },
      { text: ' de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es corta ' },
      { text: '/ɪ/', emphasis: 'ipa' },
      { text: ', no larga /iː/' },
    ],
  },
  // long vowel shortened
  {
    match: (c) => !!c.ipa && LONG_VOWELS.has(c.ipa),
    build: (syl, ipa) => [
      { text: 'la vocal de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es larga ' },
      { text: `/${ipa}/`, emphasis: 'ipa' },
      { text: '; te salió corta' },
    ],
  },
  // voiceless th
  {
    match: (c) => c.ipa === 'θ',
    build: (syl) => [
      { text: 'la ' },
      { text: '«th»', emphasis: 'grapheme' },
      { text: ' de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es ' },
      { text: '/θ/', emphasis: 'ipa' },
      { text: ' (lengua entre los dientes), no /t/' },
    ],
  },
  // voiced th
  {
    match: (c) => c.ipa === 'ð',
    build: (syl) => [
      { text: 'la ' },
      { text: '«th»', emphasis: 'grapheme' },
      { text: ' de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es ' },
      { text: '/ð/', emphasis: 'ipa' },
      { text: ' (lengua entre los dientes, con voz), no /d/' },
    ],
  },
  // "-ed" past ending realised as /t/ or /d/
  {
    match: (c, syl) => (c.ipa === 't' || c.ipa === 'd') && /ed$/i.test(syl),
    build: (syl, ipa) => [
      { text: 'la ' },
      { text: '«-ed»', emphasis: 'grapheme' },
      { text: ' de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» suena ' },
      { text: `/${ipa}/`, emphasis: 'ipa' },
      { text: ', no «ed»' },
    ],
  },
  // /v/ as /b/
  {
    match: (c) => c.ipa === 'v',
    build: (syl) => [
      { text: 'la ' },
      { text: '«v»', emphasis: 'grapheme' },
      { text: ' de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es ' },
      { text: '/v/', emphasis: 'ipa' },
      { text: ' (dientes sobre el labio), no /b/' },
    ],
  },
  // /h/ omitted
  {
    match: (c) => c.ipa === 'h',
    build: (syl) => [
      { text: 'la ' },
      { text: '«h»', emphasis: 'grapheme' },
      { text: ' de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» sí se pronuncia: un soplo suave ' },
      { text: '/h/', emphasis: 'ipa' },
    ],
  },
  // schwa
  {
    match: (c) => c.ipa === 'ə',
    build: (syl) => [
      { text: 'la vocal átona de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» se relaja a ' },
      { text: '/ə/', emphasis: 'ipa' },
      { text: ', no se pronuncia entera' },
    ],
  },
  // /ŋ/ final
  {
    match: (c) => c.ipa === 'ŋ',
    build: (syl) => [
      { text: 'la ' },
      { text: '«ng»', emphasis: 'grapheme' },
      { text: ' final de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es un solo sonido nasal ' },
      { text: '/ŋ/', emphasis: 'ipa' },
      { text: ', sin «g» marcada' },
    ],
  },
  // /j/ initial
  {
    match: (c) => c.ipa === 'j',
    build: (syl) => [
      { text: 'la ' },
      { text: '«y»', emphasis: 'grapheme' },
      { text: ' inicial de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es un deslizamiento suave ' },
      { text: '/j/', emphasis: 'ipa' },
      { text: ', no /dʒ/' },
    ],
  },
]

export function describePhonemeInWord(
  syllableText: string,
  culprit: PhonemeAlignment,
): PhonemeInWordExplanation | null {
  const targetIpa = ipaSymbol(culprit)
  if (!targetIpa) return null

  const contrastEs = buildContrast(culprit, targetIpa)

  const pattern = PATTERNS.find((p) => p.match(culprit, syllableText, targetIpa))
  const segments: ExplanationSegment[] = pattern
    ? pattern.build(syllableText, targetIpa, culprit)
    : [
        { text: 'el sonido ' },
        { text: `/${targetIpa}/`, emphasis: 'ipa' },
        { text: ' en «' },
        { text: syllableText, emphasis: 'grapheme' },
        { text: '»' },
      ]

  return { segments, plainEs: flatten(segments), contrastEs }
}
