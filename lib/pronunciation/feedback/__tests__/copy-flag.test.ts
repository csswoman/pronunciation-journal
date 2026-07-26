import { afterEach, describe, expect, it } from 'vitest'
import { isActionablePronunciationFeedbackCopyEnabled } from '../copy-flag'

describe('actionable pronunciation feedback copy flag', () => {
  afterEach(() => { delete process.env.NEXT_PUBLIC_PRONUNCIATION_ACTIONABLE_FEEDBACK_COPY })

  it('defaults to enabled', () => {
    expect(isActionablePronunciationFeedbackCopyEnabled()).toBe(true)
  })

  it('disables only for the string false', () => {
    process.env.NEXT_PUBLIC_PRONUNCIATION_ACTIONABLE_FEEDBACK_COPY = 'false'
    expect(isActionablePronunciationFeedbackCopyEnabled()).toBe(false)
  })
})
