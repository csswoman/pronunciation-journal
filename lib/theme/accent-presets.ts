/**
 * 9 Accent presets (tonos vivos) for the English Journal Design System.
 * Cada uno pasa >= 4.5:1 con su texto (blanco o ink según onInk).
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
  /** true = texto/iconos sobre el acento van en ink; false = blanco (espeja --on-accent en tokens.css) */
  onInk: boolean
}

export const ACCENT_PRESETS: readonly AccentPreset[] = [
  { id: 'red', label: 'Rojo', hex: '#e11d48', onInk: false },
  { id: 'orange', label: 'Naranja', hex: '#f97316', onInk: true },
  { id: 'amber', label: 'Ámbar', hex: '#f59e0b', onInk: true },
  { id: 'green', label: 'Verde', hex: '#22c55e', onInk: true },
  { id: 'emerald', label: 'Esmeralda', hex: '#10b981', onInk: true },
  { id: 'teal', label: 'Turquesa', hex: '#06b6d4', onInk: true },
  { id: 'blue', label: 'Azul', hex: '#2f6bf0', onInk: false },
  { id: 'purple', label: 'Violeta', hex: '#7c4dff', onInk: false },
  { id: 'pink', label: 'Rosa', hex: '#db2777', onInk: false },
] as const

export const DEFAULT_ACCENT_ID: AccentId = 'blue'

export function isValidAccent(value: string | null | undefined): value is AccentId {
  if (!value) return false
  return ACCENT_PRESETS.some((preset) => preset.id === value)
}
