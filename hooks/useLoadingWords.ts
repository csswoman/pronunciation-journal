'use client'

import { useState, useEffect } from 'react'
import { getMyWords } from '@/lib/word-bank/queries'

export type LoadingWord = { text: string; ipa: string | null }

const FALLBACK_WORDS: LoadingWord[] = [
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
  const [words, setWords] = useState<LoadingWord[]>(shuffle([...FALLBACK_WORDS]))

  useEffect(() => {
    let cancelled = false

    getMyWords()
      .then(entries => {
        if (cancelled) return
        const ready = entries.filter(e => e.status === 'ready')
        if (ready.length === 0) return // keep fallback
        const picked = shuffle([...ready])
          .slice(0, 10)
          .map(e => ({ text: e.text, ipa: e.ipa ?? null }))
        setWords(picked)
      })
      .catch(() => {
        // network error → keep fallback already set
      })

    return () => { cancelled = true }
  }, [])

  return words
}
