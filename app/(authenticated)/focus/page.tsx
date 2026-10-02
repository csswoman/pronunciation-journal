// Planned structure:
// <FocusRootPage>
//   <WordCarousel />
// </FocusRootPage>

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { checkAndExpireSprint } from '@/lib/focus/sprint-lifecycle'
import { WordCarousel } from '@/components/practice/session/WordCarousel'
import { useLoadingWords } from '@/hooks/useLoadingWords'

export default function FocusRootPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const words = useLoadingWords()

  useEffect(() => {
    if (loading) return

    const effectiveUserId = user?.id ?? 'guest-local-user'

    async function checkSprint() {
      try {
        const sprint = await checkAndExpireSprint(effectiveUserId)
        if (sprint && sprint.status === 'active') {
          router.replace(`/focus/${sprint.id}`)
        } else {
          router.replace('/focus/setup')
        }
      } catch {
        router.replace('/focus/setup')
      }
    }

    checkSprint()
  }, [user, loading, router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <WordCarousel words={words} />
    </div>
  )
}

