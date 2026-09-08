'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { FocusStoryViewer } from '@/components/focus/FocusStoryViewer'
import { getFocusContentById } from '@/lib/focus/queries'
import type { FocusContent } from '@/lib/focus/types'

interface FocusStoryPageProps {
  params: Promise<{ sprintId: string; contentId: string }>
}

export default function FocusStoryPage({ params }: FocusStoryPageProps) {
  const { sprintId, contentId } = use(params)
  const router = useRouter()
  const { loading } = useAuth()
  const [content, setContent] = useState<FocusContent | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (loading) return

    async function loadContent() {
      try {
        const row = await getFocusContentById(contentId)
        if (!row || row.kind !== 'story') {
          router.replace(`/focus/${sprintId}`)
          return
        }
        setContent(row)
      } finally {
        setLoadingData(false)
      }
    }

    loadContent()
  }, [loading, sprintId, contentId, router])

  if (loading || loadingData || !content) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-body-sm text-[var(--text-tertiary)]">
          Cargando historia...
        </div>
      </div>
    )
  }

  return <FocusStoryViewer content={content} sprintId={sprintId} />
}
