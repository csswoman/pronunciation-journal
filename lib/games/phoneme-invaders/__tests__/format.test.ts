import { describe, it, expect } from 'vitest'
import { formatContrast } from '../format'

describe('formatContrast', () => {
  it('renders both phonemes between slashes without changing case', () => {
    expect(formatContrast('iː|ɪ')).toBe('/iː/ vs /ɪ/')
    expect(formatContrast('b|v')).toBe('/b/ vs /v/')
  })
  it('returns empty text for empty input', () => {
    expect(formatContrast('')).toBe('')
  })
})
