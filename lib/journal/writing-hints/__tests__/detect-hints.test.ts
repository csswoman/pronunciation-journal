import { describe, expect, it } from 'vitest'
import { detectWritingHints } from '@/lib/journal/writing-hints/detect-hints'

describe('detectWritingHints', () => {
  it('returns matches ordered by position', () => {
    const text = 'I dont know why he go there. Yesterday I goed home.'
    const matches = detectWritingHints(text)
    expect(matches.length).toBeGreaterThan(0)
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i].start).toBeGreaterThanOrEqual(matches[i - 1].start)
    }
  })

  it('resolves overlapping matches by keeping the first by position', () => {
    const text = 'I am agree with everyone.'
    const matches = detectWritingHints(text)
    const overlapping = matches.filter((m) => m.start < 5)
    expect(overlapping.length).toBeLessThanOrEqual(1)
  })

  it('returns an empty array for clean text', () => {
    expect(detectWritingHints('I went to the store yesterday.')).toHaveLength(0)
  })
})
