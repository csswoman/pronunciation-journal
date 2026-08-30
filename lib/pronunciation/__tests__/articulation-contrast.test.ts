import { describe, it, expect } from "vitest";
import { getArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";
import { getArticulationContrast } from "@/lib/pronunciation/articulation-contrast";

function guideOrThrow(symbol: string) {
  const guide = getArticulationGuide(symbol);
  if (!guide) throw new Error(`Missing articulation guide for ${symbol}`);
  return guide;
}

describe("getArticulationContrast", () => {
  it("reports tongue and lip differences for /iː/ vs /ɪ/", () => {
    const contrast = getArticulationContrast(guideOrThrow("/iː/"), guideOrThrow("/ɪ/"));

    const dimensions = contrast.differences.map((diff) => diff.dimension);
    expect(dimensions).toContain("tongue");
    expect(dimensions).toContain("lips");
    expect(contrast.changed.has("tongue")).toBe(true);
  });

  it("does not report voicing when both sounds are voiced", () => {
    const contrast = getArticulationContrast(guideOrThrow("/iː/"), guideOrThrow("/ɪ/"));
    expect(contrast.changed.has("voicing")).toBe(false);
  });

  it("reports voicing when it is the distinguishing feature", () => {
    const contrast = getArticulationContrast(guideOrThrow("/f/"), guideOrThrow("/v/"));
    expect(contrast.changed.has("voicing")).toBe(true);
  });

  it("leads the summary with the highest-priority difference", () => {
    const contrast = getArticulationContrast(guideOrThrow("/iː/"), guideOrThrow("/ɪ/"));
    expect(contrast.summaryEs).toMatch(/^Fíjate en la lengua/i);
  });

  it("falls back to a duration cue when nothing visible differs", () => {
    const guide = guideOrThrow("/iː/");
    const contrast = getArticulationContrast(guide, guide);
    expect(contrast.differences).toHaveLength(0);
    expect(contrast.summaryEs).toMatch(/duración y la tensión/i);
  });
});
