'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GeminiAdapter } from '@/lib/speech/adapters/geminiAdapter'
import { isWebSpeechReliable } from '@/lib/speech/adapters/webSpeechAdapter'
import { hasAudibleAudio } from '@/lib/speech/audio-thresholds'

export type SpeechStatus = 'idle' | 'listening' | 'processing' | 'done' | 'error' | 'unsupported'
export type SpeechErrorCode = 'network' | 'not-allowed' | 'no-speech' | 'unknown'

export interface SpeechResult {
  transcript: string
  confidence: number
}

interface SpeechRecognitionResultLike {
  transcript: string
  confidence: number
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>
}

interface SpeechRecognitionInstance {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface SpeechRecognitionCtor {
  new (): SpeechRecognitionInstance
}

/**
 * Errores que significan "este navegador nunca podrá usar Web Speech": Brave,
 * Edge, Arc y Opera reportan UA de Chrome pero no traen la clave del servidor
 * de voz de Google, así que todo intento muere con 'network' aunque haya red.
 * Ante ellos transcribimos el audio ya grabado con Gemini en lugar de dejar al
 * usuario con un fallo sin salida.
 */
const WEB_SPEECH_UNUSABLE_ERRORS = new Set(['network', 'service-not-allowed'])

const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
}

/**
 * Captura de voz para ejercicios puntuados. Usa Web Speech cuando es fiable y
 * cae a transcripción por Gemini en el resto de navegadores, reutilizando el
 * audio que ya grabó MediaRecorder para no pedir al usuario que repita.
 */
