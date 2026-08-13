'use client'

import { useState, useEffect } from 'react'
import { FALLBACK_WORDS, type LoadingWord } from '@/hooks/loading-words-data'

export type { LoadingWord }
export { FALLBACK_WORDS }

// Fisher-Yates in-place shuffle — returns the same array
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function useLoadingWords(): LoadingWord[] {
  const [words, setWords] = useState<LoadingWord[]>([...FALLBACK_WORDS])

  useEffect(() => {
    let cancelled = false

    setWords(shuffle([...FALLBACK_WORDS]))

    // Dynamic import keeps word-bank out of auth/loading first paint chunks.
    void import('@/lib/word-bank/queries')
      .then(({ getReadyWordSummaries }) => getReadyWordSummaries())
      .then((entries) => {
        if (cancelled) return
        if (entries.length === 0) return // keep fallback
        const picked = shuffle([...entries])
          .slice(0, 10)
          .map((e) => ({ text: e.text, ipa: e.ipa ?? null }))
        setWords(picked)
      })
      .catch((err) => {
        console.warn('[useLoadingWords] fetch failed, using fallback', err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return words
}
