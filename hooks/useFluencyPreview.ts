'use client'

import { useEffect, useState } from 'react'
import type { FluencyScores } from '@/lib/progress/fluency-scores'

interface FluencyPreview {
  scores: FluencyScores | null
  comparisonLabel?: string
}

/**
 * Radar de 6 dimensiones para /focus/setup, reutilizando el mismo endpoint
 * que alimenta /progress. Nunca bloquea el setup: si falla o el usuario es
 * anónimo (sin fila en Supabase), simplemente no hay radar que mostrar.
 */
export function useFluencyPreview(enabled: boolean) {
  const [preview, setPreview] = useState<FluencyPreview | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetch('/api/progress/fluency-scores')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: FluencyPreview | null) => {
        if (!cancelled) setPreview(data)
      })
      .catch(() => {
        if (!cancelled) setPreview(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return { preview, isLoading }
}