export function useSpeechRecognition() {
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const [result, setResult] = useState<SpeechResult | null>(null)
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<SpeechErrorCode | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const recRef = useRef<SpeechRecognitionInstance | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioUrlRef = useRef<string | null>(null)
  // Evita que un onend tardío o un fallback en vuelo pisen un estado final.
  const settledRef = useRef(false)
  const fallbackRunningRef = useRef(false)

  const stopStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
  }, [])

  const stopRecorder = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === 'recording') {
      try {
        recorder.stop()
      } catch {
        // El recorder puede estar ya inactivo.
      }
    }
  }, [])

  useEffect(() => {
    // Gemini sólo necesita micrófono, así que hay soporte aunque falte Web Speech.
    const hasWebSpeech =
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    const hasMic = !!navigator.mediaDevices?.getUserMedia
    setIsSupported(hasWebSpeech || hasMic)
  }, [])

  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    setUserAudioUrl(null)
  }, [])

  // Desmontaje: soltar micrófono y URLs sin depender de que la UI llame reset().
  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort()
      } catch {
        // Ignorar fallo al abortar.
      }
      stopRecorder()
      stopStream()
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }
    }
  }, [stopRecorder, stopStream])

  /**
   * Transcribe con Gemini el audio ya capturado. Se invoca cuando Web Speech
   * es inutilizable en este navegador; el usuario no repite la grabación.
   */
  const runGeminiFallback = useCallback(async () => {
    if (fallbackRunningRef.current) return
    const stream = mediaStreamRef.current
    if (!stream) {
      settledRef.current = true
      setErrorCode('network')
      setStatus('error')
      return
    }

    fallbackRunningRef.current = true
    setStatus('processing')

    // El adaptador vuelve a grabar sobre el stream vivo: pedimos al usuario
    // que siga hablando sólo el tiempo que ya estaba hablando.
    const adapter = new GeminiAdapter(async () => stream)
    try {
      await adapter.start()
      const geminiResult = await adapter.stop()
      const transcript = geminiResult.transcript.trim()
      settledRef.current = true
      if (!transcript) {
        setErrorCode('no-speech')
        setStatus('error')
        return
      }
      setResult({ transcript, confidence: geminiResult.confidence ?? 0.8 })
      setErrorCode(null)
      setStatus('done')
    } catch {
      settledRef.current = true
      setErrorCode('network')
      setStatus('error')
    } finally {
      fallbackRunningRef.current = false
      stopRecorder()
      stopStream()
    }
  }, [stopRecorder, stopStream])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorCode('not-allowed')
      setStatus('error')
      return
    }

    settledRef.current = false
    fallbackRunningRef.current = false
    setResult(null)
    setErrorCode(null)
    revokeAudioUrl()

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS)
      mediaStreamRef.current = stream
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ''
      setErrorCode(
        name === 'NotAllowedError' || name === 'PermissionDeniedError'
          ? 'not-allowed'
          : 'unknown'
      )
      setStatus('error')
      return
    }

    // Grabación local para que el usuario se escuche y para alimentar a Gemini.
    try {
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        if (hasAudibleAudio(blob)) {
          const url = URL.createObjectURL(blob)
          audioUrlRef.current = url
          setUserAudioUrl(url)
        }
        // El stream sigue vivo si hay un fallback de Gemini en curso.
        if (!fallbackRunningRef.current) {
          stopStream()
        }
      }
      recorder.start(50)
      mediaRecorderRef.current = recorder
    } catch {
      // Sin grabador no hay auto-escucha ni fallback: no dejar el micro abierto.
      stopStream()
      setErrorCode('unknown')
      setStatus('error')
      return
    }

    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor
      webkitSpeechRecognition?: SpeechRecognitionCtor
    }
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition

    // Navegador con UA de Chrome pero sin clave de Google: ir directo a Gemini
    // en vez de gastar un intento que siempre falla con 'network'.
    if (!SR || !isWebSpeechReliable()) {
      setStatus('listening')
      return
    }

    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 3

    rec.onstart = () => setStatus('listening')

    rec.onresult = (e) => {
      let best = e.results[0][0]
      for (let i = 1; i < e.results[0].length; i++) {
        if (e.results[0][i].confidence > best.confidence) best = e.results[0][i]
      }
      settledRef.current = true
      setResult({ transcript: best.transcript.trim(), confidence: best.confidence })
      setStatus('done')
      stopRecorder()
    }

    rec.onerror = (event: { error?: string }) => {
      if (event.error === 'aborted') return

      if (WEB_SPEECH_UNUSABLE_ERRORS.has(event.error ?? '')) {
        void runGeminiFallback()
        return
      }

      const code: SpeechErrorCode =
        event.error === 'not-allowed' ? 'not-allowed'
        : event.error === 'no-speech' ? 'no-speech'
        : 'unknown'
      settledRef.current = true
      setErrorCode(code)
      setStatus('error')
      stopRecorder()
    }

    rec.onend = () => {
      if (fallbackRunningRef.current || settledRef.current) return
      setStatus((prev) => (prev === 'listening' ? 'idle' : prev))
      stopRecorder()
    }

    recRef.current = rec

    try {
      rec.start()
    } catch {
      // start() síncrono falló: el audio sigue grabándose, intentar con Gemini.
      void runGeminiFallback()
    }
  }, [revokeAudioUrl, runGeminiFallback, stopRecorder, stopStream])

  const stop = useCallback(() => {
    if (fallbackRunningRef.current) return

    // Sin reconocedor nativo el único camino es transcribir con Gemini.
    if (!recRef.current && status === 'listening') {
      void runGeminiFallback()
      return
    }

    try {
      recRef.current?.stop()
    } catch {
      // Ignorar fallo al detener el reconocedor.
    }
    stopRecorder()
  }, [status, runGeminiFallback, stopRecorder])

  const reset = useCallback(() => {
    if (recRef.current) {
      recRef.current.onerror = null
      recRef.current.onend = null
      try {
        recRef.current.abort()
      } catch {
        // Ignorar fallo al abortar.
      }
    }
    recRef.current = null
    settledRef.current = false
    fallbackRunningRef.current = false
    stopRecorder()
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    stopStream()
    revokeAudioUrl()
    setStatus('idle')
    setResult(null)
    setErrorCode(null)
  }, [revokeAudioUrl, stopRecorder, stopStream])

  return { status, result, userAudioUrl, errorCode, isSupported, start, stop, reset }
}
