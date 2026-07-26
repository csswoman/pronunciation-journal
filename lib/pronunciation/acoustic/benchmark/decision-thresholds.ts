/**
 * Ship/no-ship thresholds for plan 071, fixed BEFORE running the benchmark
 * against real corpus data (spec section "Umbrales de decisión"). Changing
 * this value after seeing results defeats the point — any change here
 * should be its own reviewable commit with a stated reason, not a drive-by
 * edit alongside a benchmark run.
 */
export const SHIP_AGREEMENT_THRESHOLD = 0.85

export type ContrastVerdict = 'ship' | 'no_ship'

export function decideVowelContrastVerdict(agreementRate: number): ContrastVerdict {
  return agreementRate >= SHIP_AGREEMENT_THRESHOLD ? 'ship' : 'no_ship'
}
