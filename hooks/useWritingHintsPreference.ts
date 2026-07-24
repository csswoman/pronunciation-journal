'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'journal:writing-hints-enabled'

export interface UseWritingHintsPreference {
  enabled: boolean
  setEnabled: (next: boolean) => void
}

/** Persists the "show hints while writing" toggle in localStorage (UI preference only). */
export function useWritingHintsPreference(): UseWritingHintsPreference {
  const [enabled, setEnabledState] = useState(true)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored !== null) setEnabledState(stored !== 'false')
  }, [])

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next)
    window.localStorage.setItem(STORAGE_KEY, String(next))
  }, [])

  return { enabled, setEnabled }
}
