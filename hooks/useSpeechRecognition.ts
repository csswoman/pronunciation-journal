'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechStatus = 'idle' | 'listening' | 'done' | 'error' | 'unsupported'
export type SpeechErrorCode = 'network' | 'not-allowed' | 'no-speech' | 'unknown'

export interface SpeechResult {
  transcript: string
  confidence: number
}

export function useSpeechRecognition() {
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const [result, setResult] = useState<SpeechResult | null>(null)
  const [errorCode, setErrorCode] = useState<SpeechErrorCode | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)

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

    // Pre-warm mic permission — ignore failures, SpeechRecognition handles its own permission
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((t) => t.stop())
      }
    } catch {
      // continue — let SpeechRecognition surface the error if mic is truly unavailable
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: any = w.SpeechRecognition ?? w.webkitSpeechRecognition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 3

    rec.onstart = () => setStatus('listening')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
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
