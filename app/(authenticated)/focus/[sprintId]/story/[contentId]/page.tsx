'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { focusContentHref } from '@/lib/focus/content-url'

interface FocusStoryPageProps {
  params: Promise<{ sprintId: string; contentId: string }>
}

export default function FocusStoryPage({ params }: FocusStoryPageProps) {
  const { contentId } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(focusContentHref(contentId))
  }, [contentId, router])

  return <p className="page-shell page-shell--session text-body-sm text-fg-muted">Abriendo práctica…</p>
}
