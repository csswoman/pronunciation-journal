'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechStatus = 'idle' | 'listening' | 'done' | 'error' | 'unsupported'
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

export function useSpeechRecognition() {
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const [result, setResult] = useState<SpeechResult | null>(null)
  const [errorCode, setErrorCode] = useState<SpeechErrorCode | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const recRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    setIsSupported(
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    )
  }, [])

  const start = useCallback(async () => {
    if (!isSupported) {
      setStatus('unsupported')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorCode('not-allowed')
      setStatus('error')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
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

    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor
      webkitSpeechRecognition?: SpeechRecognitionCtor
    }
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) {
      setStatus('unsupported')
      return
    }
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 3

    rec.onstart = () => setStatus('listening')

    rec.onresult = (e) => {
      // Pick the alternative with highest confidence
      let best = e.results[0][0]
      for (let i = 1; i < e.results[0].length; i++) {
        if (e.results[0][i].confidence > best.confidence) best = e.results[0][i]
      }
      setResult({ transcript: best.transcript.trim(), confidence: best.confidence })
      setStatus('done')
    }

    rec.onerror = (event: { error?: string }) => {
      if (event.error === 'aborted') return
      const code: SpeechErrorCode =
        event.error === 'network' ? 'network'
        : event.error === 'not-allowed' ? 'not-allowed'
        : event.error === 'no-speech' ? 'no-speech'
        : 'unknown'
      setErrorCode(code)
      setStatus('error')
    }

    rec.onend = () => setStatus((prev) => (prev === 'listening' ? 'idle' : prev))

    recRef.current = rec
    setResult(null)
    try {
      rec.start()
    } catch {
      setStatus('error')
    }
  }, [isSupported])

  const stop = useCallback(() => {
    recRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    if (recRef.current) {
      recRef.current.onerror = null
      recRef.current.abort()
    }
    recRef.current = null
    setStatus('idle')
    setResult(null)
    setErrorCode(null)
  }, [])

  return { status, result, errorCode, isSupported, start, stop, reset }
}
