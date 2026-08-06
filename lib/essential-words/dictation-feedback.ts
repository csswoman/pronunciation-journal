import { isTypo } from './typo'

export type DictationWordStatus = 'match' | 'error' | 'typo' | 'missing'

export interface DictationWordDiff {
  expected: string
  written?: string
  status: DictationWordStatus
  isTarget: boolean
}

export interface DictationFeedback {
  words: DictationWordDiff[]
  extras: string[]
  terminalPunctuation: string
  hasDifferences: boolean
  hasTypos: boolean
  targetCorrect: boolean
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
      words.push({
        expected: expectedDisplay[expectedStart + offset] ?? expectedWord,
        written: writtenWord,
        status: isTypo(writtenWord, expectedWord, isKnownWord) ? 'typo' : 'error',
        isTarget: isTargetWordForm(expectedWord, targetWord),
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
  return {
    words,
    extras,
    terminalPunctuation,
    hasDifferences: differences.length > 0 || extras.length > 0,
    hasTypos: differences.some((word) => word.status === 'typo'),
    targetCorrect: !words.some((word) => word.isTarget && (word.status === 'error' || word.status === 'missing')),
  }
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
