export type PassageToken =
  | { kind: 'text'; value: string }
  | { kind: 'word'; value: string; lookup: string; context: string }

const WORD = /[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+(?:['’][A-Za-z]+)*)*/g

function sentenceFor(text: string, index: number): string {
  const before = text.slice(0, index)
  const start = Math.max(before.lastIndexOf('.'), before.lastIndexOf('!'), before.lastIndexOf('?')) + 1
  const after = text.slice(index)
  const endOffset = after.search(/[.!?]/)
  const end = endOffset === -1 ? text.length : index + endOffset + 1
  return text.slice(start, end).trim()
}

/** Splits a passage without changing its visible whitespace or punctuation. */
export function tokenizePassage(text: string): PassageToken[] {
  const tokens: PassageToken[] = []
  let cursor = 0

  for (const match of text.matchAll(WORD)) {
    const index = match.index ?? 0
    if (index > cursor) tokens.push({ kind: 'text', value: text.slice(cursor, index) })
    const value = match[0]
    tokens.push({
      kind: 'word',
      value,
      lookup: value.toLocaleLowerCase('en-US').replaceAll('’', "'"),
      context: sentenceFor(text, index),
    })
    cursor = index + value.length
  }

  if (cursor < text.length) tokens.push({ kind: 'text', value: text.slice(cursor) })
  return tokens
}
