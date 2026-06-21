'use client'

import { useCallback, useRef, useState } from 'react'

export type RecorderState = 'idle' | 'recording' | 'done' | 'error'

export interface RecordingResult {
  blob: Blob
  url: string
  durationMs: number
}

interface UseVoiceRecorderReturn {
  state: RecorderState
  result: RecordingResult | null
  isSupported: boolean
  start: () => Promise<void>
  stop: () => void
  reset: () => void
}

const RECORDER_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/mp4;codecs=mp4a.40.2',
  '',
] as const

type RecorderInitResult =
  | { supported: true; recorder: MediaRecorder; mimeType: string }
  | { supported: false }

export function createAudioRecorder(stream: MediaStream): RecorderInitResult {
  if (
    typeof window === 'undefined' ||
    typeof window.MediaRecorder === 'undefined' ||
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    return { supported: false }
  }

  for (const mimeType of RECORDER_MIME_TYPES) {
    if (mimeType && !MediaRecorder.isTypeSupported(mimeType)) {
      continue
    }

    try {
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      return {
        supported: true,
        recorder,
        mimeType: recorder.mimeType || mimeType || 'audio/mp4',
      }
    } catch {
      continue
    }
  }

  return { supported: false }
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle')
  const [result, setResult] = useState<RecordingResult | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const blobUrlRef = useRef<string | null>(null)

  const isSupported =
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia

  const reset = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
    setResult(null)
    setState('idle')
  }, [])

  const start = useCallback(async () => {
    if (!isSupported) return
    reset()

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setState('error')
      return
    }

    const recorderResult = createAudioRecorder(stream)
    if (!recorderResult.supported) {
      stream.getTracks().forEach((t) => t.stop())
      setState('error')
      return
    }

    const { recorder, mimeType } = recorderResult
    mediaRecorderRef.current = recorder
    chunksRef.current = []
    startTimeRef.current = Date.now()

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      const durationMs = Date.now() - startTimeRef.current
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      setResult({ blob, url, durationMs })
      setState('done')
    }

    recorder.onerror = () => {
      stream.getTracks().forEach((t) => t.stop())
      setState('error')
    }

    recorder.start()
    setState('recording')
  }, [isSupported, reset])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  return { state, result, isSupported, start, stop, reset }
}
