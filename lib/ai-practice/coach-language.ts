import type { CEFRLevel } from "@/lib/exercises/cefr";

/**
 * Which language the coach writes its *scaffolding* in — explanations,
 * feedback, encouragement, the prose around an exercise.
 *
 * This never governs the English being taught: target-language content
 * (example sentences, mission lines, exercise stems) is always English at
 * every level. Mixing those two decisions is what made the coach greet in
 * Spanish and then grade in English.
 */
export type CoachLanguage = "es" | "en";

/** An explicit learner choice, or `null` to follow their CEFR level. */
export type CoachLanguagePreference = CoachLanguage | null;

/**
 * A1–A2 get Spanish scaffolding: at that level an English explanation of an
 * English mistake is a second thing to decode. B1 and up get English, with the
 * existing per-message "Traducir" action as the escape hatch.
 */
export function defaultCoachLanguage(level: CEFRLevel): CoachLanguage {
  return level === "A1" || level === "A2" ? "es" : "en";
}

/** An explicit preference always wins over the level-derived default. */
export function resolveCoachLanguage(
  level: CEFRLevel,
  preference: CoachLanguagePreference,
): CoachLanguage {
  return preference ?? defaultCoachLanguage(level);
}

const SPANISH_POLICY = `LANGUAGE OF YOUR REPLIES:
Write your prose in SPANISH. The student is an early learner, and an
explanation they cannot decode teaches nothing.
The English you are teaching stays in English and is never translated inline:
example sentences, model answers, and the words or phrases under discussion.
Quote that English as-is, then explain it in Spanish.
Never mix the two mid-sentence beyond quoting the English being taught.`;

const ENGLISH_POLICY = `LANGUAGE OF YOUR REPLIES:
Write your prose in ENGLISH, pitched at the student's level — short sentences,
concrete words, no idioms they have not met. The student can translate any
message on demand, so do not pre-translate or append a Spanish gloss.
Switch to Spanish for one sentence ONLY if the student writes to you in Spanish
because they are stuck, then return to English.`;

/**
 * The prose-language rule for the system prompt. Card metadata (`rule`,
 * `meaning`, `concept.title`) stays Spanish at every level — those are
 * reference labels the learner scans later, not conversation — and those
 * instructions live with the tool contracts in `prompts.ts`.
 */
export function languagePolicyBlock(language: CoachLanguage): string {
  return language === "es" ? SPANISH_POLICY : ENGLISH_POLICY;
}
