export type PassageToken =
  | { kind: 'text'; value: string }
  | { kind: 'word'; value: string; lookup: string; context: string; emphasized: boolean }

const WORD = /[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+(?:['’][A-Za-z]+)*)*/g

function sentenceFor(text: string, index: number): string {
  const before = text.slice(0, index)
  const start = Math.max(before.lastIndexOf('.'), before.lastIndexOf('!'), before.lastIndexOf('?')) + 1
  const after = text.slice(index)
  const endOffset = after.search(/[.!?]/)
  const end = endOffset === -1 ? text.length : index + endOffset + 1
  return text.slice(start, end).replaceAll('**', '').trim()
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
    if (index > cursor) tokens.push({ kind: 'text', value: text.slice(cursor, index).replaceAll('**', '') })
    const value = match[0]
    tokens.push({
      kind: 'word',
      value,
      lookup: value.toLocaleLowerCase('en-US').replaceAll('’', "'"),
      context: sentenceFor(text, index),
      emphasized: isEmphasized(text, index),
    })
    cursor = index + value.length
  }

  if (cursor < text.length) tokens.push({ kind: 'text', value: text.slice(cursor).replaceAll('**', '') })
  return tokens
}
