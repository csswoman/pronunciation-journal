/**
 * Pure proportional-by-phoneme-count word segmentation for speechocean762
 * utterances that have no real timestamps. NOT a forced aligner — see
 * plan 071 Task 6b design note. Benchmark metrics (Task 8) are the honest
 * check on whether this estimate is usable, not an assumption made here.
 */
export interface TimeWindow {
  startMs: number
  endMs: number
}

/**
 * Splits `totalDurationMs` across words in `phoneCounts` order, each word's
 * share proportional to its phoneme count. Words with zero phones get a
 * zero-width window rather than crashing — callers should skip those.
 */
export function proportionalWordWindow(phoneCounts: number[], totalDurationMs: number): TimeWindow[] {
  const totalPhones = phoneCounts.reduce((sum, n) => sum + n, 0)
  if (totalPhones === 0) return phoneCounts.map(() => ({ startMs: 0, endMs: 0 }))

  const windows: TimeWindow[] = []
  let cursorMs = 0
  for (const count of phoneCounts) {
    const shareMs = (count / totalPhones) * totalDurationMs
    const startMs = cursorMs
    const endMs = cursorMs + shareMs
    windows.push({ startMs, endMs })
    cursorMs = endMs
  }
  return windows
}

/** Center third (33%-66%) of a window — avoids consonant-heavy edges around the vowel nucleus of short CVC words. */
export function centerThird(window: TimeWindow): TimeWindow {
  const span = window.endMs - window.startMs
  const third = span / 3
  return { startMs: window.startMs + third, endMs: window.endMs - third }
}
