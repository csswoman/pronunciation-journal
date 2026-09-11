"use client";

import { GeminiAdapter } from './adapters/geminiAdapter'
import type { SpeechInputResult } from './types'

export type FallbackOutcome =
  | { kind: 'transcript'; result: SpeechInputResult }
  | { kind: 'no-speech' }
  | { kind: 'failed' }

/**
 * Transcribe con Gemini el audio del stream vivo.
 *
 * Se usa cuando el reconocedor nativo no puede funcionar en este navegador.
 * Devuelve un resultado clasificado en vez de lanzar, para que el hook decida
 * el estado sin envolver todo en try/catch.
 */
export async function transcribeWithGemini(stream: MediaStream): Promise<FallbackOutcome> {
  const adapter = new GeminiAdapter(async () => stream)
  try {
    await adapter.start()
    const result = await adapter.stop()
    const transcript = result.transcript.trim()
    if (!transcript) return { kind: 'no-speech' }
    return { kind: 'transcript', result: { ...result, transcript } }
  } catch {
    return { kind: 'failed' }
  }
}
