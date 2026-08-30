import { describe, it, expect } from "vitest";
import type { TonguePosition } from "@/lib/pronunciation/articulation-guide-data";
import { getTongueGeometry } from "@/lib/pronunciation/sagittal-tongue-geometry";

const ALL_POSITIONS: TonguePosition[] = [
  "high-front",
  "mid-front",
  "low-front",
  "central",
  "high-back",
  "mid-back",
  "low-back",
  "tip-between-teeth",
  "tip-on-ridge",
  "blade-on-palate",
  "back-on-velum",
  "retroflex-curl",
  "glottal",
];

describe("getTongueGeometry", () => {
  it("returns a closed path for every tongue position", () => {
    for (const position of ALL_POSITIONS) {
      const geometry = getTongueGeometry(position);
      expect(geometry.path.startsWith("M "), `${position} should start with a moveto`).toBe(true);
      expect(geometry.path.trimEnd().endsWith("Z"), `${position} should close`).toBe(true);
    }
  });

  it("gives every position a non-empty Spanish label", () => {
    for (const position of ALL_POSITIONS) {
      expect(getTongueGeometry(position).label.length).toBeGreaterThan(0);
    }
  });

  it("orders front vowel height so high sits above mid, and mid above low", () => {
    const high = getTongueGeometry("high-front").contactY;
    const mid = getTongueGeometry("mid-front").contactY;
    const low = getTongueGeometry("low-front").contactY;

    // Smaller y = higher in the mouth.
    expect(high).toBeLessThan(mid);
    expect(mid).toBeLessThan(low);
  });

  it("orders back vowel height consistently with front vowels", () => {
    const high = getTongueGeometry("high-back").contactY;
    const mid = getTongueGeometry("mid-back").contactY;
    const low = getTongueGeometry("low-back").contactY;

    expect(high).toBeLessThan(mid);
    expect(mid).toBeLessThan(low);
  });

  it("separates /iː/ and /ɪ/ enough to be visible on a 180-unit canvas", () => {
    const tense = getTongueGeometry("high-front").contactY;
    const lax = getTongueGeometry("mid-front").contactY;
    expect(Math.abs(lax - tense)).toBeGreaterThanOrEqual(20);
  });

  it("places front vowels ahead of back vowels", () => {
    expect(getTongueGeometry("high-front").contactX).toBeGreaterThan(
      getTongueGeometry("high-back").contactX,
    );
  });

  it("flags closures as contact and free vowels as non-contact", () => {
    expect(getTongueGeometry("tip-on-ridge").isContact).toBe(true);
    expect(getTongueGeometry("back-on-velum").isContact).toBe(true);
    expect(getTongueGeometry("high-front").isContact).toBe(false);
    expect(getTongueGeometry("low-back").isContact).toBe(false);
  });

  it("keeps every contact point inside the viewBox", () => {
    for (const position of ALL_POSITIONS) {
      const { contactX, contactY } = getTongueGeometry(position);
      expect(contactX, `${position} x`).toBeGreaterThanOrEqual(0);
      expect(contactX, `${position} x`).toBeLessThanOrEqual(240);
      expect(contactY, `${position} y`).toBeGreaterThanOrEqual(0);
      expect(contactY, `${position} y`).toBeLessThanOrEqual(180);
    }
  });
});
