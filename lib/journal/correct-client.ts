import { publicAiErrorMessage } from '@/lib/degradation/messages'
import type {
  JournalCorrectRequest,
  JournalCorrectionResult,
} from '@/lib/journal/correction'

export type { JournalCorrectRequest, JournalCorrectionResult }

const JOURNAL_AI_UNAVAILABLE_MESSAGE =
  'No pudimos revisar tu página en este momento. Tu texto sigue guardado — puedes intentarlo de nuevo en unos minutos.'

export class JournalCorrectionError extends Error {
  constructor(
    message: string,
    readonly code: 'offline' | 'network' | 'server',
  ) {
    super(message)
    this.name = 'JournalCorrectionError'
  }
}

/**
 * Client-side call to /api/gemini/journal-correct. Requires network: correction
 * is the only online-only part of the Journal loop (drafts stay offline-first).
 * Mirrors gradeProduction so both AI flows degrade with the same public copy.
 */
export async function correctJournalEntry(
  input: JournalCorrectRequest,
): Promise<JournalCorrectionResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new JournalCorrectionError(
      'Necesitas conexión a internet para corregir tu entrada.',
      'offline',
    )
  }

  let res: Response
  try {
    res = await fetch('/api/gemini/journal-correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    throw new JournalCorrectionError(
      publicAiErrorMessage(undefined, '', JOURNAL_AI_UNAVAILABLE_MESSAGE),
      'network',
    )
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new JournalCorrectionError(
      publicAiErrorMessage(res.status, body?.error, JOURNAL_AI_UNAVAILABLE_MESSAGE),
      'server',
    )
  }

  return res.json() as Promise<JournalCorrectionResult>
}
