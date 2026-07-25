import { afterEach, describe, expect, it } from 'vitest'
import { isPronunciationPathCopyEnabled } from '../copy-flag'

describe('isPronunciationPathCopyEnabled', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_PRONUNCIATION_PATH_COPY
  })

  it('defaults to enabled', () => {
    delete process.env.NEXT_PUBLIC_PRONUNCIATION_PATH_COPY
    expect(isPronunciationPathCopyEnabled()).toBe(true)
  })

  it('disables when env is the string false', () => {
    process.env.NEXT_PUBLIC_PRONUNCIATION_PATH_COPY = 'false'
    expect(isPronunciationPathCopyEnabled()).toBe(false)
  })
})
