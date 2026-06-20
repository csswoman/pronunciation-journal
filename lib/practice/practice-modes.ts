import type { SessionArc } from './types'

/** A practice mode the user can jump into from the hub. */
export interface PracticeMode {
  id: string
  label: string
  description: string
  href: string
  /** lucide-react icon name, resolved in the component layer. */
  icon: string
}

/** Single source of truth for the free-practice hub. */
export const PRACTICE_MODES: readonly PracticeMode[] = [
  {
    id: 'sounds',
    label: 'Sound Lab',
    description: 'Pronunciation and minimal pairs',
    href: '/practice/sounds',
    icon: 'MicVocal',
  },
  {
    id: 'core-1000',
    label: 'Essential Words',
    description: 'The 1000 most useful words',
    href: '/practice/core-1000',
    icon: 'ListOrdered',
  },
  {
    id: 'decks',
    label: 'Decks',
    description: 'Your vocabulary decks',
    href: '/practice/decks',
    icon: 'Layers',
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Words due for spaced repetition',
    href: '/practice/review',
    icon: 'RotateCcw',
  },
  {
    id: 'courses',
    label: 'Ruta',
    description: 'Continue a guided course',
    href: '/courses',
    icon: 'BookOpen',
  },
] as const

const FALLBACK_MODE_ID = 'core-1000'

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
    return {
      mode,
      reason: 'daily-sound',
      headline: `Keep going with /${input.arc.soundIpa}/`,
      subtext: "Reinforce the sound from today's daily.",
    }
  }

  if (input.fromDaily) {
    return {
      mode: fallback,
      reason: 'daily-words',
      headline: 'Keep building your core vocabulary',
      subtext: "Pick up where today's daily left off.",
    }
  }

  if (input.lastModeId) {
    const mode = modeById(input.lastModeId)
    if (mode) {
      return {
        mode,
        reason: 'last-mode',
        headline: `Continue ${mode.label}`,
        subtext: 'Pick up where you left off.',
      }
    }
  }

  return {
    mode: fallback,
    reason: 'fallback',
    headline: 'Start with the essentials',
    subtext: 'The 1000 most useful words.',
  }
}
