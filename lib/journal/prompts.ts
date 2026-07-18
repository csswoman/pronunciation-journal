const PROMPTS = [
  'What was one small win from your day?',
  'Describe something you would like to learn this week.',
  'Write about a place that helps you relax.',
  'What conversation do you remember today?',
]
export function journalPromptForDate(date: string, interests: readonly string[] = []) {
  const day = Number(date.slice(-2)) || 0
  const base = PROMPTS[day % PROMPTS.length]
  return interests.length ? `${base} You can write about ${interests[day % interests.length]}.` : base
}
