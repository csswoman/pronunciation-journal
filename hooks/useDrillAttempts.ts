'use client'

import { useCallback, useState } from 'react'
import type { CEFRLevel } from '@/lib/exercises/cefr'

export interface UseDrillAttemptsOptions {
  level?: CEFRLevel
  revealAfterAttempts?: number
}

export function useDrillAttempts(options?: UseDrillAttemptsOptions) {
  const maxAttempts =
    options?.revealAfterAttempts ??
    (options?.level === 'B1' || options?.level === 'B2' || options?.level === 'C1' ? 2 : 1)

  const [failedAttempts, setFailedAttempts] = useState(0)
  const [firstTryFailed, setFirstTryFailed] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)

  const recordFailure = useCallback(() => {
    setFirstTryFailed(true)
    const next = failedAttempts + 1
    setFailedAttempts(next)
    if (next >= maxAttempts) {
      setIsRevealed(true)
      return { canRetry: false, revealed: true }
    }
    return { canRetry: true, revealed: false }
  }, [failedAttempts, maxAttempts])

  const reset = useCallback(() => {
    setFailedAttempts(0)
    setFirstTryFailed(false)
    setIsRevealed(false)
  }, [])

  return {
    failedAttempts,
    firstTryFailed,
    isRevealed,
    canRetry: failedAttempts < maxAttempts && !isRevealed,
    recordFailure,
    reset,
  }
}
