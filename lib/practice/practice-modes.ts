import type { SessionArc } from './types'

/** A practice mode the user can jump into from the hub. */
export interface PracticeMode {
  id: string
  label: string
  description: string
  href: string
  /** Icon name (Tabler via @/components/icons), resolved in the component layer. */
  icon: string
}

/** Single source of truth for the free-practice hub. */
export const PRACTICE_MODES: readonly PracticeMode[] = [
  {
    id: 'sounds',
    label: 'Laboratorio de sonidos',
    description: 'Pronunciación y pares mínimos',
    href: '/practice/sounds',
    icon: 'MicVocal',
  },
  {
    id: 'essential-words',
    label: 'Palabras esenciales',
    description: 'Más de 2500 palabras frecuentes, con repaso espaciado',
    href: '/practice/essential-words',
    icon: 'ListOrdered',
  },
  {
    id: 'decks',
    label: 'Mazos',
    description: 'Tus mazos de vocabulario',
    href: '/practice/decks',
    icon: 'Layers',
  },
  {
    id: 'review',
    label: 'Repaso',
    description: 'Palabras pendientes de repaso espaciado',
    href: '/practice/review',
    icon: 'RotateCcw',
  },
  {
    id: 'reader',
    label: 'Lectura',
    description: 'Practica tus palabras recientes en contexto',
    href: '/practice/reader',
    icon: 'BookOpen',
  },
  {
    id: 'courses',
    label: 'Ruta',
    description: 'Continúa un curso guiado',
    href: '/courses',
    icon: 'BookOpen',
  },
] as const

const FALLBACK_MODE_ID = 'essential-words'

export type RecommendationReason =
  | 'daily-sound'
  | 'daily-words'
  | 'last-mode'
  | 'fallback'

export interface RecommendedResult {
  mode: PracticeMode
  reason: RecommendationReason
  /** Card heading, e.g. "Keep going with /æ/". */
  headline: string
  /** Supporting line under the heading. */
  subtext: string
}

/** Minimal arc shape the resolver needs (subset of SessionArc). */
type ArcLike = Pick<SessionArc, 'soundIpa' | 'topicLabel' | 'sessionWords'>

export interface ResolveInput {
  fromDaily: boolean
  arc: ArcLike | undefined
  lastModeId: string | null
}

function modeById(id: string): PracticeMode | undefined {
  return PRACTICE_MODES.find((m) => m.id === id)
}

/**
 * Pick the highlighted card for the hub. Priority:
 * 1. from daily + arc has a sound → Sound Lab
 * 2. from daily (no sound) → Essential Words
 * 3. last practiced mode is known → continue it
 * 4. fallback → Essential Words
 */
export function resolveRecommendedMode(input: ResolveInput): RecommendedResult {
  const fallback = modeById(FALLBACK_MODE_ID)!

  if (input.fromDaily && input.arc?.soundIpa) {
    const mode = modeById('sounds')!
    const ipa = input.arc.soundIpa.replace(/^\/+|\/+$/g, '')
    return {
      mode,
      reason: 'daily-sound',
      headline: `Sigue con /${ipa}/`,
      subtext: 'Refuerza el sonido del plan de hoy.',
    }
  }

  if (input.fromDaily) {
    return {
      mode: fallback,
      reason: 'daily-words',
      headline: 'Sigue con tu vocabulario esencial',
      subtext: 'Retoma desde el plan de hoy.',
    }
  }

  if (input.lastModeId) {
    const mode = modeById(input.lastModeId)
    if (mode) {
      return {
        mode,
        reason: 'last-mode',
        headline: `Continúa con ${mode.label}`,
        subtext: 'Retoma donde lo dejaste.',
      }
    }
  }

  return {
    mode: fallback,
    reason: 'fallback',
    headline: 'Empieza por lo esencial',
    subtext: 'Más de 2500 palabras de alta frecuencia.',
  }
}
