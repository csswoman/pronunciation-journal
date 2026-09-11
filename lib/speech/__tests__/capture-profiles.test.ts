import { describe, expect, it } from 'vitest'
import {
  ACOUSTIC_SAMPLE_RATE,
  captureConstraints,
} from '../capture-profiles'

function audioOf(constraints: MediaStreamConstraints) {
  return constraints.audio as MediaTrackConstraints
}

describe('capture profiles', () => {
  it('enables browser processing for intelligibility capture', () => {
    const audio = audioOf(captureConstraints('intelligibility'))
    expect(audio.echoCancellation).toBe(true)
    expect(audio.noiseSuppression).toBe(true)
    expect(audio.autoGainControl).toBe(true)
  })

  it('disables every processing filter for acoustic capture', () => {
    // Filters reshape the spectrum and normalize amplitude, which is exactly
    // what a formant or vowel-duration measurement is trying to read.
    const audio = audioOf(captureConstraints('acoustic'))
    expect(audio.echoCancellation).toBe(false)
    expect(audio.noiseSuppression).toBe(false)
    expect(audio.autoGainControl).toBe(false)
  })

  it('pins a sample rate high enough to resolve formants', () => {
    const audio = audioOf(captureConstraints('acoustic'))
    expect(audio.sampleRate).toBe(ACOUSTIC_SAMPLE_RATE)
    expect(ACOUSTIC_SAMPLE_RATE).toBeGreaterThanOrEqual(44100)
  })

  it('captures a single channel for acoustic analysis', () => {
    expect(audioOf(captureConstraints('acoustic')).channelCount).toBe(1)
  })

  it('defaults to the intelligibility profile', () => {
    expect(captureConstraints('intelligibility')).toEqual(
      captureConstraints('intelligibility')
    )
    expect(audioOf(captureConstraints('intelligibility')).sampleRate).toBeUndefined()
  })
})
