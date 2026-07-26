import { describe, it, expect } from 'vitest'
import { classifyVowel, VOWEL_CENTROIDS } from '../vowel-space'

describe('classifyVowel', () => {
  it('classifies formants near the /iː/ centroid as /iː/', () => {
    const centroid = VOWEL_CENTROIDS['iː']
    const result = classifyVowel(centroid.f1Hz, centroid.f2Hz)
    expect(result.vowel).toBe('iː')
    expect(result.confidence).toBeGreaterThan(0.8)
  })

  it('classifies formants near the /ɪ/ centroid as /ɪ/, distinct from /iː/', () => {
    const centroid = VOWEL_CENTROIDS['ɪ']
    const result = classifyVowel(centroid.f1Hz, centroid.f2Hz)
    expect(result.vowel).toBe('ɪ')
  })

  it('lowers confidence for formants roughly equidistant between two centroids', () => {
    const iCentroid = VOWEL_CENTROIDS['iː']
    const iiCentroid = VOWEL_CENTROIDS['ɪ']
    const midpointF1 = (iCentroid.f1Hz + iiCentroid.f1Hz) / 2
    const midpointF2 = (iCentroid.f2Hz + iiCentroid.f2Hz) / 2

    const result = classifyVowel(midpointF1, midpointF2)
    expect(result.confidence).toBeLessThan(0.6)
  })
})
