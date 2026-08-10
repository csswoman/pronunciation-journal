export type ListeningTier = 1 | 2 | 3;
export type ListeningTierOutcome = "clean_success" | "listening_failure" | "neutral";

export interface GlobalListeningTierState {
  tier: ListeningTier;
  cleanSuccessStreak: number;
  listeningFailureStreak: number;
}

export const INITIAL_LISTENING_TIER: GlobalListeningTierState = { tier: 1, cleanSuccessStreak: 0, listeningFailureStreak: 0 };

/** A global difficulty axis: contrasts select cloze targets but never own tier 3. */
export function advanceListeningTier(
  state: GlobalListeningTierState,
  outcome: ListeningTierOutcome,
): GlobalListeningTierState {
  if (outcome === "neutral") return state;
  if (outcome === "clean_success") {
    const successes = state.cleanSuccessStreak + 1;
    return successes < 3
      ? { ...state, cleanSuccessStreak: successes, listeningFailureStreak: 0 }
      : { tier: Math.min(3, state.tier + 1) as ListeningTier, cleanSuccessStreak: 0, listeningFailureStreak: 0 };
  }
  const failures = state.listeningFailureStreak + 1;
  return failures < 2
    ? { ...state, listeningFailureStreak: failures, cleanSuccessStreak: 0 }
    : { tier: Math.max(1, state.tier - 1) as ListeningTier, cleanSuccessStreak: 0, listeningFailureStreak: 0 };
}

/** Tier 3 omissions measure sentence memory, not phonetic perception. */
export function omissionIsListeningFailure(tier: ListeningTier): boolean { return tier !== 3; }

/** Spanish-speaking cold start when no contrast evidence exists. */
export const SPANISH_COLD_START_CONTRASTS = ["/ɪ/|/iː/", "/b/|/v/", "/æ/|/ʌ/", "/s/|/z/"] as const;
