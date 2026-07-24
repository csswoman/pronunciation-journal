'use client'

import { useEffect, useState } from 'react'
import { detectWritingHints } from '@/lib/journal/writing-hints/detect-hints'
import type { WritingHintMatch } from '@/lib/journal/writing-hints/types'

const DEBOUNCE_MS = 400

/** Debounced local rule-detection over journal content. No network, no AI. */
export function useWritingHints(content: string, enabled: boolean): WritingHintMatch[] {
  const [matches, setMatches] = useState<WritingHintMatch[]>([])

  useEffect(() => {
    if (!enabled) {
      setMatches([])
      return
    }
    const timer = setTimeout(() => {
      setMatches(detectWritingHints(content))
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [content, enabled])

  return matches
}
