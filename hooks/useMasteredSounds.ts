'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { UserSoundProgressWithSound } from '@/lib/phoneme-practice/types'

export interface MasteredSoundInfo extends UserSoundProgressWithSound {
  accuracy: number          // 0-100
  dueForReview: boolean
  nextReviewDate: Date | null
  intervalLabel: string     // "Mañana", "En 3 días", "En 1 semana", etc.
}

export interface UseMasteredSoundsResult {
  mastered: MasteredSoundInfo[]
  dueToday: MasteredSoundInfo[]
  loading: boolean
  error: string | null
}

function intervalLabel(nextReview: string | null): string {
  if (!nextReview) return 'Pendiente'
  const now = new Date()
  const next = new Date(nextReview)
  const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Hoy'
  if (diffDays === 1) return 'Mañana'
  if (diffDays < 7) return `En ${diffDays} días`
  if (diffDays < 14) return 'En 1 semana'
  if (diffDays < 31) return `En ${Math.ceil(diffDays / 7)} semanas`
  return 'En 1 mes+'
}

export function useMasteredSounds(userId: string | undefined): UseMasteredSoundsResult {
  const [mastered, setMastered] = useState<MasteredSoundInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const supabase = getSupabaseBrowserClient()
    supabase
      .from('user_sound_progress')
      .select('*, sounds(*)')
      .eq('user_id', userId)
      .eq('status', 'mastered')
      .order('last_practiced', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
          setLoading(false)
          return
        }

        const now = new Date()
        const enriched: MasteredSoundInfo[] = (data ?? []).map(p => {
          const total = p.total_attempts ?? 0
          const correct = p.correct_answers ?? 0
          const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
          const nextReviewDate = p.next_review ? new Date(p.next_review) : null
          const dueForReview = nextReviewDate ? nextReviewDate <= now : true
          return {
            ...(p as unknown as UserSoundProgressWithSound),
            accuracy,
            dueForReview,
            nextReviewDate,
            intervalLabel: intervalLabel(p.next_review),
          }
        })

        setMastered(enriched)
        setLoading(false)
      })
  }, [userId])

  const dueToday = mastered.filter(m => m.dueForReview)

  return { mastered, dueToday, loading, error }
}
