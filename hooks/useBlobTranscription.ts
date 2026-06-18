'use client'

import { useCallback, useState } from 'react'
import { scorePronunciation } from '@/lib/pronunciation/scoring'
import type { WordResult } from '@/lib/types'

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
const REQUEST_TIMEOUT_MS = 10_000

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read audio blob'))
    reader.readAsDataURL(blob)
  })
}

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
      const audioDataUrl = await blobToDataUrl(blob)

      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      let transcript: string
      try {
        const res = await fetch(TRANSCRIBE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ audioDataUrl, targetWord }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? `transcribe failed (${res.status})`)
        }
        const data = await res.json()
        transcript = String(data.transcript ?? '').trim()
      } finally {
        window.clearTimeout(timeoutId)
      }

      // scorePronunciation handles an empty transcript (produces missing/incorrect
      // phonemes), so this still yields useful feedback rather than an error.
      const result = await scorePronunciation(transcript, targetWord)
      setScore({
        wordResults: result.wordResults,
        transcript: result.transcript,
        accuracy: result.accuracy,
      })
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'transcription failed')
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
