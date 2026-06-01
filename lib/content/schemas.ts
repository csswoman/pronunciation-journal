// Zod schemas for authored static content (lessons + mini-lessons).
// These replace the compile-time types previously inlined in
// lib/lesson-content.ts and lib/mini-lessons.ts. Since the content now
// lives as JSON outside the JS bundle, Zod validates it at runtime instead.

import { z } from "zod";

export const LESSON_LEVELS = ["basic", "intermediate", "advanced"] as const;

export const LESSON_CATEGORIES = [
  "pronunciation",
  "grammar",
  "vocabulary",
  "listening",
  "speaking",
  "writing",
  "idioms",
  "collocations",
] as const;

const LessonLevelSchema = z.enum(LESSON_LEVELS);
const LessonCategorySchema = z.enum(LESSON_CATEGORIES);

// ─── Mini-lesson (card-level metadata + short body) ──────────────────────────

const MiniLessonExampleSchema = z.object({
  word: z.string(),
  ipa: z.string().optional(),
  translation: z.string().optional(),
});

export const MiniLessonSchema = z.object({
  id: z.number().int(),
  slug: z.string().min(1),
  level: LessonLevelSchema,
  category: LessonCategorySchema,
  duration: z.number(), // minutes
  title: z.string(),
  subtitle: z.string(),
  body: z.string(),
  examples: z.array(MiniLessonExampleSchema),
  tip: z.string().optional(),
  href: z.string(),
});

// ─── Lesson content (full detail page: sections, exercises, quiz) ────────────

const LessonSectionSchema = z.object({
  heading: z.string(),
  body: z.string(), // supports markdown-ish: **bold**, *italic*, `code`
});

const LessonExampleSchema = z.object({
  english: z.string(),
  ipa: z.string().optional(),
  translation: z.string().optional(),
  note: z.string().optional(),
});

const LessonExerciseSchema = z.object({
  instruction: z.string(),
  items: z.array(z.string()),
  answers: z.array(z.string()).optional(),
});

const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correct: z.number().int(), // index of correct option
  explanation: z.string(),
});

export const LessonContentSchema = z.object({
  slug: z.string().min(1),
  sections: z.array(LessonSectionSchema),
  examples: z.array(LessonExampleSchema),
  exercises: z.array(LessonExerciseSchema),
  quiz: z.array(QuizQuestionSchema),
});

// ─── Language concept (discovery card, rotated daily) ────────────────────────

export const CONCEPT_CATEGORIES = [
  "curiosidad",
  "etimología",
  "historia",
  "vocabulario",
  "lingüística",
  "cultura",
  "estilo",
  "pronunciación",
  "gramática",
  "ortografía",
] as const;

export const CONCEPT_LEVELS = ["a1", "a2", "b1", "b2", "c1"] as const;

export const LanguageConceptSchema = z.object({
  id: z.string().min(1),
  category: z.enum(CONCEPT_CATEGORIES),
  level: z.enum(CONCEPT_LEVELS),
  badge: z.string(),
  title: z.string(),
  description: z.string(),
  footer: z.string(),
  href: z.string(),
});

// ─── Inferred types (replace the old hand-written interfaces) ────────────────

export type LessonLevel = z.infer<typeof LessonLevelSchema>;
export type LessonCategory = z.infer<typeof LessonCategorySchema>;
export type MiniLessonExample = z.infer<typeof MiniLessonExampleSchema>;
export type MiniLesson = z.infer<typeof MiniLessonSchema>;
export type LessonSection = z.infer<typeof LessonSectionSchema>;
export type LessonExample = z.infer<typeof LessonExampleSchema>;
export type LessonExercise = z.infer<typeof LessonExerciseSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type LessonContent = z.infer<typeof LessonContentSchema>;
export type LanguageConcept = z.infer<typeof LanguageConceptSchema>;
