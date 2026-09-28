export const RECHECK_SAMPLE_RATE = 1 / 15;
export const RECHECK_DELAY_DAYS = 4;

export interface KnownWordClaim {
  wordId: string;
  familiarity: "unknown" | "self-declared";
  declaredKnownAt?: string;
}

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Deterministic per-word decision: same word always samples the same way.
 * Maps string hash to [0, 1) and compares against RECHECK_SAMPLE_RATE.
 */
export function shouldSampleForRecheck(wordId: string): boolean {
  const hash = hashString(wordId);
  const normalized = hash / 4294967296;
  return normalized < RECHECK_SAMPLE_RATE;
}

/** A sampled familiarity claim becomes a practice verification after four UTC days. */
export function isKnownClaimRecheckDue(claim: KnownWordClaim, now: Date): boolean {
  if (
    claim.familiarity !== "self-declared"
    || !claim.declaredKnownAt
    || !shouldSampleForRecheck(claim.wordId)
  ) return false;

  const declaredAt = new Date(claim.declaredKnownAt);
  if (Number.isNaN(declaredAt.getTime())) return false;
  declaredAt.setUTCDate(declaredAt.getUTCDate() + RECHECK_DELAY_DAYS);
  return declaredAt.getTime() <= now.getTime();
}
