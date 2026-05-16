'use client'

import { useCallback, useRef, useState } from 'react'

export type SpeechStatus = 'idle' | 'listening' | 'done' | 'error' | 'unsupported'

export interface SpeechResult {
  transcript: string
  confidence: number
}

export function useSpeechRecognition() {
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const [result, setResult] = useState<SpeechResult | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const start = useCallback(() => {
    if (!isSupported) {
      setStatus('unsupported')
      return
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

    rec.onerror = () => setStatus('error')

    // onend fires after onresult — only reset to idle if nothing was captured
    rec.onend = () => setStatus(prev => (prev === 'listening' ? 'idle' : prev))

    recRef.current = rec
    setResult(null)
    rec.start()
  }, [isSupported])

  const stop = useCallback(() => {
    recRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    recRef.current?.abort()
    recRef.current = null
    setStatus('idle')
    setResult(null)
  }, [])

  return { status, result, isSupported, start, stop, reset }
}
