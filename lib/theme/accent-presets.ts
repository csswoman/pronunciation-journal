/**
 * 9 Accent presets (tone 600) for the English Journal Design System.
 * All pass >= 4.5:1 contrast ratio with white text on dark/light surfaces.
 */

export type AccentId =
  | 'red'
  | 'orange'
  | 'amber'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'pink'

export interface AccentPreset {
  id: AccentId
  label: string
  hex: string
}

export const ACCENT_PRESETS: readonly AccentPreset[] = [
  { id: 'red', label: 'Rojo', hex: '#dc2626' },
  { id: 'orange', label: 'Naranja', hex: '#c2410c' },
  { id: 'amber', label: 'Ámbar', hex: '#b45309' },
  { id: 'green', label: 'Verde', hex: '#15803d' },
  { id: 'emerald', label: 'Esmeralda', hex: '#047857' },
  { id: 'teal', label: 'Teal', hex: '#0e7490' },
  { id: 'blue', label: 'Azul', hex: '#2563eb' },
  { id: 'purple', label: 'Púrpura', hex: '#7c3aed' },
  { id: 'pink', label: 'Rosa', hex: '#be185d' },
] as const

export const DEFAULT_ACCENT_ID: AccentId = 'blue'

export function isValidAccent(value: string | null | undefined): value is AccentId {
  if (!value) return false
  return ACCENT_PRESETS.some((preset) => preset.id === value)
}
