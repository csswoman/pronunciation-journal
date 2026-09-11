'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { isWebSpeechReliable } from '@/lib/speech/adapters/webSpeechAdapter'
import type { TranscriptSource } from '@/lib/speech/transcript-quality'
import {
  attachPeakAnalyser,
  isSilentCapture,
  trackPeak,
  type PeakTracker,
} from '@/lib/speech/signal-quality'
import { INTELLIGIBILITY_CAPTURE } from '@/lib/speech/capture-profiles'
import { transcribeWithGemini } from '@/lib/speech/gemini-fallback'
import { startSelfListeningRecorder } from '@/lib/speech/self-listening-recorder'
import {
  WEB_SPEECH_UNUSABLE_ERRORS,
  bestAlternative,
  getSpeechRecognitionCtor,
  type SpeechRecognitionInstance,
} from '@/lib/speech/web-speech-recognition'

export type SpeechStatus = 'idle' | 'listening' | 'processing' | 'done' | 'error' | 'unsupported'
export type SpeechErrorCode = 'network' | 'not-allowed' | 'no-speech' | 'unknown'

export interface SpeechResult {
  transcript: string
  /**
   * Confianza del reconocedor (0-1). Ausente cuando la fuente no la reporta
   * (Gemini devuelve sólo texto); no inventar un valor, porque la evaluación
   * distingue "confianza baja" de "sin dato".
   */
  confidence?: number
  /** Qué reconocedor produjo el texto. Las fuentes no son equivalentes. */
  source: TranscriptSource
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
  const audioUrlRef = useRef<string | null>(null)
  // Evita que un onend tardío o un fallback en vuelo pisen un estado final.
  const settledRef = useRef(false)
  const fallbackRunningRef = useRef(false)
  // Mide la amplitud real del micro: el tamaño del blob no distingue voz de silencio.
  const peakRef = useRef<PeakTracker>(trackPeak())
  const analyserCleanupRef = useRef<(() => void) | null>(null)

  const stopStream = useCallback(() => {
    analyserCleanupRef.current?.()
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

    if (isSilentCapture(peakRef.current.peak())) {
      settledRef.current = true
      setErrorCode('no-speech')
      setStatus('error')
      stopRecorder()
      stopStream()
      return
    }

    fallbackRunningRef.current = true
    setStatus('processing')

    // El adaptador vuelve a grabar sobre el stream vivo, así que el usuario no
    // tiene que repetir la frase.
    const outcome = await transcribeWithGemini(stream)
    settledRef.current = true

    if (outcome.kind === 'transcript') {
      // Gemini no reporta confianza: dejarla ausente en vez de inventar un
      // valor que haría pasar por segura una transcripción no verificada.
      setResult({
        transcript: outcome.result.transcript,
        confidence: outcome.result.confidence,
        source: 'gemini',
      })
      setErrorCode(null)
      setStatus('done')
    } else {
      setErrorCode(outcome.kind === 'no-speech' ? 'no-speech' : 'network')
      setStatus('error')
    }

    fallbackRunningRef.current = false
    stopRecorder()
    stopStream()
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
      stream = await navigator.mediaDevices.getUserMedia(INTELLIGIBILITY_CAPTURE)
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

    peakRef.current.reset()
    analyserCleanupRef.current = attachPeakAnalyser(stream, peakRef.current)

    // Grabación local para que el usuario se escuche y para alimentar a Gemini.
    const recorder = startSelfListeningRecorder(stream, {
      onAudioUrl: (url) => {
        audioUrlRef.current = url
        setUserAudioUrl(url)
      },
      // El stream sigue vivo si hay un fallback de Gemini en curso.
      onStopped: () => {
        if (!fallbackRunningRef.current) stopStream()
      },
    })

    if (!recorder) {
      // Sin grabador no hay auto-escucha ni fallback: no dejar el micro abierto.
      stopStream()
      setErrorCode('unknown')
      setStatus('error')
      return
    }
    mediaRecorderRef.current = recorder

    const SR = getSpeechRecognitionCtor()

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
      const best = bestAlternative(e)
      settledRef.current = true
      if (isSilentCapture(peakRef.current.peak())) {
        // El reconocedor devolvió texto pero el micro nunca captó voz audible
        // (micro silenciado o entrada equivocada): no puntuar esa alucinación.
        setErrorCode('no-speech')
        setStatus('error')
        stopRecorder()
        return
      }
      setResult({
        transcript: best.transcript.trim(),
        confidence: best.confidence,
        source: 'web-speech',
      })
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
    stopStream()
    revokeAudioUrl()
    setStatus('idle')
    setResult(null)
    setErrorCode(null)
  }, [revokeAudioUrl, stopRecorder, stopStream])

  return { status, result, userAudioUrl, errorCode, isSupported, start, stop, reset }
}
