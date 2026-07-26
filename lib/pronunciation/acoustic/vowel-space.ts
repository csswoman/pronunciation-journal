/**
 * Reference F1/F2 centroids for the English vowel contrasts plan 071 v1
 * targets, averaged from published formant studies (Hillenbrand et al.
 * 1995). Used for nearest-centroid classification — NOT a full acoustic
 * model, intentionally scoped to the small vowel-contrast set this
 * benchmark validates.
 */
export const VOWEL_CENTROIDS: Record<string, { f1Hz: number; f2Hz: number }> = {
  'iː': { f1Hz: 270, f2Hz: 2290 },
  'ɪ': { f1Hz: 400, f2Hz: 1990 },
  'æ': { f1Hz: 660, f2Hz: 1720 },
  'ʌ': { f1Hz: 640, f2Hz: 1190 },
}

export interface VowelClassification {
  vowel: string
  confidence: number
}

function euclideanDistance(f1a: number, f2a: number, f1b: number, f2b: number): number {
  return Math.sqrt((f1a - f1b) ** 2 + (f2a - f2b) ** 2)
}

/**
 * Nearest-centroid classification in F1/F2 space. Confidence is derived
 * from how much closer the nearest centroid is than the second-nearest —
 * a formant point equidistant between two vowels gets low confidence
 * rather than a falsely-certain pick.
 */
export function classifyVowel(f1Hz: number, f2Hz: number): VowelClassification {
  const distances = Object.entries(VOWEL_CENTROIDS)
    .map(([vowel, centroid]) => ({
      vowel,
      distance: euclideanDistance(f1Hz, f2Hz, centroid.f1Hz, centroid.f2Hz),
    }))
    .sort((a, b) => a.distance - b.distance)

  const [nearest, secondNearest] = distances
  const confidence =
    secondNearest.distance === 0
      ? 0
      : Math.max(0, Math.min(1, 1 - nearest.distance / secondNearest.distance))

  return { vowel: nearest.vowel, confidence }
}
