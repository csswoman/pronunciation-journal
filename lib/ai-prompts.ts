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

// ── Interview ──

export const INTERVIEW_SYSTEM_PROMPT = `You are an interview script generator for English language learners. Generate a realistic mock interview script with 6 rounds (question + model answer).

Rules:
- Interviewer questions must be natural and conversational
- Candidate answers must be in natural spoken English (not written/formal)
- Adjust vocabulary complexity to the requested level
- beginner: simple sentences, common words, short answers
- intermediate: clear professional language, moderate complexity
- advanced: idiomatic expressions, nuanced vocabulary, longer answers
- Return ONLY valid JSON, no markdown, no code fences

Format:
{
  "title": "Interview title",
  "turns": [
    {"role": "interviewer", "text": "..."},
    {"role": "candidate", "text": "..."},
    ...
  ]
}

Include exactly 12 turns (6 interviewer + 6 candidate, alternating, starting with interviewer).`;

const INTERVIEW_SCENARIO_LABELS: Record<string, string> = {
  hr: "HR / General Interview",
  frontend: "Frontend Developer Interview",
  "system-design": "System Design Interview",
  behavioral: "Behavioral Interview (STAR method)",
  product: "Product Manager Interview",
  "ai-developer": "AI Developer Interview",
};

export function buildInterviewPrompt(scenario: string, level: string): string {
  const label = INTERVIEW_SCENARIO_LABELS[scenario] ?? scenario;
  return `Generate a ${label} script for a ${level} English learner. Make the interviewer professional and the candidate responses natural spoken English at ${level} level.`;
}

// ── Lesson generation ──

// Tipos explícitos para evitar strings sueltos
export type LessonLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type LessonCategory =
  | "grammar"
  | "vocabulary"
  | "pronunciation"
  | "writing"
  | "speaking"
  | "reading";

const LEVEL_DESCRIPTORS: Record<LessonLevel, string> = {
  A1: "complete beginner — use very simple sentences, high-frequency words only",
  A2: "elementary — familiar topics, basic sentence patterns, simple connectors",
  B1: "intermediate — can handle everyday topics, some complex grammar",
  B2: "upper-intermediate — nuanced grammar, idiomatic expressions, abstract topics",
  C1: "advanced — near-native fluency, subtle distinctions, register awareness",
  C2: "mastery — native-like precision, stylistic nuance, edge cases",
};

const CATEGORY_FOCUS: Record<LessonCategory, string> = {
  grammar: "explain the rule, show the pattern, contrast with common errors",
  vocabulary: "show words in context, collocations, register (formal/informal)",
  pronunciation: "focus on sounds, stress, intonation patterns — use phonetic hints",
  writing: "show structure and models, include a short writing prompt at the end",
  speaking: "provide conversation patterns, dialogue examples, spoken vs written differences",
  reading: "include a short reading passage as the main example, then analyze it",
};

export const LESSON_GENERATION_SYSTEM_PROMPT = `You are an expert English curriculum designer creating lessons for a language learning app.

## Your output format
Return ONLY a valid JSON object with this exact shape — no markdown fences, no preamble:
{"title": "string", "content": "string"}

- "title": A specific, concrete title (e.g. "Using 'used to' for Past Habits", NOT "Grammar Lesson")
- "content": The full lesson written in Markdown (rules below)

## Lesson content rules

Structure:
- Open with a short paragraph (no heading) stating what the learner will be able to do after this lesson.
- Use ## and ### headings to organize sections.
- Do NOT add an H1 title — the title field handles that.
- End with a ## Practice section containing 3–5 exercises or reflection prompts matched to the level.

Writing style:
- All explanations in clear English — no translations.
- Use **bold** for key terms on first use.
- Examples must feel natural and conversational, never textbook-stiff.
- Minimum 3 example sentences per concept introduced.
- Use Markdown tables for comparisons (correct vs. incorrect, formal vs. informal, etc.).

Callouts — use sparingly, only when genuinely useful, exact syntax required:
:::tip
A useful tip.
:::
:::warning
A common mistake to avoid.
:::
:::info
Extra context or cultural note.
:::

Adapt vocabulary complexity, sentence length, and abstract concepts strictly to the requested level.`;

export function buildLessonGenerationPrompt(
  topic: string,
  category: LessonCategory,
  level: LessonLevel
): string {
  const levelDesc = LEVEL_DESCRIPTORS[level];
  const categoryFocus = CATEGORY_FOCUS[category];

  return `Create a ${category} lesson for a ${level} learner (${levelDesc}).

Topic: "${topic}"
Category focus: ${categoryFocus}

The lesson should be complete and immediately usable — a learner should finish it with a clear understanding and at least one thing they can practice right away.`;
}

// ── Utility ──

export function accuracyToLevel(accuracy: number): string {
  if (accuracy <= 40) return "beginner";
  if (accuracy <= 65) return "intermediate";
  if (accuracy <= 85) return "upper-intermediate";
  return "advanced";
}
