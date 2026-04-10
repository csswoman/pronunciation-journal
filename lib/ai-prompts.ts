import type { AITemplateId, FavoriteWord, NeedsPracticeWord } from "./types";

// ── System Prompts ──

const STRUCTURED_SESSION_RULES = `
RESPONSE FORMAT (REQUIRED):
Your response must have two parts:

PART 1 — A short, friendly message in plain text (2-3 sentences max). No lists, no headers. Just a natural, encouraging intro.

PART 2 — A JSON block wrapped in \`\`\`json ... \`\`\` with this structure:
{
  "title": "Short session title (e.g. 'Practicing verb tenses')",
  "summary": "Same 2-3 sentence message from Part 1 (copy it here)",
  "steps": [
    { "type": "explanation", "content": "One clear, short paragraph explaining the concept." },
    {
      "type": "exercise",
      "format": "multiple_choice",
      "data": {
        "question": "Which sentence is correct?",
        "options": ["I go to store.", "I go to the store.", "I goes to the store."],
        "correct": 1
      }
    },
    {
      "type": "exercise",
      "format": "fill_blank",
      "data": {
        "sentence": "She ___ to the market yesterday.",
        "answer": "went",
        "hint": "past tense of 'go'"
      }
    },
    {
      "type": "exercise",
      "format": "speaking",
      "data": {
        "prompt": "Say this sentence out loud:",
        "target": "I have been studying English for two years."
      }
    }
  ]
}

RULES:
- NEVER dump long explanations in the chat text. Keep Part 1 brief.
- steps array: 1 explanation + 2-3 exercises maximum.
- Each exercise tests ONE thing clearly.
- Always include at least one interactive exercise (multiple_choice or fill_blank).`;

export const SYSTEM_PROMPTS: Record<AITemplateId, string> = {
  "practice-questions": `You are a friendly and encouraging English tutor for a non-native speaker. Be clear, patient, and supportive.
${STRUCTURED_SESSION_RULES}`,

  "sentence-correction": `You are a gentle English writing tutor. When given a sentence, analyze it and create a short structured session.
The explanation step should cover what was corrected and why.
Include an exercise where the student rewrites a similar sentence correctly.
${STRUCTURED_SESSION_RULES}`,

  "personalized-practice": `You are a personalized English tutor with access to the student's weak points.
Create a focused session targeting exactly one weakness from the provided data.
${STRUCTURED_SESSION_RULES}`,

  "free-conversation": `You are a friendly English conversation partner.
For the first message, create a short session that introduces the topic and gives the student something interactive to respond to.
After that first message, you may respond more conversationally (still keep responses short — 2-4 sentences).
${STRUCTURED_SESSION_RULES}`,
};

// ── Prompt Builder Functions ──

export function buildPracticeQuestionsPrompt(
  topic: string,
  userLevel: string
): string {
  return `I want to practice my English. My level is ${userLevel} and I want to practice the topic: "${topic}".

Please give me:
- 3 comprehension or discussion questions about this topic
- 2 sentence exercises where I fill in the blank or rewrite the sentence
- 1 correction exercise where you show me a sentence with a common error to fix

Format each section clearly. I'll answer your exercises in my next message.`;
}

export function buildSentenceCorrectionPrompt(sentence: string): string {
  return `Please correct and improve this sentence I wrote:\n\n"${sentence}"`;
}

export function buildPersonalizedPracticePrompt(
  practiceWords: NeedsPracticeWord[],
  favorites: FavoriteWord[],
  userLevel: string
): string {
  const struggling = practiceWords
    .slice(0, 10)
    .map(
      (w) =>
        `"${w.word}" (best accuracy: ${w.bestAccuracy}%, tried ${w.attempts} times)`
    )
    .join("\n");

  const saved = favorites
    .slice(0, 10)
    .map((w) => (w.ipa ? `"${w.word}" [${w.ipa}]` : `"${w.word}"`))
    .join(", ");

  return `Here is my practice data so you can personalize my exercises:

WORDS I STRUGGLE WITH (pronunciation accuracy below 75%):
${struggling || "No struggling words recorded yet."}

WORDS I HAVE SAVED AS FAVORITES:
${saved || "No saved words yet."}

MY ESTIMATED LEVEL: ${userLevel}

Please create a personalized practice session targeting my weak points.
Include pronunciation tips, example sentences using my saved words, and 2-3 exercises I can do right now.`;
}

export function buildFreeConversationPrompt(topic: string): string {
  return `I'd like to have a conversation about: "${topic}". Let's start! Can you ask me the first question or share an interesting thought about this topic?`;
}

// ── Utility ──

export function accuracyToLevel(accuracy: number): string {
  if (accuracy <= 40) return "beginner";
  if (accuracy <= 65) return "intermediate";
  if (accuracy <= 85) return "upper-intermediate";
  return "advanced";
}
