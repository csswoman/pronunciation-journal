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
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<SpeechErrorCode | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const recRef = useRef<SpeechRecognitionInstance | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    setIsSupported(
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    )
    return () => {
      if (userAudioUrl) {
        URL.revokeObjectURL(userAudioUrl)
      }
    }
  }, [userAudioUrl])

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

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
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

    // Start local MediaRecorder to capture audio for self-playback
    try {
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (blob.size > 500) {
          const url = URL.createObjectURL(blob)
          setUserAudioUrl(url)
        }
        // Stop stream tracks
        stream.getTracks().forEach((t) => t.stop())
        mediaStreamRef.current = null
      }
      recorder.start(50)
      mediaRecorderRef.current = recorder
    } catch {
      // MediaRecorder failure is non-blocking for speech recognition
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
      let best = e.results[0][0]
      for (let i = 1; i < e.results[0].length; i++) {
        if (e.results[0][i].confidence > best.confidence) best = e.results[0][i]
      }
      setResult({ transcript: best.transcript.trim(), confidence: best.confidence })
      setStatus('done')
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }

    rec.onend = () => {
      setStatus((prev) => (prev === 'listening' ? 'idle' : prev))
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }

    recRef.current = rec
    setResult(null)
    setUserAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })

    try {
      rec.start()
    } catch {
      setStatus('error')
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [isSupported])

  const stop = useCallback(() => {
    recRef.current?.stop()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const reset = useCallback(() => {
    if (recRef.current) {
      recRef.current.onerror = null
      recRef.current.abort()
    }
    recRef.current = null
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current = null
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    setUserAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setStatus('idle')
    setResult(null)
    setErrorCode(null)
  }, [])

  return { status, result, userAudioUrl, errorCode, isSupported, start, stop, reset }
}
