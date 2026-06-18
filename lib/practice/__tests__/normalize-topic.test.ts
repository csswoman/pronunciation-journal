import { describe, it, expect } from 'vitest'
import { normalizeTopic } from '@/lib/practice/normalize-topic'

describe('normalizeTopic', () => {
  it('lowercases and trims', () => {
    expect(normalizeTopic('  Present Simple  ')).toBe('present simple')
  })

  it('collapses underscores, hyphens and repeated spaces to a single space', () => {
    expect(normalizeTopic('present__simple')).toBe('present simple')
    expect(normalizeTopic('present-simple')).toBe('present simple')
    expect(normalizeTopic('present   simple')).toBe('present simple')
  })

  it('preserves the domain prefix and normalizes the rest', () => {
    expect(normalizeTopic('grammar:Present_Simple')).toBe('grammar:present simple')
    expect(normalizeTopic('vocab:Business')).toBe('vocab:business')
  })

  it('keeps distinct concepts distinct across domains', () => {
    expect(normalizeTopic('grammar:articles')).not.toBe(normalizeTopic('vocab:articles'))
  })

  it('returns null for empty or whitespace-only input', () => {
    expect(normalizeTopic('   ')).toBeNull()
    expect(normalizeTopic('')).toBeNull()
  })
})
