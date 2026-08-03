export interface JournalPrompt {
  id: string
  text: string
  target_length: number
  cefr_min: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
}

/** Content pool. Each entry is independently cacheable by id and CEFR level. */
export const JOURNAL_PROMPTS: readonly JournalPrompt[] = [
  { id: 'small-win', text: 'What was one small win from your day?', target_length: 60, cefr_min: 'A1' },
  { id: 'learn-this-week', text: 'Describe something you would like to learn this week.', target_length: 60, cefr_min: 'A1' },
  { id: 'relaxing-place', text: 'Write about a place that helps you relax.', target_length: 60, cefr_min: 'A1' },
  { id: 'remembered-conversation', text: 'What conversation do you remember today?', target_length: 60, cefr_min: 'A1' },
]

export function journalPromptForDate(date: string): JournalPrompt {
  const day = Number(date.slice(-2)) || 0
  return JOURNAL_PROMPTS[day % JOURNAL_PROMPTS.length]
}
