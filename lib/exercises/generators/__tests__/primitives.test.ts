import { afterEach, describe, expect, it, vi } from 'vitest'
import { shuffleDistinct } from '../primitives'

describe('shuffleDistinct', () => {
  afterEach(() => vi.restoreAllMocks())

  it('retries when a permutation first preserves the input order', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.99).mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0).mockReturnValueOnce(0)
    expect(shuffleDistinct(['one', 'two', 'three'])).not.toEqual(['one', 'two', 'three'])
  })

  it('copies trivial arrays without mutating them', () => {
    const input = ['only']
    const result = shuffleDistinct(input)
    expect(result).toEqual(input)
    expect(result).not.toBe(input)
  })
})
