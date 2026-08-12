import type { EffectiveFocus, LearningFocus } from './types'

export function getEffectiveFocus(focus: LearningFocus): EffectiveFocus {
  if (focus.pinned) {
    return {
      level: focus.level,
      thread: focus.thread,
      pinned: true,
      source: focus.source,
    }
  }
  return {
    level: focus.suggested.level,
    thread: focus.suggested.thread,
    pinned: false,
    source: focus.suggested.source,
  }
}
