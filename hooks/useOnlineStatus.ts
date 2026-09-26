'use client'

import { useEffect, useState } from 'react'
// Canonical connectivity check of the app, shared with the grading client so a
// component and its requests never disagree about being online.
import { isOnline } from '@/lib/exercises/grade-production-client'

/**
 * Connectivity of the device, kept in sync with the browser events. Starts as
 * `true` so the first server render matches the client.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    function sync() {
      setOnline(isOnline())
    }
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  return online
}
