import { describe, expect, it } from "vitest";
import { INITIAL_LISTENING_TIER, advanceListeningTier, omissionIsListeningFailure, SPANISH_COLD_START_CONTRASTS } from "../listening-tier";

describe("global listening tier", () => {
  it("starts at tier 1 and promotes only after three clean successes", () => {
    const one = advanceListeningTier(INITIAL_LISTENING_TIER, "clean_success");
    const two = advanceListeningTier(one, "clean_success");
    expect(two.tier).toBe(1);
    expect(advanceListeningTier(two, "clean_success")).toMatchObject({ tier: 2, cleanSuccessStreak: 0 });
  });
  it("drops after two listening failures and treats tier 3 omissions as neutral", () => {
    expect(advanceListeningTier({ tier: 2, cleanSuccessStreak: 0, listeningFailureStreak: 1 }, "listening_failure").tier).toBe(1);
    expect(omissionIsListeningFailure(1)).toBe(true);
    expect(omissionIsListeningFailure(3)).toBe(false);
  });
  it("uses the deterministic Spanish cold-start order", () => {
    expect(SPANISH_COLD_START_CONTRASTS).toEqual(['/ɪ/|/iː/', '/b/|/v/', '/æ/|/ʌ/', '/s/|/z/']);
  });
});
