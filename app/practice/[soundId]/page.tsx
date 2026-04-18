'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function LegacySoundRedirect() {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/practice/sound/${params.soundId}`)
  }, [params.soundId, router])

  return null
}
