import { describe, expect, it } from "vitest";
import { auditSounds, auditWords, type SoundRow } from "../audit";

/** A complete, valid sound row for the phoneme under test. */
function sound(overrides: Partial<SoundRow> & { id: number }): SoundRow {
  return { ipa: "/ɑ/", type: "vowel", example: "hot", ...overrides };
}

const problems = (findings: { severity: string }[]) =>
  findings.filter((finding) => finding.severity !== "ok");

describe("auditSounds", () => {
  it("normalizes /ɡ/ to /g/ and maps the row id", () => {
    const { canonicalIdToIpa, findings } = auditSounds([
      sound({ id: 1, ipa: "/ɡ/", type: "consonant", example: "go" }),
    ]);
    expect(canonicalIdToIpa.get(1)).toBe("/g/");
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "review", sound: "/g/" }),
    );
  });

  it("reports rows that collapse onto the same phoneme as duplicates", () => {
    const { findings } = auditSounds([
      sound({ id: 1, ipa: "/g/", type: "consonant", example: "go" }),
      sound({ id: 2, ipa: "/ɡ/", type: "consonant", example: "go" }),
    ]);
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        detail: "2 rows normalize to the same phoneme",
      }),
    );
  });

  it("flags a class that disagrees with the canonical inventory", () => {
    const { findings } = auditSounds([sound({ id: 1, type: "consonant" })]);
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        detail: 'class is "consonant", canonical is "vowel"',
      }),
    );
  });

  it("flags an anchor that is not an inventory example", () => {
    const { findings } = auditSounds([sound({ id: 1, example: "father" })]);
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "review",
        subject: "anchor",
        sound: "/ɑ/",
      }),
    );
  });

  it("accepts a valid anchor", () => {
    const { findings } = auditSounds([sound({ id: 1, example: "hot" })]);
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "ok", subject: "anchor", sound: "/ɑ/" }),
    );
  });

  it("reports canonical phonemes with no row at all", () => {
    const { findings } = auditSounds([]);
    expect(
      findings.filter((f) => f.detail === "no sound row for this canonical phoneme"),
    ).toHaveLength(40);
  });
});

describe("auditWords", () => {
  const idToIpa = new Map([[1, "/ɑ/"], [2, "/æ/"]]);

  it("accepts a word whose IPA contains its sound", () => {
    const findings = auditWords(
      [{ id: 1, word: "hot", ipa: "/hɑt/", sound_id: 1, sound_focus: "/ɑ/" }],
      idToIpa,
    );
    expect(problems(findings)).toEqual([]);
  });

  it("accepts a dialectal transcription after normalization", () => {
    const findings = auditWords(
      [{ id: 1, word: "hot", ipa: "/hɒt/", sound_id: 1, sound_focus: "/ɑ/" }],
      idToIpa,
    );
    expect(problems(findings)).toEqual([]);
  });

  it("errors when the IPA does not contain the filed sound", () => {
    const findings = auditWords(
      [{ id: 1, word: "grass", ipa: "/ɡræs/", sound_id: 1, sound_focus: "/ɑ/" }],
      idToIpa,
    );
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "error", subject: "grass" }),
    );
  });

  it("errors when sound_focus disagrees with sound_id", () => {
    const findings = auditWords(
      [{ id: 1, word: "hot", ipa: "/hɑt/", sound_id: 1, sound_focus: "/æ/" }],
      idToIpa,
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        detail: "sound_focus /æ/ disagrees with sound_id (/ɑ/)",
      }),
    );
  });

  it("marks words without IPA for review rather than error", () => {
    const findings = auditWords(
      [{ id: 1, word: "barn", ipa: null, sound_id: 1, sound_focus: "/ɑ/" }],
      idToIpa,
    );
    expect(findings).toEqual([
      expect.objectContaining({ severity: "review", subject: "barn", detail: "no IPA" }),
    ]);
  });

  it("errors on an unresolvable sound_id", () => {
    const findings = auditWords(
      [{ id: 1, word: "hot", ipa: "/hɑt/", sound_id: 99, sound_focus: null }],
      idToIpa,
    );
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "error", subject: "hot" }),
    );
  });
});
