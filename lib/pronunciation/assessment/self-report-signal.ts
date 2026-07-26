import type { TargetResult } from './types'

/** Confidence floor for a "Me cuesta" prosody self-report (see scoring.ts). */
export const SELF_REPORT_STRUGGLE_CONFIDENCE = 0.3

export function isSelfReportStruggle(result: TargetResult): boolean {
  return result.signalType === 'self_report' && result.confidence >= SELF_REPORT_STRUGGLE_CONFIDENCE
}

/** Highest-confidence struggle self-report, if any — used to seed Day 1 copy. */
export function pickSelfReportStruggle(
  results: readonly TargetResult[]
): TargetResult | null {
  let best: TargetResult | null = null
  for (const result of results) {
    if (!isSelfReportStruggle(result)) continue
    if (!best || result.confidence > best.confidence) best = result
  }
  return best
}
