/**
 * Extracts a vowel-contrast subset from a local speechocean762 checkout
 * (OpenSLR SLR101) into the `CorpusItem[]` shape `corpus-loader.ts` expects.
 *
 * speechocean762 has no per-word or per-phoneme timestamps — only whole-
 * utterance WAVs plus word-level ARPAbet phone strings and human scores. To
 * approximate an isolated vowel segment without a forced aligner (explicitly
 * out of scope, see ADR-064), this extractor only keeps utterances whose
 * `text` is a SINGLE monosyllabic word whose vowel nucleus matches one of
 * the plan 071 v1 contrasts (IY/IH/AE/AH -> iː/ɪ/æ/ʌ). For those, the whole
 * utterance WAV *is* the word's audio, so no alignment is needed.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CorpusItem } from './corpus-loader'

/** ARPAbet vowel phone (stress digit stripped) -> plan 071 IPA vowel target. */
const ARPABET_TO_IPA_VOWEL: Record<string, string> = {
  IY: 'iː',
  IH: 'ɪ',
  AE: 'æ',
  AH: 'ʌ',
}

const ARPABET_VOWELS = new Set([
  'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW',
])

function stripStress(phone: string): string {
  return phone.replace(/[0-9]$/, '')
}

/**
 * Given one word's ref-phones string (e.g. "K AO0 L"), returns the plan 071
 * IPA vowel it maps to, or null if the word isn't a clean single-vowel-
 * nucleus monosyllable in the v1 contrast set.
 */
export function monosyllabicTargetVowel(refPhones: string): string | null {
  const phones = refPhones.trim().split(/\s+/)
  const vowelPhones = phones.filter((p) => ARPABET_VOWELS.has(stripStress(p)))
  if (vowelPhones.length !== 1) return null // not monosyllabic (0 or >1 vowel nucleus)

  const bareVowel = stripStress(vowelPhones[0])
  return ARPABET_TO_IPA_VOWEL[bareVowel] ?? null
}

export interface SpeechoceanWordScore {
  text: string
  'ref-phones': string
  total: number[]
}

export interface SpeechoceanUtteranceScore {
  text: string
  words: SpeechoceanWordScore[]
}

/** Averages the per-rater `total` (0-10 word score) into a single 0-100 humanScore. */
function averageWordScore(word: SpeechoceanWordScore): number {
  const scores = word.total
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length
  return Math.round(mean * 10)
}

export interface WavScpEntry {
  uttId: string
  relativeWavPath: string
}

export function parseWavScp(raw: string): WavScpEntry[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [uttId, relativeWavPath] = line.split(/\s+/)
      return { uttId, relativeWavPath }
    })
}

export interface ExtractSpeechoceanVowelsOptions {
  /** Root of the speechocean762 checkout (contains WAVE/, resource/, train/, test/). */
  corpusRoot: string
  /** Which split's wav.scp/text to read from — speaker/utterance audio is split between train and test. */
  splits: ('train' | 'test')[]
}

/**
 * Pure-ish extraction: reads the corpus's own index files and returns
 * `CorpusItem[]` (clipFile is relative to `corpusRoot`, matching what
 * `corpus-loader`/`run-benchmark` expect once pointed at `corpusRoot`).
 * Only file reads — no audio decoding, no DSP — so this stays fast and
 * testable against small fixture files.
 */
export function extractSpeechoceanVowels({
  corpusRoot,
  splits,
}: ExtractSpeechoceanVowelsOptions): CorpusItem[] {
  const scoresDetail: Record<string, SpeechoceanUtteranceScore> = JSON.parse(
    readFileSync(join(corpusRoot, 'resource', 'scores-detail.json'), 'utf-8')
  )

  const items: CorpusItem[] = []

  for (const split of splits) {
    const wavScpRaw = readFileSync(join(corpusRoot, split, 'wav.scp'), 'utf-8')
    const utt2spkRaw = readFileSync(join(corpusRoot, split, 'utt2spk'), 'utf-8')
    const wavEntries = parseWavScp(wavScpRaw)
    const utt2spk = new Map(
      utt2spkRaw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.split(/\s+/) as [string, string])
    )

    for (const { uttId, relativeWavPath } of wavEntries) {
      const scored = scoresDetail[uttId]
      if (!scored || scored.words.length !== 1) continue // only single-word utterances

      const word = scored.words[0]
      const targetVowel = monosyllabicTargetVowel(word['ref-phones'])
      if (!targetVowel) continue

      items.push({
        clipFile: relativeWavPath,
        targetVowel,
        humanScore: averageWordScore(word),
        speakerId: utt2spk.get(uttId) ?? 'unknown',
      })
    }
  }

  return items
}
