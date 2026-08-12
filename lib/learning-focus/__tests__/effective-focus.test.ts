import { describe, it, expect } from 'vitest'
import { getEffectiveFocus } from '../effective-focus'
import type { LearningFocus } from '../types'

const base: LearningFocus = {
  level: 'b1',
  thread: { kind: 'theory', topicId: 'present-simple' },
  pinned: false,
  suggested: {
    level: 'a2',
    thread: { kind: 'sound', key: 'ɪ' },
    source: 'assessment',
  },
  source: 'manual',
  updatedAt: '2026-08-12T12:00:00.000Z',
}

describe('getEffectiveFocus', () => {
  it('uses suggested when unpinned', () => {
    expect(getEffectiveFocus(base)).toEqual({
      level: 'a2',
      thread: { kind: 'sound', key: 'ɪ' },
      pinned: false,
      source: 'assessment',
    })
  })

  it('uses override level/thread when pinned', () => {
    expect(getEffectiveFocus({ ...base, pinned: true })).toEqual({
      level: 'b1',
      thread: { kind: 'theory', topicId: 'present-simple' },
      pinned: true,
      source: 'manual',
    })
  })
})
