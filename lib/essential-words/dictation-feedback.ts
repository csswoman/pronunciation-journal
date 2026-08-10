import { isTypo } from './typo'
import { DICTATION_DIAGNOSTIC_CONFIG } from './dictation-diagnostic-config'
import type {
  AttemptResult,
  AttemptOutcome,
  AttemptSkillEvidence,
  AttemptWordCategory,
  AttemptWordEvidence,
} from './attempt-grade'
import type { PhoneticComparison } from './phonetic-substitution'

export type DictationWordStatus = 'match' | 'error' | 'typo' | 'missing'

export interface DictationWordDiff {
  expected: string
  written?: string
  status: DictationWordStatus
  isTarget: boolean
  category?: AttemptWordCategory
  expectedIpa?: string
  writtenIpa?: string
  contrastId?: string
}

export interface DictationFeedback {
  words: DictationWordDiff[]
  extras: string[]
  terminalPunctuation: string
  hasDifferences: boolean
  hasTypos: boolean
  /** True when the full dictated sentence has no meaningful errors. Typo-like non-words remain accepted. */
  sentenceCorrect: boolean
  targetCorrect: boolean
  /** Additive diagnostic contract for the future skill-specific writer. */
  resultado?: AttemptResult
  palabras?: AttemptWordEvidence[]
  errorDominante?: Exclude<AttemptWordCategory, 'ok'>
  evidencia?: AttemptSkillEvidence[]
}

export type DictationAttemptDiagnostic = Pick<
  AttemptOutcome,
  'resultado' | 'palabras' | 'errorDominante' | 'evidencia'
>

/**
 * Maps the pure dictation diagnosis to the additive AttemptOutcome fields.
 * The card forwards this unchanged; the runtime owns the skill-specific write.
 */
export function dictationAttemptDiagnostic(
  feedback: DictationFeedback,
): DictationAttemptDiagnostic {
  return {
    resultado: feedback.resultado,
    palabras: feedback.palabras,
    errorDominante: feedback.errorDominante,
    evidencia: feedback.evidencia,
  }
}

/**
 * Normalizes only presentation differences that should never become feedback:
 * casing, quote style, terminal punctuation and redundant outer whitespace.
 */
