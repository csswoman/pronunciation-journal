import { describe, expect, it } from 'vitest'
import { areHomophones, homophoneCaveat } from '../homophone-guard'

describe('homophone guard', () => {
  it('detects a classic homophone pair', async () => {
    expect(await areHomophones('their', 'there')).toBe(true)
  })

  it('detects homophones the recognizer commonly substitutes', async () => {
    expect(await areHomophones('to', 'too')).toBe(true)
    expect(await areHomophones('write', 'right')).toBe(true)
  })

  it('does not flag a minimal pair as homophones', async () => {
    // The whole point of minimal pairs is that they sound different.
    expect(await areHomophones('bit', 'beat')).toBe(false)
    expect(await areHomophones('ship', 'sheep')).toBe(false)
  })

  it('does not flag the same word as a homophone substitution', async () => {
    expect(await areHomophones('think', 'think')).toBe(false)
  })

  it('returns false when a word is missing from the dictionary', async () => {
    expect(await areHomophones('zzzqx', 'there')).toBe(false)
  })

  it('flags a caveat when the transcript swapped in a homophone', async () => {
    const caveat = await homophoneCaveat('their', 'there')
    expect(caveat).not.toBeNull()
    expect(caveat).toContain('there')
  })

  it('returns no caveat when the transcript matched the target', async () => {
    expect(await homophoneCaveat('their', 'their')).toBeNull()
  })

  it('returns no caveat for a genuinely different word', async () => {
    expect(await homophoneCaveat('think', 'sink')).toBeNull()
  })
})
