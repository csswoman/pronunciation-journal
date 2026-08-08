/**
 * Robust estimators for empirical calibration.
 * Median is the primary statistic; MAD filters outliers before re-estimating.
 */

export function median(values: readonly number[]): number | undefined {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return undefined;
  const sorted = [...finite].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * Linear interpolation percentile in [0, 100].
 * Empty or invalid percentile → undefined.
 */
export function percentile(
  values: readonly number[],
  pct: number,
): number | undefined {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0 || !Number.isFinite(pct) || pct < 0 || pct > 100) {
    return undefined;
  }
  if (finite.length === 1) return finite[0];
  const sorted = [...finite].sort((left, right) => left - right);
  const rank = (pct / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  const weight = rank - low;
  return sorted[low] * (1 - weight) + sorted[high] * weight;
}

const MAD_SCALE = 1.4826;

/**
 * Keeps values within multiplier × 1.4826 × MAD of the median.
 * When MAD is 0 (all equal), keeps every finite value.
 */
export function filterMadOutliers(
  values: readonly number[],
  multiplier: number,
): number[] {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return [];
  const center = median(finite);
  if (center === undefined) return [];
  const deviations = finite.map((value) => Math.abs(value - center));
  const mad = median(deviations) ?? 0;
  if (mad === 0) return [...finite];
  const limit = multiplier * MAD_SCALE * mad;
  return finite.filter((value) => Math.abs(value - center) <= limit);
}
