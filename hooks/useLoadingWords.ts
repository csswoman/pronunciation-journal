'use client'

import { useState, useEffect } from 'react'
import { getReadyWordSummaries } from '@/lib/word-bank/queries'

export type LoadingWord = { text: string; ipa: string | null }

export const FALLBACK_WORDS: LoadingWord[] = [
  { text: 'thought',       ipa: '/θɔːt/' },
  { text: 'through',       ipa: '/θruː/' },
  { text: 'though',        ipa: '/ðoʊ/' },
  { text: 'world',         ipa: '/wɜːrld/' },
  { text: 'clothes',       ipa: '/kloʊðz/' },
  { text: 'comfortable',   ipa: '/ˈkʌmftərbəl/' },
  { text: 'rhythm',        ipa: '/ˈrɪðəm/' },
  { text: 'pronunciation', ipa: '/prəˌnʌnsiˈeɪʃən/' },
  { text: 'thoroughly',    ipa: '/ˈθɜːrəli/' },
  { text: 'particularly',  ipa: '/pərˈtɪkjʊlərli/' },
]

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

    getReadyWordSummaries()
      .then(entries => {
        if (cancelled) return
        if (entries.length === 0) return // keep fallback
        const picked = shuffle([...entries])
          .slice(0, 10)
          .map(e => ({ text: e.text, ipa: e.ipa ?? null }))
        setWords(picked)
      })
      .catch((err) => {
        console.warn('[useLoadingWords] fetch failed, using fallback', err)
      })

    return () => { cancelled = true }
  }, [])

  return words
}
