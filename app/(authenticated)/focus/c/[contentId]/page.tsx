'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { FocusContentViewer } from '@/components/focus/FocusContentViewer'
import { getFocusContentById, getSprintById } from '@/lib/focus/queries'
import type { FocusContent } from '@/lib/focus/types'
import { focusContentId } from '@/lib/focus/content-url'

export default function FocusContentPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = use(params)
  const router = useRouter()
  const { user, loading } = useAuth()
  const [content, setContent] = useState<FocusContent | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (loading) return
    let alive = true
    const userId = user?.id ?? 'guest-local-user'

    async function load() {
      try {
        const row = await getFocusContentById(focusContentId(contentId))
        if (!row) throw new Error('missing content')
        const sprint = await getSprintById(row.sprintId)
        if (!sprint || sprint.userId !== userId || (row.userId && row.userId !== userId)) {
          router.replace('/focus')
          return
        }
        if (alive) setContent(row)
      } catch {
        if (alive) setError(true)
      }
    }
    void load()
    return () => { alive = false }
  }, [contentId, loading, router, user?.id])

  if (error) return <p role="alert" className="page-shell page-shell--session text-body text-error">No se pudo abrir este contenido. Vuelve a tu semana de foco e inténtalo de nuevo.</p>
  if (loading || !content) return <p className="page-shell page-shell--session text-body-sm text-fg-muted">Cargando práctica…</p>
  return <FocusContentViewer content={content} sprintId={content.sprintId} />
}
