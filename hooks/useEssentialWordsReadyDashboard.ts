'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  loadEssentialWordsReadyDashboard,
  type EssentialWordsReadyDashboard,
} from '@/lib/essential-words/ready-dashboard'

export function useEssentialWordsReadyDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<EssentialWordsReadyDashboard | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!user?.id) {
      setDashboard(null)
      return
    }
    void loadEssentialWordsReadyDashboard(user.id)
      .then((next) => {
        if (!cancelled) setDashboard(next)
      })
      .catch(() => {
        if (!cancelled) setDashboard(null)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  return dashboard
}
