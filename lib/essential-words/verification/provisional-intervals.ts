export type ProvisionalOrigin = "direct-easy" | "direct-good" | "inference";

export interface ProvisionalWindow {
  minDays: number;
  maxDays: number;
}

/**
 * Provisional windows are calibrated in phase 8. Direct evidence can wait
 * longer than a statistical placement inference because it is stronger.
 */
export const PROVISIONAL_WINDOWS: Record<ProvisionalOrigin, ProvisionalWindow> = {
  "direct-easy": { minDays: 14, maxDays: 30 },
  "direct-good": { minDays: 14, maxDays: 21 },
  inference: { minDays: 7, maxDays: 21 },
};

const DAY_MS = 86_400_000;

/** Stable string hash represented as a non-negative 32-bit integer. */
function hash(value: string): number {
  let result = 0;
  for (const character of value) {
    result = (result * 31 + character.charCodeAt(0)) | 0;
  }
  return result >>> 0;
}

/**
 * Returns a deterministic due date inside the origin's window. Item-derived
 * offsets spread provisional reviews without relying on random state.
 */
export function provisionalDueAt(
  origin: ProvisionalOrigin,
  itemId: string,
  now: Date,
): Date {
  const { minDays, maxDays } = PROVISIONAL_WINDOWS[origin];
  const span = maxDays - minDays + 1;
  const days = minDays + (hash(itemId) % span);

  return new Date(now.getTime() + days * DAY_MS);
}
