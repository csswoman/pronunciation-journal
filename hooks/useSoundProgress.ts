'use client'

import { useEffect, useState } from 'react'
import { getUserContrastProgress } from '@/lib/sounds/queries'
import type { UserContrastProgress } from '@/lib/phoneme-practice/types'

interface UseSoundProgressResult {
  /** All contrast progress rows for the user. */
  progressList: UserContrastProgress[]
  loading: boolean
}

export function useSoundProgress(userId: string | undefined): UseSoundProgressResult {
  const [progressList, setProgressList] = useState<UserContrastProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let cancelled = false

    getUserContrastProgress(userId)
      .then((data) => {
        if (cancelled) return
        setProgressList(data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setProgressList([])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  return { progressList, loading }
}
