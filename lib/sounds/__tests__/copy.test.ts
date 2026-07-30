import { describe, expect, it } from "vitest";
import { PHONEMES } from "@/components/ipa/data";
import { getSoundDescription, SOUND_DESCRIPTION_ES } from "@/lib/sounds/copy";

describe("sound learner copy", () => {
  it("covers every canonical phoneme with a Spanish description", () => {
    expect(Object.keys(SOUND_DESCRIPTION_ES)).toHaveLength(PHONEMES.length);

    for (const phoneme of PHONEMES) {
      expect(SOUND_DESCRIPTION_ES[phoneme.symbol]).toBeTruthy();
      expect(getSoundDescription(phoneme)).not.toBe(phoneme.description);
    }
  });

  it("uses the canonical description for the legacy /ɡ/ alias", () => {
    expect(getSoundDescription({ symbol: "/ɡ/" })).toBe(SOUND_DESCRIPTION_ES["/g/"]);
  });
});
