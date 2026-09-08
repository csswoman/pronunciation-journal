'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { FocusSetup } from '@/components/focus/FocusSetup'
import { getSuggestedGaps, getAvailableCurriculumGaps, type GapSuggestion } from '@/lib/focus/gap-suggestions'
import { getActiveSprint } from '@/lib/focus/queries'
import { isAnonymousUser } from '@/lib/api/rate-limit'
import type { SprintGap } from '@/lib/focus/types'

export default function FocusSetupPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [suggestedGaps, setSuggestedGaps] = useState<GapSuggestion[]>([])
  const [curriculumGaps, setCurriculumGaps] = useState<SprintGap[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Si no hay user aún (por ej. offline puro sin auth), usamos un identificador local 'guest-user'
  const effectiveUserId = user?.id ?? 'guest-local-user'
  const isAnon = !user || isAnonymousUser(user)

  useEffect(() => {
    if (loading) return

    async function loadData() {
      try {
        const active = await getActiveSprint(effectiveUserId)
        if (active && active.status === 'active') {
          router.replace(`/focus/${active.id}`)
          return
        }

        const [sugg, curr] = await Promise.all([
          getSuggestedGaps(effectiveUserId),
          Promise.resolve(getAvailableCurriculumGaps()),
        ])
        setSuggestedGaps(sugg)
        setCurriculumGaps(curr)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [effectiveUserId, loading, router])

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-body-sm text-[var(--text-tertiary)]">
          Preparando opciones de estudio...
        </div>
      </div>
    )
  }

  return (
    <FocusSetup
      userId={effectiveUserId}
      isAnonymous={isAnon}
      suggestedGaps={suggestedGaps}
      curriculumGaps={curriculumGaps}
    />
  )
}
