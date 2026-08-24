/** Curated swatch presets for the theme-color pickers (sidebar + bottom nav). */

export type HuePreset = {
  label: string;
  hue: number;
  /** Swatch chroma override — the neutral preset renders desaturated. */
  chroma?: number;
};

export const HUE_PRESETS: readonly HuePreset[] = [
  { label: "Rojo", hue: 25 },
  { label: "Naranja", hue: 40 },
  { label: "Ámbar", hue: 70 },
  { label: "Verde", hue: 145 },
  { label: "Teal", hue: 175 },
  { label: "Cian", hue: 200 },
  { label: "Azul", hue: 250 },
  { label: "Violeta", hue: 290 },
  { label: "Rosa", hue: 340 },
] as const;

export const DEFAULT_HUE_PRESET = HUE_PRESETS.find((preset) => preset.label === "Teal")!;

export function swatchColor(preset: HuePreset): string {
  const chroma = preset.chroma ?? 0.15;
  return `oklch(0.65 ${chroma} ${preset.hue})`;
}

/** True when `hue` matches a preset closely enough to show it selected. */
export function matchesHuePreset(hue: number, preset: HuePreset): boolean {
  return Math.abs(hue - preset.hue) < 6;
}
