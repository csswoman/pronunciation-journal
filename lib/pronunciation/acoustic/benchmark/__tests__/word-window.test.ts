import { describe, it, expect } from 'vitest'
import { proportionalWordWindow, centerThird } from '../word-window'

describe('proportionalWordWindow', () => {
  it('splits total duration among words proportional to phoneme count', () => {
    // 3 words: "WE" (2 phones: W IY0), "CALL" (3 phones: K AO0 L), "IT" (2 phones: IH0 T)
    // total phones = 7, total duration = 1400ms -> 200ms/phone
    const phoneCounts = [2, 3, 2]
    const totalDurationMs = 1400

    const windows = proportionalWordWindow(phoneCounts, totalDurationMs)

    expect(windows).toHaveLength(3)
    expect(windows[0]).toEqual({ startMs: 0, endMs: 400 })
    expect(windows[1]).toEqual({ startMs: 400, endMs: 1000 })
    expect(windows[2]).toEqual({ startMs: 1000, endMs: 1400 })
  })

  it('handles a single-word utterance as one full-duration window', () => {
    const windows = proportionalWordWindow([2], 500)
    expect(windows).toEqual([{ startMs: 0, endMs: 500 }])
  })
})

describe('centerThird', () => {
  it('returns the middle 33%-66% of a window', () => {
    const result = centerThird({ startMs: 400, endMs: 1000 })
    // span = 600, third = 200 -> [400+200, 1000-200] = [600, 800]
    expect(result).toEqual({ startMs: 600, endMs: 800 })
  })
})
