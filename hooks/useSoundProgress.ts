'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { UserSoundProgressWithSound } from '@/lib/phoneme-practice/types'

interface UseSoundProgressResult {
  progressList: UserSoundProgressWithSound[]
  loading: boolean
}

export function useSoundProgress(userId: string | undefined): UseSoundProgressResult {
  const [progressList, setProgressList] = useState<UserSoundProgressWithSound[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const supabase = getSupabaseBrowserClient()
    supabase
      .from('user_sound_progress')
      .select('*, sounds(*)')
      .eq('user_id', userId)
      .order('sound_id', { ascending: true })
      .then(({ data }) => {
        setProgressList((data ?? []) as UserSoundProgressWithSound[])
        setLoading(false)
      })
  }, [userId])

  return { progressList, loading }
}
