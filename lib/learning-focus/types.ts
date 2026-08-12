export type FocusLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1'

export type FocusThread =
  | { kind: 'theory'; topicId: string }
  | { kind: 'sound'; key: string }

export type FocusSource =
  | 'assessment'
  | 'manual'
  | 'route'
  | 'recent_practice'
  | 'sound_weak'
  | 'profile'

export type LearningFocus = {
  level: FocusLevel
  thread: FocusThread | null
  pinned: boolean
  suggested: {
    level: FocusLevel
    thread: FocusThread | null
    source: FocusSource
  }
  source: FocusSource
  updatedAt: string
}

export type EffectiveFocus = {
  level: FocusLevel
  thread: FocusThread | null
  pinned: boolean
  source: FocusSource
}
