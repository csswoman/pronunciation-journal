export type PassageToken =
  | { kind: 'text'; value: string; sentenceIndex: number }
  | { kind: 'word'; value: string; lookup: string; context: string; emphasized: boolean; sentenceIndex: number }

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

/** Splits a passage without changing its visible whitespace or punctuation. */
export function tokenizePassage(text: string): PassageToken[] {
  const tokens: PassageToken[] = []
  let cursor = 0

  for (const match of text.matchAll(WORD)) {
    const index = match.index ?? 0
    if (index > cursor) {
      tokens.push({
        kind: 'text',
        value: text.slice(cursor, index).replaceAll('**', ''),
        sentenceIndex: sentenceIndexFor(text, cursor),
      })
    }
    const value = match[0]
    tokens.push({
      kind: 'word',
      value,
      lookup: value.toLocaleLowerCase('en-US').replaceAll('’', "'"),
      context: sentenceFor(text, index),
      emphasized: isEmphasized(text, index),
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
