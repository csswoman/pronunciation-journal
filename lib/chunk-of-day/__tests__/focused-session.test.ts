import { describe, expect, it } from 'vitest'
import { loadFocusedChunkPracticeSession } from '../focused-session'

describe('loadFocusedChunkPracticeSession', () => {
  it('builds one phrase-led pronunciation session for the requested chunk', () => {
    const session = loadFocusedChunkPracticeSession(
      '013-where-are-you-from',
      'A1',
      'pronunciation',
    )

    expect(session?.chunks.map((chunk) => chunk.id)).toEqual([
      '013-where-are-you-from',
    ])
    expect(session?.exercises[0]?.slug).toBe('cs_shadow_phrase')
    expect(session?.exercises[0]?.sourceRef).toEqual({
      source: 'chunks',
      id: '013-where-are-you-from',
    })
  })

  it('does not open an unknown or above-level chunk', () => {
    expect(loadFocusedChunkPracticeSession('missing', 'A1')).toBeNull()
    expect(loadFocusedChunkPracticeSession('354-it-boils-down-to', 'A1')).toBeNull()
  })
})
