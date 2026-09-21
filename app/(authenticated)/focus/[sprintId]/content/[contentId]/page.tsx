'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { focusContentSlug } from '@/lib/focus/content-url'

interface FocusContentPageProps {
  params: Promise<{ sprintId: string; contentId: string }>
}

export default function FocusContentPage({ params }: FocusContentPageProps) {
  const { contentId } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/focus/c/${focusContentSlug(contentId)}`)
  }, [contentId, router])

  return <p className="page-shell page-shell--session text-body-sm text-fg-muted">Abriendo práctica…</p>
}
