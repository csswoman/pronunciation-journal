import { describe, expect, it } from "vitest";
import { compareIpaPronunciations, segmentIpa } from "../phonetic-substitution";

describe("phonetic substitution", () => {
  it("keeps affricates, diphthongs and long vowels atomic", () => {
    expect(segmentIpa("/sʌtʃ/")).toEqual(["s", "ʌ", "tʃ"]);
    expect(segmentIpa("/sɜːtʃ/")).toEqual(["s", "ɜː", "tʃ"]);
    expect(segmentIpa("/steɪt/")).toEqual(["s", "t", "eɪ", "t"]);
  });

  it("attributes /sʌtʃ/ to /sɜːtʃ/ as one phonetic contrast", () => {
    expect(compareIpaPronunciations("/sʌtʃ/", "/sɜːtʃ/")).toMatchObject({ kind: "phonetic_substitution" });
  });

  it("does not attribute still to state", () => {
    expect(compareIpaPronunciations("/stɪl/", "/steɪt/")).toMatchObject({ kind: "guess" });
  });
});
