/** Split-complementary accents derived from the learner's base `--hue`. */

export const HUE_ACCENT_1_OFFSET = 150;
export const HUE_ACCENT_2_OFFSET = 210;

export function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

/**
 * Yellow–green / mustard bands go muddy at mid lightness.
 * Bump chroma (and a touch of L) so accents stay vivid with any slider hue.
 */
export function isMuddyHue(hue: number): boolean {
  const h = normalizeHue(hue);
  return h >= 55 && h <= 110;
}

export function chromaBoostForHue(hue: number): number {
  const h = normalizeHue(hue);
  if (h >= 55 && h <= 95) return 1.28;
  if (h > 95 && h <= 110) return 1.16;
  if (h > 110 && h < 135) return 1.08;
  return 1;
}

/** Extra lightness on mid steps for muddy hues (CSS `--l-shift-*`). */
export function lightnessShiftForHue(hue: number): number {
  return isMuddyHue(hue) ? 0.035 : 0;
}

export type SplitComplementaryHues = {
  base: number;
  accent1: number;
  accent2: number;
};

export function deriveSplitComplementaryHues(baseHue: number): SplitComplementaryHues {
  const base = normalizeHue(baseHue);
  return {
    base,
    accent1: normalizeHue(base + HUE_ACCENT_1_OFFSET),
    accent2: normalizeHue(base + HUE_ACCENT_2_OFFSET),
  };
}

export type SplitComplementaryCssVars = Record<string, string>;

/** CSS custom properties to set on `<html>` when hue changes. */
export function splitComplementaryCssVars(baseHue: number): SplitComplementaryCssVars {
  const { base, accent1, accent2 } = deriveSplitComplementaryHues(baseHue);
  return {
    "--hue": String(base),
    "--hue-base": String(base),
    "--hue-accent-1": String(accent1),
    "--hue-accent-2": String(accent2),
    "--chroma-boost-base": String(chromaBoostForHue(base)),
    "--chroma-boost-accent-1": String(chromaBoostForHue(accent1)),
    "--chroma-boost-accent-2": String(chromaBoostForHue(accent2)),
    "--l-shift-base": String(lightnessShiftForHue(base)),
    "--l-shift-accent-1": String(lightnessShiftForHue(accent1)),
    "--l-shift-accent-2": String(lightnessShiftForHue(accent2)),
  };
}

export function applySplitComplementaryVars(
  target: HTMLElement,
  baseHue: number,
): void {
  const vars = splitComplementaryCssVars(baseHue);
  for (const [key, value] of Object.entries(vars)) {
    target.style.setProperty(key, value);
  }
}
