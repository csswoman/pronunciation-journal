import { getSRSData, saveSRSData } from '@/lib/db'
import type { SRSData } from '@/lib/types'

/**
 * Record a passive reader exposure on the SRS record `srsId` (already namespaced,
 * e.g. `c1k:go` / `fragment:123` / `wb:<uuid>`). Writes ONLY the `exposure`
 * sub-object; never touches the SM-2 recall fields. Both correct and incorrect
 * comprehension call this — exposure is not a grade.
 */
export async function recordReaderExposure(srsId: string, word: string): Promise<void> {
  const current: SRSData = (await getSRSData(srsId)) ?? {
    wordId: srsId,
    word,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
  }
  const prev = current.exposure ?? { lastAt: 0, count: 0 }
  await saveSRSData({
    ...current,
    exposure: { lastAt: Date.now(), count: prev.count + 1 },
  })
}
