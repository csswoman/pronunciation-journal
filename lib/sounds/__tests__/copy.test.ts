import { describe, expect, it } from "vitest";
import { PHONEMES } from "@/components/ipa/data";
import { getSoundDescription, getSoundLearnerHint, SOUND_DESCRIPTION_ES, SOUND_LEARNER_HINT_ES } from "@/lib/sounds/copy";
import { IPA_EXTRA } from "@/lib/pronunciation/ipa-data";
import { getArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";

describe("sound learner copy", () => {
  it("covers every canonical phoneme with a Spanish description", () => {
    expect(Object.keys(SOUND_DESCRIPTION_ES)).toHaveLength(PHONEMES.length);

    for (const phoneme of PHONEMES) {
      expect(SOUND_DESCRIPTION_ES[phoneme.symbol]).toBeTruthy();
      expect(getSoundDescription(phoneme)).not.toBe(phoneme.description);
    }
  });

  it("covers every canonical phoneme with a simplified learner hint in Spanish", () => {
    expect(Object.keys(SOUND_LEARNER_HINT_ES)).toHaveLength(PHONEMES.length);

    for (const phoneme of PHONEMES) {
      const hint = getSoundLearnerHint(phoneme);
      expect(hint).toBeTruthy();
      expect(hint).toBe(SOUND_LEARNER_HINT_ES[phoneme.symbol]);
      // Verify hints avoid academic jargon like "abierta-media anterior no redondeada"
      expect(hint).not.toMatch(/anterior no redondeada|fricativa alveolar|oclusiva velar/i);
    }
  });

  it("covers every canonical phoneme in IPA_EXTRA with spanishTip and articulationEs", () => {
    for (const phoneme of PHONEMES) {
      const extra = IPA_EXTRA[phoneme.symbol];
      expect(extra, `Missing IPA_EXTRA for ${phoneme.symbol}`).toBeDefined();
      expect(extra?.spanishTip, `Missing spanishTip for ${phoneme.symbol}`).toBeTruthy();
      expect(extra?.articulationEs?.length, `Missing articulationEs for ${phoneme.symbol}`).toBeGreaterThan(0);
    }
  });

  it("covers every canonical phoneme with an articulation guide", () => {
    for (const phoneme of PHONEMES) {
      const guide = getArticulationGuide(phoneme.symbol);
      expect(guide, `Missing articulation guide for ${phoneme.symbol}`).toBeDefined();
    }
  });

  it("uses the canonical description for the legacy /ɡ/ alias", () => {
    expect(getSoundDescription({ symbol: "/ɡ/" })).toBe(SOUND_DESCRIPTION_ES["/g/"]);
    expect(getSoundLearnerHint({ symbol: "/ɡ/" })).toBe(SOUND_LEARNER_HINT_ES["/g/"]);
  });
});
