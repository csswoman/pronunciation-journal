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

