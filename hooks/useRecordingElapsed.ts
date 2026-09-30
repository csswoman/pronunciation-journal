'use client'

import { useEffect, useState } from 'react'

/**
 * Reloj visible de grabación. El pulso CSS por sí solo no distingue "grabando"
 * de "congelado": el contador es la prueba de que el micro sigue capturando.
 * Devuelve `m:ss` mientras se graba y `null` el resto del tiempo.
 */
export function useRecordingElapsed(isListening: boolean): string | null {
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    setElapsedMs(0)
    if (!isListening) return
    const startedAt = Date.now()
    const id = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 200)
    return () => window.clearInterval(id)
  }, [isListening])

  if (!isListening) return null
  const minutes = Math.floor(elapsedMs / 60_000)
  const seconds = String(Math.floor(elapsedMs / 1000) % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}
