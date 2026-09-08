'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { checkAndExpireSprint } from '@/lib/focus/sprint-lifecycle'

export default function FocusRootPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [checking, setChecking] = useState(true)

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
      } finally {
        setChecking(false)
      }
    }

    checkSprint()
  }, [user, loading, router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-body-sm text-[var(--text-tertiary)]">
        {checking ? 'Cargando Modo Foco...' : ''}
      </div>
    </div>
  )
}
