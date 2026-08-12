import { toFocusLevel } from './cefr'
import type { FocusLevel, FocusSource, FocusThread } from './types'

export type DeriveSuggestedFocusInput = {
  profileLevel: string | null
  routeLevel: string | null
  recentTheoryLessonSlug: string | null
  weakSoundKey: string | null
}

export type SuggestedFocus = {
  level: FocusLevel
  thread: FocusThread | null
  source: FocusSource
}

export function deriveSuggestedFocus(input: DeriveSuggestedFocusInput): SuggestedFocus {
  const profile = toFocusLevel(input.profileLevel)
  if (profile) {
    return { level: profile, thread: null, source: 'profile' }
  }

  const route = toFocusLevel(input.routeLevel)
  if (route) {
    const thread: FocusThread | null = input.recentTheoryLessonSlug
      ? { kind: 'theory', topicId: input.recentTheoryLessonSlug }
      : null
    return {
      level: route,
      thread,
      source: 'route',
    }
  }

  if (input.recentTheoryLessonSlug) {
    return {
      level: 'a1',
      thread: { kind: 'theory', topicId: input.recentTheoryLessonSlug },
      source: 'recent_practice',
    }
  }

  if (input.weakSoundKey) {
    return {
      level: 'a1',
      thread: { kind: 'sound', key: input.weakSoundKey },
      source: 'sound_weak',
    }
  }

  return { level: 'a1', thread: null, source: 'profile' }
}
