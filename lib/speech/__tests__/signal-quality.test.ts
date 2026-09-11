import { describe, expect, it } from 'vitest'
import { SILENCE_PEAK_THRESHOLD, isSilentCapture, trackPeak } from '../signal-quality'

describe('signal quality', () => {
  it('tracks the loudest peak seen so far', () => {
    const tracker = trackPeak()
    tracker.observe(0.1)
    tracker.observe(0.7)
    tracker.observe(0.3)
    expect(tracker.peak()).toBeCloseTo(0.7)
  })

  it('starts at zero before any sample', () => {
    expect(trackPeak().peak()).toBe(0)
  })

  it('treats a capture that never rose above the noise floor as silent', () => {
    const tracker = trackPeak()
    tracker.observe(0.01)
    tracker.observe(0.02)
    expect(isSilentCapture(tracker.peak())).toBe(true)
  })

  it('does not flag a capture with real speech as silent', () => {
    const tracker = trackPeak()
    tracker.observe(0.02)
    tracker.observe(0.45)
    expect(isSilentCapture(tracker.peak())).toBe(false)
  })

  it('treats the threshold itself as audible', () => {
    expect(isSilentCapture(SILENCE_PEAK_THRESHOLD)).toBe(false)
  })

  it('ignores out-of-range samples instead of skewing the peak', () => {
    const tracker = trackPeak()
    tracker.observe(0.4)
    tracker.observe(Number.NaN)
    tracker.observe(12)
    tracker.observe(-3)
    expect(tracker.peak()).toBeCloseTo(0.4)
  })

  it('resets back to silence', () => {
    const tracker = trackPeak()
    tracker.observe(0.9)
    tracker.reset()
    expect(tracker.peak()).toBe(0)
  })
})
