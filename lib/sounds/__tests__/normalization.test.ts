import { describe, expect, it } from "vitest";
import { PHONEMES } from "@/components/ipa/data";
import { canonicalizeContrastId, contrastKey } from "@/lib/phoneme-practice/phoneme-similarity";
import {
  canonicalizeProgressRows,
  canonicalizeSoundRows,
} from "@/lib/sounds/normalization";

describe("canonical sound identity", () => {
  it("uses explicit inventory classes and keeps the GA count at 40", () => {
    expect(PHONEMES).toHaveLength(40);
    expect(PHONEMES.filter((sound) => sound.type === "vowel")).toHaveLength(11);
    expect(PHONEMES.filter((sound) => sound.type === "consonant")).toHaveLength(24);
    expect(PHONEMES.filter((sound) => sound.type === "diphthong")).toHaveLength(5);
    expect(PHONEMES.filter((sound) => sound.symbol === "/eɪ/")[0]?.type).toBe("diphthong");
  });

  it("keeps hot as the single learner-facing anchor for /ɑ/", () => {
    const sound = PHONEMES.find((phoneme) => phoneme.symbol === "/ɑ/");

    expect(sound?.examples[0]).toBe("hot");
    expect(sound?.description).toContain("hot");
    expect(sound?.description).not.toContain("father");
  });

  it("merges /ɡ/ into /g/ at the Supabase row boundary", () => {
    const rows = canonicalizeSoundRows([
      { id: 34, ipa: "/ɡ/", example: "go", category: "plosive", type: "consonant", difficulty: 1 },
      { id: 61, ipa: "/g/", example: "go", category: "plosive", type: "consonant", difficulty: 1 },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 61, ipa: "/g/", type: "consonant" });
  });

  it("canonicalizes persisted SRS contrast ids before consumers compare them", () => {
    expect(contrastKey("/ɡ/", "/k/")).toBe("/g/|/k/");
    expect(canonicalizeContrastId("/ɡ/|/k/")).toBe("/g/|/k/");

    const rows = canonicalizeProgressRows([
      { id: "alias", contrast_id: "/ɡ/|/k/" },
      { id: "canonical", contrast_id: "/g/|/k/" },
    ]);

    expect(rows).toEqual([{ id: "canonical", contrast_id: "/g/|/k/" }]);
  });
});
