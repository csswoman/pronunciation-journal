export type PassageToken =
  | { kind: 'text'; value: string; sentenceIndex: number }
  | { kind: 'word'; value: string; lookup: string; context: string; emphasized: boolean; highlighted: boolean; sentenceIndex: number }

export interface SentenceTokenGroup {
  sentenceIndex: number;
  tokens: PassageToken[];
}

const WORD = /[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+(?:['’][A-Za-z]+)*)*/g

function sentenceFor(text: string, index: number): string {
  const before = text.slice(0, index)
  const start = Math.max(before.lastIndexOf('.'), before.lastIndexOf('!'), before.lastIndexOf('?')) + 1
  const after = text.slice(index)
  const endOffset = after.search(/[.!?]/)
  const end = endOffset === -1 ? text.length : index + endOffset + 1
  return text.slice(start, end).replaceAll('**', '').trim()
}

function sentenceIndexFor(text: string, index: number): number {
  const before = text.slice(0, index)
  const matches = before.match(/[^.!?]+[.!?]+(?:\s+|$)/g)
  return matches ? matches.length : 0
}

function isEmphasized(text: string, index: number): boolean {
  const openingMarkers = text.slice(0, index).match(/\*\*/g)?.length ?? 0
  return openingMarkers % 2 === 1 && text.indexOf('**', index) !== -1
}

interface WordSpan {
  index: number
  value: string
  highlighted: boolean
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Multi-word targets ("dependency array") become one span so they render as a single chip. */
function phraseSpans(text: string, targets: string[]): WordSpan[] {
  const phrases = targets.map((t) => t.trim()).filter((t) => /\s/.test(t))
  return phrases.flatMap((phrase) => {
    const pattern = new RegExp(`(?<![A-Za-z])${escapeRegExp(phrase).replace(/\s+/g, '\\s+')}(?![A-Za-z])`, 'gi')
    return [...text.matchAll(pattern)].map((m) => ({ index: m.index ?? 0, value: m[0], highlighted: true }))
  })
}

function collectSpans(text: string, targets: string[]): WordSpan[] {
  const targetSet = new Set(targets.map((t) => t.trim().toLocaleLowerCase('en-US')))
  const phrases = phraseSpans(text, targets)
  const words = [...text.matchAll(WORD)]
    .map((m) => {
      const index = m.index ?? 0
      const lookup = m[0].toLocaleLowerCase('en-US').replaceAll('’', "'")
      return { index, value: m[0], highlighted: isEmphasized(text, index) || targetSet.has(lookup) }
    })
    .filter((w) => !phrases.some((p) => w.index >= p.index && w.index < p.index + p.value.length))
  return [...phrases, ...words].sort((a, b) => a.index - b.index)
}

/**
 * Splits a passage without changing its visible whitespace or punctuation.
 * `targets` are the key words/phrases; they are flagged `highlighted` (as are **bold** words).
 */
export function tokenizePassage(text: string, targets: string[] = []): PassageToken[] {
  const tokens: PassageToken[] = []
  let cursor = 0

  for (const span of collectSpans(text, targets)) {
    const { index, value } = span
    if (index > cursor) {
      tokens.push({
        kind: 'text',
        value: text.slice(cursor, index).replaceAll('**', ''),
        sentenceIndex: sentenceIndexFor(text, cursor),
      })
    }
    tokens.push({
      kind: 'word',
      value,
      lookup: value.toLocaleLowerCase('en-US').replaceAll('’', "'").replace(/\s+/g, ' '),
      context: sentenceFor(text, index),
      emphasized: isEmphasized(text, index),
      highlighted: span.highlighted,
      sentenceIndex: sentenceIndexFor(text, index),
    })
    cursor = index + value.length
  }

  if (cursor < text.length) {
    tokens.push({
      kind: 'text',
      value: text.slice(cursor).replaceAll('**', ''),
      sentenceIndex: sentenceIndexFor(text, cursor),
    })
  }
  return tokens
}

/** Groups tokens into contiguous sentences for synchronized bimodal reading and highlighting. */
export function groupTokensBySentence(tokens: PassageToken[]): SentenceTokenGroup[] {
  const groups: SentenceTokenGroup[] = []
  let currentGroup: SentenceTokenGroup | null = null

  for (const token of tokens) {
    if (!currentGroup || currentGroup.sentenceIndex !== token.sentenceIndex) {
      currentGroup = { sentenceIndex: token.sentenceIndex, tokens: [] }
      groups.push(currentGroup)
    }
    currentGroup.tokens.push(token)
  }

  return groups
}
