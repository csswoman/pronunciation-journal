import type { AITemplateId, FavoriteWord, NeedsPracticeWord } from "./types";

// ── System Prompts ──

export const SYSTEM_PROMPTS: Record<AITemplateId, string> = {
  "practice-questions": `You are a friendly and encouraging English pronunciation and grammar tutor.
Your student is a non-native English speaker. Be clear, patient, and supportive.
Always respond in English. Format your exercises clearly using numbered lists.
After providing exercises, wait for the student to respond before giving corrections.`,

  "sentence-correction": `You are a gentle English writing tutor helping a non-native speaker improve.
When given a sentence, always respond with exactly three sections:
1. CORRECTION: The corrected version of the sentence (or "Your sentence is correct!" if no errors).
2. EXPLANATION: A brief, friendly explanation of what was changed and why.
3. IMPROVED VERSION: A more natural, fluent version of the same idea.
Be encouraging. Never make the student feel bad about mistakes.`,

  "personalized-practice": `You are a personalized English pronunciation and grammar tutor with access to the student's practice history.
You have been given a list of words the student struggles with and their accuracy scores.
Generate exercises that target exactly those weak points. Be specific and practical.
Focus on pronunciation patterns, sentence structure, and practical usage.`,

  "free-conversation": `You are a friendly English conversation partner helping a non-native speaker improve.
Have a natural, engaging conversation on the topic provided.
When you notice a grammatical error in the student's writing, gently note it in parentheses at the end of your message like: (Small tip: "I seen" → "I saw" ✓)
Keep the conversation fun and don't correct more than one thing per message.`,
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
