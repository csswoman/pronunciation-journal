'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
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

    const supabase = getSupabaseBrowserClient()
    supabase
      .from('user_contrast_progress')
      .select('*')
      .eq('user_id', userId)
      .order('contrast_id', { ascending: true })
      .then(({ data }) => {
        setProgressList((data ?? []) as UserContrastProgress[])
        setLoading(false)
      })
  }, [userId])

  return { progressList, loading }
}