export function normalizeDictationText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?]+(?:[\"'])?$/, '')
    .trim()
    .toLowerCase()
}

function tokenize(text: string): string[] {
  return normalizeDictationText(text)
    .split(' ')
    .map((word) => word.replace(/^[\"']+|[\"',;:]+$/g, ''))
    .filter(Boolean)
}

function displayTokens(text: string): string[] {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?]+(?:[\"'])?$/, '')
    .trim()
    .split(' ')
    .map((word) => word.replace(/^[\"']+|[\"',;:]+$/g, ''))
    .filter(Boolean)
}

function lcsPairs(expected: string[], written: string[]): Array<[number, number]> {
  const table = Array.from({ length: expected.length + 1 }, () => Array<number>(written.length + 1).fill(0))
  for (let i = expected.length - 1; i >= 0; i--) {
    for (let j = written.length - 1; j >= 0; j--) {
      table[i][j] = expected[i] === written[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }

  const pairs: Array<[number, number]> = []
  let i = 0
  let j = 0
  while (i < expected.length && j < written.length) {
    if (expected[i] === written[j]) {
      pairs.push([i, j])
      i += 1
      j += 1
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      i += 1
    } else {
      j += 1
    }
  }
  return pairs
}

/** Covers the regular forms authors use in example sentences. */
export function isTargetWordForm(word: string, targetWord: string): boolean {
  const wordLower = word.toLowerCase()
  const target = targetWord.toLowerCase()
  if (wordLower === target) return true
  const irregularForms: Record<string, readonly string[]> = {
    be: ['am', 'is', 'are', 'was', 'were', 'been', 'being'],
    have: ['has', 'had', 'having'],
    do: ['does', 'did', 'done', 'doing'],
    go: ['goes', 'went', 'gone', 'going'],
    say: ['says', 'said', 'saying'],
    make: ['makes', 'made', 'making'],
    take: ['takes', 'took', 'taken', 'taking'],
    come: ['comes', 'came', 'coming'],
    see: ['sees', 'saw', 'seen', 'seeing'],
    get: ['gets', 'got', 'gotten', 'getting'],
    give: ['gives', 'gave', 'given', 'giving'],
    find: ['finds', 'found', 'finding'],
    think: ['thinks', 'thought', 'thinking'],
    know: ['knows', 'knew', 'known', 'knowing'],
    feel: ['feels', 'felt', 'feeling'],
    leave: ['leaves', 'left', 'leaving'],
    keep: ['keeps', 'kept', 'keeping'],
    tell: ['tells', 'told', 'telling'],
    become: ['becomes', 'became', 'becoming'],
    begin: ['begins', 'began', 'begun', 'beginning'],
    write: ['writes', 'wrote', 'written', 'writing'],
    speak: ['speaks', 'spoke', 'spoken', 'speaking'],
    child: ['children'],
    person: ['people'],
    man: ['men'],
    woman: ['women'],
  }
  if (irregularForms[target]?.includes(wordLower)) return true
  if (target.endsWith('y') && /[^aeiou]y$/.test(target)) {
    return wordLower === `${target.slice(0, -1)}ies` || wordLower === `${target.slice(0, -1)}ied`
  }
  return [
    `${target}s`, `${target}es`, `${target}ed`, `${target}ing`,
    `${target}${target.at(-1)}ed`, `${target}${target.at(-1)}ing`,
  ].includes(wordLower)
}

/**
 * Aligns sentence words with LCS, so an insertion or omission cannot shift all
 * following feedback. `isKnownWord` is injected to keep the diff pure.
 */
export function buildDictationFeedback(
  writtenText: string,
  expectedText: string,
  targetWord: string,
  isKnownWord: (word: string) => boolean = () => false,
  comparePhonetics?: (expected: string, written: string) => PhoneticComparison | null,
  tier?: 1 | 2 | 3,
): DictationFeedback {
  const expected = tokenize(expectedText)
  const expectedDisplay = displayTokens(expectedText)
  const written = tokenize(writtenText)
  const terminalPunctuation = expectedText.trim().match(/[.!?]+(?:[\"'])?$/)?.[0] ?? ''
  const matches = lcsPairs(expected, written)
  const words: DictationWordDiff[] = []
  const extras: string[] = []
  let expectedStart = 0
  let writtenStart = 0

  const appendGap = (expectedEnd: number, writtenEnd: number) => {
    const expectedGap = expected.slice(expectedStart, expectedEnd)
    const writtenGap = written.slice(writtenStart, writtenEnd)
    const paired = Math.min(expectedGap.length, writtenGap.length)
    for (let offset = 0; offset < paired; offset++) {
      const expectedWord = expectedGap[offset]
      const writtenWord = writtenGap[offset]
      const phonetic = !isTypo(writtenWord, expectedWord, isKnownWord)
        ? comparePhonetics?.(expectedWord, writtenWord) ?? null
        : null
      words.push({
        expected: expectedDisplay[expectedStart + offset] ?? expectedWord,
        written: writtenWord,
        status: isTypo(writtenWord, expectedWord, isKnownWord) ? 'typo' : 'error',
        isTarget: isTargetWordForm(expectedWord, targetWord),
        ...(phonetic ? { category: phonetic.kind, expectedIpa: phonetic.expectedIpa, writtenIpa: phonetic.writtenIpa, contrastId: phonetic.contrastId } : {}),
      })
    }
    for (let offset = paired; offset < expectedGap.length; offset++) {
      const expectedWord = expectedGap[offset]
      words.push({ expected: expectedDisplay[expectedStart + offset] ?? expectedWord, status: 'missing', isTarget: isTargetWordForm(expectedWord, targetWord) })
    }
    extras.push(...writtenGap.slice(paired))
  }

  for (const [expectedIndex, writtenIndex] of matches) {
    appendGap(expectedIndex, writtenIndex)
    const expectedWord = expected[expectedIndex]
    words.push({ expected: expectedDisplay[expectedIndex] ?? expectedWord, written: expectedWord, status: 'match', isTarget: isTargetWordForm(expectedWord, targetWord) })
    expectedStart = expectedIndex + 1
    writtenStart = writtenIndex + 1
  }
  appendGap(expected.length, written.length)

  const differences = words.filter((word) => word.status !== 'match')
  const hasSentenceErrors = differences.some((word) => word.status === 'error' || word.status === 'missing') || extras.length > 0
  const palabras: AttemptWordEvidence[] = [
    ...words.map((word) => ({
      expected: word.expected,
      written: word.written,
      categoria: categoryForWord(word),
      isTarget: word.isTarget,
      expectedIpa: word.expectedIpa,
      writtenIpa: word.writtenIpa,
      contrastId: word.contrastId,
    })),
    ...extras.map((written) => ({ written, categoria: 'insertion' as const })),
  ]
  const hasDiagnosticFailure = palabras.some((word) => word.categoria !== 'ok')
  const resultado: AttemptResult = isPresentationOnlyDifference(writtenText, expectedText)
    ? 'casi'
    : hasDiagnosticFailure
      ? 'incorrecto'
      : 'correcto'
  return {
    words,
    extras,
    terminalPunctuation,
    hasDifferences: differences.length > 0 || extras.length > 0,
    hasTypos: differences.some((word) => word.status === 'typo'),
    sentenceCorrect: resultado === 'casi' || !hasSentenceErrors,
    targetCorrect: !words.some((word) => word.isTarget && (word.status === 'error' || word.status === 'missing')),
    resultado,
    palabras,
    errorDominante: resultado === 'incorrecto' ? dominantError(palabras) : undefined,
    evidencia: evidenceFor(resultado, palabras, tier),
  }
}

function normalizePresentation(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripTerminalPunctuation(text: string): string {
  return text.replace(/[.!?]+(?:["'])?$/, '').trim()
}

function foldDiagnosticText(text: string): string {
  let normalized = normalizePresentation(text)
  if (DICTATION_DIAGNOSTIC_CONFIG.nearCorrect.ignoreTerminalPunctuation) {
    normalized = stripTerminalPunctuation(normalized)
  }
  if (DICTATION_DIAGNOSTIC_CONFIG.nearCorrect.ignoreDiacritics) {
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }
  return DICTATION_DIAGNOSTIC_CONFIG.nearCorrect.ignoreCase
    ? normalized.toLowerCase()
    : normalized
}

function editDistance(left: string, right: string): number {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => index)
  for (let column = 1; column <= right.length; column += 1) {
    let previousDiagonal = rows[0]
    rows[0] = column
    for (let row = 1; row <= left.length; row += 1) {
      const previousRow = rows[row]
      rows[row] = Math.min(
        rows[row] + 1,
        rows[row - 1] + 1,
        previousDiagonal + Number(left[row - 1] !== right[column - 1]),
      )
      previousDiagonal = previousRow
    }
  }
  return rows[left.length]
}

function isOrthographyDifference(written: string | undefined, expected: string): boolean {
  if (!written) return false
  return editDistance(foldDiagnosticText(written), foldDiagnosticText(expected))
    <= DICTATION_DIAGNOSTIC_CONFIG.maxOrthographyEditDistance
}

function categoryForWord(word: DictationWordDiff): AttemptWordCategory {
  if (word.status === 'match') return 'ok'
  if (word.status === 'missing') return 'omission'
  return isOrthographyDifference(word.written, word.expected)
    ? 'spelling'
    : word.category ?? 'guess'
}

function dominantError(
  words: AttemptWordEvidence[],
): Exclude<AttemptWordCategory, 'ok'> | undefined {
  const counts = new Map<Exclude<AttemptWordCategory, 'ok'>, number>()
  for (const word of words) {
    if (word.categoria === 'ok') continue
    counts.set(word.categoria, (counts.get(word.categoria) ?? 0) + 1)
  }
  if (counts.size === 0) return undefined
  return [...DICTATION_DIAGNOSTIC_CONFIG.dominantErrorPriority]
    .sort((left, right) => (counts.get(right) ?? 0) - (counts.get(left) ?? 0))[0]
}

function isPresentationOnlyDifference(written: string, expected: string): boolean {
  return normalizePresentation(written) !== normalizePresentation(expected)
    && foldDiagnosticText(written) === foldDiagnosticText(expected)
}

function evidenceFor(
  resultado: AttemptResult,
  palabras: AttemptWordEvidence[],
  tier?: 1 | 2 | 3,
): AttemptSkillEvidence[] {
  if (resultado === 'correcto') {
    return [
      { habilidad: 'listening', veredicto: 'acierto' },
      { habilidad: 'production', veredicto: 'acierto' },
    ]
  }
  if (resultado === 'casi') {
    return [
      { habilidad: 'listening', veredicto: 'acierto' },
      { habilidad: 'production', veredicto: 'fallo' },
    ]
  }

  // A missing word in full dictation is normally working-memory load, not
  // evidence that the learner cannot perceive a contrast.
  const hasListeningFailure = palabras.some((word) => word.categoria === 'phonetic_substitution' || (tier !== 3 && word.categoria === 'omission'))
  const hasOrthography = palabras.some((word) => word.categoria === 'spelling' || word.categoria === 'ortografia')
  const hasExtra = palabras.some((word) => word.categoria === 'insertion' || word.categoria === 'sobrante')
  const evidence: AttemptSkillEvidence[] = []
  if (hasListeningFailure) evidence.push({ habilidad: 'listening', veredicto: 'fallo' })
  else if (hasOrthography) evidence.push({ habilidad: 'listening', veredicto: 'acierto' })
  if (hasOrthography || hasExtra) evidence.push({ habilidad: 'production', veredicto: 'fallo' })
  return evidence
}

/** Short, intelligible chunks for the final audio-help rung. */
export function splitDictationIntoParts(sentence: string, wordsPerPart = 3): string[] {
  const words = sentence.trim().split(/\s+/).filter(Boolean)
  const parts: string[] = []
  for (let index = 0; index < words.length; index += wordsPerPart) {
    parts.push(words.slice(index, index + wordsPerPart).join(' '))
  }
  return parts
}
