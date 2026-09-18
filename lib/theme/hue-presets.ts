/** Curated swatch presets for the theme-color pickers (sidebar + bottom nav). */

export type HuePreset = {
  label: string;
  hue: number;
  /** Swatch chroma override — the neutral preset renders desaturated. */
  chroma?: number;
};

// Hues + chroma tuned so each swatch approximates the spec's 9 accent-600
// tones (red #dc2626, orange #c2410c, amber #b45309, green #15803d,
// emerald #047857, teal #0e7490, blue #2563eb, purple #7c3aed, pink #be185d)
// converted to OKLCH while keeping 4.5:1 contrast with white text.
export const HUE_PRESETS: readonly HuePreset[] = [
  { label: "Rojo", hue: 25, chroma: 0.19 },
  { label: "Naranja", hue: 45, chroma: 0.16 },
  { label: "Ámbar", hue: 70, chroma: 0.14 },
  { label: "Verde", hue: 145, chroma: 0.14 },
  { label: "Esmeralda", hue: 165, chroma: 0.11 },
  { label: "Teal", hue: 200, chroma: 0.1 },
  { label: "Azul", hue: 255, chroma: 0.18 },
  { label: "Violeta", hue: 295, chroma: 0.18 },
  { label: "Rosa", hue: 350, chroma: 0.16 },
] as const;

export const DEFAULT_HUE_PRESET = HUE_PRESETS.find((preset) => preset.label === "Azul")!;

export function swatchColor(preset: HuePreset): string {
  const chroma = preset.chroma ?? 0.15;
  return `oklch(0.58 ${chroma} ${preset.hue})`;
}

/** True when `hue` matches a preset closely enough to show it selected. */
export function matchesHuePreset(hue: number, preset: HuePreset): boolean {
  return Math.abs(hue - preset.hue) < 6;
}
