'use client'

import { useEffect, useState } from 'react'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'
import { fetchMissionLineAudio } from '@/lib/ai-practice/missions/scripted/audio-queries'
import { updateGeneratedScriptLineAudio } from '@/lib/ai-practice/missions/scripted/generated-store'

interface UseMissionLineAudioReturn {
  hdAudioUrl: string | undefined
}

/**
 * Hook para resolver y cachear el audio HD de una línea de misión guiada.
 * Reutiliza el audio pregrabado si existe, o lo solicita a través de la API
 * si el usuario se encuentra conectado a la red.
 */
export function useMissionLineAudio(
  line: ScriptLine,
  missionId?: string,
): UseMissionLineAudioReturn {
  const [hdAudioUrl, setHdAudioUrl] = useState<string | undefined>(line.modelAudio?.path)

  useEffect(() => {
    if (line.modelAudio?.path) {
      setHdAudioUrl(line.modelAudio.path)
      return
    }

    if (!missionId || typeof navigator === 'undefined' || !navigator.onLine) {
      setHdAudioUrl(undefined)
      return
    }

    let active = true

    void fetchMissionLineAudio(line, missionId)
      .then((url) => {
        if (!active || !url) return
        setHdAudioUrl(url)
        if (missionId.startsWith('generated.')) {
          void updateGeneratedScriptLineAudio(missionId, line.id, url)
        }
      })
      .catch(() => {
        // En caso de fallo de red o servidor, se degradará al sintetizador nativo
      })

    return () => {
      active = false
    }
  }, [line, missionId])

  return { hdAudioUrl }
}
