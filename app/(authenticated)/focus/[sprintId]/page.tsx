'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { FocusHome } from '@/components/focus/FocusHome'
import { listSprintContent } from '@/lib/focus/queries'
import { checkAndExpireSprint } from '@/lib/focus/sprint-lifecycle'
import { isAnonymousUser } from '@/lib/api/rate-limit'
import type { FocusSprint, FocusContent } from '@/lib/focus/types'
import { WordCarousel } from '@/components/practice/session/WordCarousel'
import { useLoadingWords } from '@/hooks/useLoadingWords'

interface FocusSprintPageProps {
  params: Promise<{ sprintId: string }>
}

export default function FocusSprintPage({ params }: FocusSprintPageProps) {
  const { sprintId } = use(params)
  const router = useRouter()
  const { user, loading } = useAuth()
  const [sprint, setSprint] = useState<FocusSprint | null>(null)
  const [contentList, setContentList] = useState<FocusContent[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const words = useLoadingWords()

  const effectiveUserId = user?.id ?? 'guest-local-user'
  const isAnon = !user || isAnonymousUser(user)

  useEffect(() => {
    if (loading) return

    async function loadSprint() {
      try {
        const active = await checkAndExpireSprint(effectiveUserId)
        if (!active || active.id !== sprintId || active.status !== 'active') {
          router.replace('/focus/setup')
          return
        }

        const contents = await listSprintContent(sprintId)
        setSprint(active)
        setContentList(contents)
      } finally {
        setLoadingData(false)
      }
    }

    loadSprint()
  }, [effectiveUserId, loading, sprintId, router])

  if (loading || loadingData || !sprint) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <WordCarousel words={words} />
      </div>
    )
  }

  return (
    <FocusHome
      sprint={sprint}
      initialContent={contentList}
      userId={effectiveUserId}
      isAnonymous={isAnon}
    />
  )
}
