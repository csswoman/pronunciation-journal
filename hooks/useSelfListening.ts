// hooks/useSelfListening.ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { startSelfListeningRecorder } from '@/lib/speech/self-listening-recorder'

export interface SelfListening {
  /** Blob URL de la última grabación audible, o null. Vive solo en memoria. */
  audioUrl: string | null
  /** Graba sobre un stream ya abierto. No hace nada si ya está grabando. */
  begin: (stream: MediaStream) => void
  /** Cierra la grabación; el audio queda en `audioUrl` si tuvo señal audible. */
  end: () => void
  /** Descarta la grabación y libera la URL. */
  clear: () => void
}

/**
 * Auto-escucha para superficies que usan `useSpeechInput` (que no expone audio).
 *
 * La grabación nunca se persiste ni se envía a ningún servicio: se crea un blob
 * URL en memoria y se revoca al descartar o al desmontar.
 */
export function useSelfListening(): SelfListening {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const urlRef = useRef<string | null>(null)
  // `stop()` entrega el audio de forma asíncrona: sin esta marca, un clear()
  // seguido del onstop tardío resucitaría la grabación ya descartada.
  const discardRef = useRef(false)

  const revoke = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [])

  const begin = useCallback(
    (stream: MediaStream) => {
      if (recorderRef.current) return
      discardRef.current = false
      recorderRef.current = startSelfListeningRecorder(stream, {
        onAudioUrl: (url) => {
          if (discardRef.current) {
            URL.revokeObjectURL(url)
            return
          }
          revoke()
          urlRef.current = url
          setAudioUrl(url)
        },
        onStopped: () => {
          recorderRef.current = null
        },
      })
    },
    [revoke],
  )

  const end = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder) return
    if (recorder.state !== 'inactive') recorder.stop()
    else recorderRef.current = null
  }, [])

  const clear = useCallback(() => {
    discardRef.current = true
    end()
    revoke()
    setAudioUrl(null)
  }, [end, revoke])

  useEffect(
    () => () => {
      recorderRef.current = null
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    [],
  )

  return { audioUrl, begin, end, clear }
}
