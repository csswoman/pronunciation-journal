import { publicAiErrorMessage } from '@/lib/degradation/messages'
import type { PronunciationDifficultyReason } from './types'

export interface PronunciationAnalysisResult {
  wordOrPhrase: string
  ipa: string
  syllableStress: string
  suggestedReason: PronunciationDifficultyReason
  explanationEs: string
  phoneticTrap?: string
}

export async function analyzePronunciationWord(
  wordOrPhrase: string
): Promise<PronunciationAnalysisResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Necesitas conexión a internet para analizar la pronunciación con IA.')
  }

  let res: Response
  try {
    res = await fetch('/api/gemini/journal-pronunciation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordOrPhrase }),
    })
  } catch {
    throw new Error(
      publicAiErrorMessage(undefined, '', 'No se pudo analizar la palabra. Verifica tu conexión.')
    )
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(
      publicAiErrorMessage(res.status, body?.error, 'No pudimos obtener la pronunciación en este momento.')
    )
  }

  return res.json() as Promise<PronunciationAnalysisResult>
}
