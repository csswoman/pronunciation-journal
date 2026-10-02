'use client'

import { useCallback, useState } from 'react'
import { publicAiErrorMessage } from '@/lib/degradation/messages'
import { scorePronunciation } from '@/lib/pronunciation/scoring'
import type { WordResult } from '@/lib/types'
import { transcriptionForm } from '@/lib/speech/transcription-request'
import { TRANSCRIPTION_CLIENT_TIMEOUT_MS } from '@/lib/speech/recording-config'

export interface TranscriptionScore {
  wordResults: WordResult[]
  transcript: string
  accuracy: number
}

export type TranscriptionState = 'idle' | 'transcribing' | 'done' | 'error'

interface UseBlobTranscriptionReturn {
  state: TranscriptionState
  score: TranscriptionScore | null
  error: string | null
  run: (blob: Blob, targetWord: string) => Promise<void>
  reset: () => void
}

const TRANSCRIBE_ENDPOINT = '/api/gemini/transcribe'

/**
 * Transcribe a recorded audio blob via the Gemini endpoint and score it locally.
 *
 * Used by the sounds shadowing exercise to show an ELSA-style phoneme breakdown
 * as informative feedback. Network failures degrade gracefully: the hook lands
 * in 'error' state and the caller simply omits the table — the shadowing flow
 * keeps working. Scoring itself (scorePronunciation) is local, no AI.
 */
export function useBlobTranscription(): UseBlobTranscriptionReturn {
  const [state, setState] = useState<TranscriptionState>('idle')
  const [score, setScore] = useState<TranscriptionScore | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (blob: Blob, targetWord: string) => {
    setState('transcribing')
    setScore(null)
    setError(null)

    try {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(new DOMException('Transcription timed out', 'TimeoutError')), TRANSCRIPTION_CLIENT_TIMEOUT_MS)

      let transcript: string
      try {
        const res = await fetch(TRANSCRIBE_ENDPOINT, {
          method: 'POST',
          signal: controller.signal,
          body: transcriptionForm(blob, targetWord),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(publicAiErrorMessage(res.status, data.error))
        }
        const data = await res.json()
        transcript = String(data.transcript ?? '').trim()
      } finally {
        window.clearTimeout(timeoutId)
      }

      if (!transcript) throw new Error('no-speech')
      const result = await scorePronunciation(transcript, targetWord)
      setScore({
        wordResults: result.wordResults,
        transcript: result.transcript,
        accuracy: result.accuracy,
      })
      setState('done')
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === 'TimeoutError'
      setError(publicAiErrorMessage(timedOut ? 504 : undefined, err instanceof Error ? err.message : ''))
      setScore(null)
      setState('error')
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setScore(null)
    setError(null)
  }, [])

  return { state, score, error, run, reset }
}
