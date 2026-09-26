export interface JournalPrompt {
  id: string
  text: string
  target_length: number
  cefr_min: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
}

/** Content pool. Each entry is independently cacheable by id and CEFR level. */
export const JOURNAL_PROMPTS: readonly JournalPrompt[] = [
  // ── Daily & Routine ──
  { id: 'remembered-conversation', text: 'What conversation do you remember today?', target_length: 60, cefr_min: 'A1' },
  { id: 'small-win', text: 'What was one small win or achievement from your day?', target_length: 60, cefr_min: 'A1' },
  { id: 'relaxing-place', text: 'Describe a comfortable place that helps you relax.', target_length: 60, cefr_min: 'A1' },
  { id: 'daily-routine-change', text: 'What is one thing in your daily routine that you want to improve?', target_length: 70, cefr_min: 'A2' },
  { id: 'grateful-moment', text: 'What are two small things that made you smile today?', target_length: 60, cefr_min: 'A1' },
  { id: 'delicious-food', text: 'What did you eat today that you genuinely enjoyed?', target_length: 60, cefr_min: 'A1' },

  // ── Opinion & Thought ──
  { id: 'learn-this-week', text: 'Describe something you would like to learn this week and why.', target_length: 60, cefr_min: 'A1' },
  { id: 'remote-vs-office', text: 'Do you prefer working from home or from an office? Explain your reasons.', target_length: 80, cefr_min: 'B1' },
  { id: 'favorite-book-or-movie', text: 'What is a book or movie that left a strong impression on you?', target_length: 80, cefr_min: 'A2' },
  { id: 'technology-impact', text: 'In your opinion, what recent technology has improved everyday life the most?', target_length: 80, cefr_min: 'B1' },
  { id: 'travel-destination', text: 'If you could recommend one place in the world to visit, where would it be?', target_length: 70, cefr_min: 'A2' },

  // ── Fiction & Creative ──
  { id: 'mystery-letter', text: 'Imagine you found an unopened letter from 50 years ago in your house.', target_length: 80, cefr_min: 'A2' },
  { id: 'teleport-ten-minutes', text: 'You can teleport anywhere in the universe for exactly 10 minutes. Where do you go?', target_length: 80, cefr_min: 'A2' },
  { id: 'secret-room', text: 'Describe a hidden secret room inside your dream home.', target_length: 70, cefr_min: 'A2' },
  { id: 'time-capsule', text: 'What three items would you put into a time capsule for people 100 years from now?', target_length: 80, cefr_min: 'B1' },

  // ── Situational & Practical ──
  { id: 'work-email-update', text: 'Write a short friendly email to a colleague sharing a project update.', target_length: 70, cefr_min: 'A2' },
  { id: 'hotel-request', text: 'You are staying at a hotel and need extra amenities or advice on local food. What do you ask?', target_length: 60, cefr_min: 'A2' },
  { id: 'recommend-city-spot', text: 'A foreign tourist asks you for the best spot in your city to spend an afternoon. What do you say?', target_length: 70, cefr_min: 'A2' },
  { id: 'job-interview-strength', text: 'How would you explain your greatest professional strength in a simple interview answer?', target_length: 80, cefr_min: 'B1' },

  // ── Vocab & Structure ──
  { id: 'negotiate-agree', text: 'Describe a moment where you had to negotiate or agree with someone.', target_length: 70, cefr_min: 'A2' },
  { id: 'solve-challenge', text: 'Write about a challenge you solved recently using connectors like "however" and "finally".', target_length: 80, cefr_min: 'B1' },
  { id: 'three-verbs-story', text: 'Tell a mini story using the verbs: notice, realize, and discover.', target_length: 70, cefr_min: 'A2' },
  { id: 'phrasal-verbs-routine', text: 'Write about your morning routine using: wake up, figure out, and look forward to.', target_length: 70, cefr_min: 'A2' },

  // ── Advanced Opinion & Debate (B2/C1) ──
  { id: 'career-pivot', text: 'If you had to pivot your career into an entirely different industry tomorrow, which field would you choose and what challenges would you expect?', target_length: 90, cefr_min: 'B2' },
  { id: 'ethical-ai', text: 'To what extent should artificial intelligence automate creative work like writing, music, or design? Defend your position with concrete reasons.', target_length: 100, cefr_min: 'B2' },
  { id: 'unpopular-opinion', text: 'Describe an opinion you hold strongly that most people in your social or professional circle disagree with. Why do you believe it?', target_length: 90, cefr_min: 'B2' },
  { id: 'leadership-challenge', text: 'What is the most difficult aspect of leading or mentoring others, and how would you address an underperforming teammate constructively?', target_length: 100, cefr_min: 'B2' },
  { id: 'defining-moment', text: 'Reflect on a decision in your past that felt distinctly risky at the time. Looking back, how did it shape your career or perspective?', target_length: 90, cefr_min: 'B2' },
  { id: 'modern-burnout', text: 'Many professionals struggle to balance ambition with personal well-being. What specific boundaries or habits do you maintain to prevent burnout?', target_length: 90, cefr_min: 'B2' },
  { id: 'subtle-cultural-shift', text: 'Discuss a subtle cultural or linguistic change you have observed in recent years. How does it reflect deeper transformations in society?', target_length: 120, cefr_min: 'C1' },
  { id: 'complex-tradeoff', text: 'Analyze a complex dilemma where every possible alternative carried significant downsides. How did you reconcile the competing priorities?', target_length: 120, cefr_min: 'C1' },
  { id: 'rhetorical-persuasion', text: 'Write a persuasive case advocating for an unconventional idea or policy, carefully acknowledging and addressing the main counterarguments.', target_length: 130, cefr_min: 'C1' },
  { id: 'nuanced-identity', text: 'How does communicating in a second language alter the way you express humor, vulnerability, or intellectual authority compared to your native tongue?', target_length: 120, cefr_min: 'C1' },
  { id: 'the-paradox-of-choice', text: 'Modern life provides an unprecedented abundance of choices in career, media, and lifestyle. Does this variety liberate us, or does it breed subtle paralysis?', target_length: 120, cefr_min: 'C1' },
  { id: 'future-of-human-connection', text: 'As asynchronous digital interaction displaces in-person collaboration, what essential dimensions of trust and empathy are we at risk of diluting?', target_length: 130, cefr_min: 'C1' },

  // ── Free Topic ──
  { id: 'free-writing', text: 'Write freely about anything on your mind today.', target_length: 60, cefr_min: 'A1' },
  { id: 'free-reflection', text: 'Reflect on an interesting thought, idea, or feeling you had recently.', target_length: 70, cefr_min: 'A2' },
]

export function journalPromptForDate(date: string): JournalPrompt {
  const day = Number(date.slice(-2)) || 0
  return JOURNAL_PROMPTS[day % JOURNAL_PROMPTS.length]
}

export function journalPromptById(id: string): JournalPrompt | undefined {
  return JOURNAL_PROMPTS.find((p) => p.id === id)
}
