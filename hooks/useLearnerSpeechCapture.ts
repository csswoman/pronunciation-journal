'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSpeechInput } from '@/hooks/useSpeechInput'

export type LearnerSpeechErrorCode = 'network' | 'not-allowed' | 'no-speech' | 'unknown' | null

/**
 * Estado de la GRABACIÓN real (MediaRecorder + micrófono), independiente del
 * estado del reconocedor de voz. La UI debe atarse a esto para "Grabando…",
 * porque el reconocedor se declara "listening" antes de que el micro arranque.
 */
export type LearnerCaptureState = 'inactive' | 'starting' | 'recording' | 'stopped' | 'error'

export interface UseLearnerSpeechCaptureOptions {
  targetText: string
  getStream: () => Promise<MediaStream>
}

export interface LearnerCapture {
  status: 'idle' | 'listening' | 'processing' | 'done' | 'error' | 'unsupported'
  captureState: LearnerCaptureState
  isCapturing: boolean
  hasRecording: boolean
  transcript: string | null
  userAudioUrl: string | null
  micStream: MediaStream | null
  errorCode: LearnerSpeechErrorCode
  canScore: boolean
  start: () => Promise<void>
  stop: () => void
  reset: () => void
}

function normalizeErrorCode(error: string | null): LearnerSpeechErrorCode {
  if (!error) return null
  if (error === 'not-allowed' || error === 'no-speech' || error === 'network') {
    return error
  }
  return 'unknown'
}

/** getUserMedia rechaza con DOMException; mapeamos a nuestros códigos. */
function normalizeStreamError(err: unknown): LearnerSpeechErrorCode {
  const name = (err as { name?: string } | null)?.name
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'not-allowed'
  const message = err instanceof Error ? err.message : ''
  if (message === 'not-allowed') return 'not-allowed'
  return 'unknown'
}

/**
 * Orquestador de captura de voz para el turno del estudiante en misiones guiadas.
 * Conecta STT resiliente (Web Speech + Gemini fallback) vía useSpeechInput,
 * grabación paralela para auto-escucha y exposición del stream para el osciloscopio.
 *
 * Invariante: `captureState` y `hasRecording` describen el micrófono real. Nunca se
 * derivan del reconocedor, para que la UI no muestre "grabando" ni puntúe un
 * intento cuando el micro no llegó a capturar audio.
 */
export function useLearnerSpeechCapture({
  getStream,
}: UseLearnerSpeechCaptureOptions): LearnerCapture {
  const [micStream, setMicStream] = useState<MediaStream | null>(null)
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null)
  const [networkFailed, setNetworkFailed] = useState(false)
  const [captureState, setCaptureState] = useState<LearnerCaptureState>('inactive')
  const [hasRecording, setHasRecording] = useState(false)
  const [captureErrorCode, setCaptureErrorCode] = useState<LearnerSpeechErrorCode>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioUrlRef = useRef<string | null>(null)

  const speechInput = useSpeechInput({
    prefer: 'auto',
    getStream,
  })

  // Un fallo del micrófono manda sobre cualquier estado del reconocedor.
  const errorCode = captureErrorCode ?? normalizeErrorCode(speechInput.error)

  const canScore =
    captureErrorCode === null &&
    captureState !== 'error' &&
    speechInput.isSupported &&
    speechInput.state !== 'unsupported' &&
    !networkFailed &&
    !(speechInput.state === 'error' && errorCode === 'network' && !speechInput.result?.transcript)

  const cleanupAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    setUserAudioUrl(null)
    setHasRecording(false)
  }, [])

  const start = useCallback(async () => {
    cleanupAudioUrl()
    audioChunksRef.current = []
    setCaptureErrorCode(null)
    setCaptureState('starting')

    let stream: MediaStream
    try {
      stream = await getStream()
    } catch (err) {
      // No silenciar: sin micro no hay grabación ni evaluación posible.
      setMicStream(null)
      setCaptureState('error')
      setCaptureErrorCode(normalizeStreamError(err))
      return
    }

    setMicStream(stream)

    if (typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined') {
      try {
        const recorder = new MediaRecorder(stream)
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }
        recorder.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const blob = new Blob(audioChunksRef.current, {
              type: recorder.mimeType || 'audio/webm',
            })
            const url = URL.createObjectURL(blob)
            audioUrlRef.current = url
            setUserAudioUrl(url)
            setHasRecording(true)
          }
          setCaptureState((prev) => (prev === 'error' ? prev : 'stopped'))
        }
        recorder.onerror = () => {
          setCaptureState('error')
          setCaptureErrorCode('unknown')
        }
        mediaRecorderRef.current = recorder
        // timeslice: emite chunks periódicamente, así una parada anómala
        // (desmontaje, corte del track) conserva el audio ya capturado.
        recorder.start(250)
        setCaptureState('recording')
      } catch {
        setCaptureState('error')
        setCaptureErrorCode('unknown')
        return
      }
    } else {
      // Sin MediaRecorder no hay auto-escucha, pero el STT puede seguir.
      setCaptureState('recording')
    }

    await speechInput.start()
  }, [getStream, speechInput, cleanupAudioUrl])

  const stop = useCallback(() => {
    // Detener el recorder ANTES de soltar el stream: si el analizador cierra
    // primero, el ciclo onstop puede perder el último chunk.
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        // Ignorar fallo al detener recorder
      }
    }

    setMicStream(null)
    setCaptureState((prev) => (prev === 'recording' || prev === 'starting' ? 'stopped' : prev))

    void speechInput.stop()
  }, [speechInput])

  const reset = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        // Ignorar fallo
      }
    }
    setMicStream(null)
    setNetworkFailed(false)
    setCaptureErrorCode(null)
    setCaptureState('inactive')
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    cleanupAudioUrl()
    speechInput.reset()
  }, [cleanupAudioUrl, speechInput])

  useEffect(() => {
    if (speechInput.state === 'error' && errorCode === 'network') {
      setNetworkFailed(true)
    }
  }, [speechInput.state, errorCode])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop()
        } catch {
          // Ignorar fallo al desmontar
        }
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  return {
    status: captureState === 'error' ? 'error' : speechInput.state,
    captureState,
    isCapturing: captureState === 'recording',
    hasRecording,
    transcript: speechInput.result?.transcript ?? null,
    userAudioUrl,
    micStream,
    errorCode,
    canScore,
    start,
    stop,
    reset,
  }
}
