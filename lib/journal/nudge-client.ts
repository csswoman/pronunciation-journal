import {
  journalNudgeResponseSchema,
  type JournalNudgeRequest,
  type JournalNudgeResponse,
} from './nudge'

export class JournalNudgeError extends Error {
  constructor(message = 'No se pudo encontrar una pista') {
    super(message)
    this.name = 'JournalNudgeError'
  }
}

export async function requestJournalNudge(input: JournalNudgeRequest): Promise<JournalNudgeResponse> {
  const response = await fetch('/api/gemini/journal-nudge', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) throw new JournalNudgeError()

  const parsed = journalNudgeResponseSchema.safeParse(await response.json())
  if (!parsed.success) throw new JournalNudgeError()
  return parsed.data
}
