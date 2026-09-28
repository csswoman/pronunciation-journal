import { z } from 'zod'

/** Forma que debe devolver el modelo. Exportado para poder testearlo solo. */
export const GeneratedScriptSchema = z.object({
  script: z.array(z.object({
    speaker: z.enum(['coach', 'learner']),
    text: z.string().min(1).max(300),
  })).min(2).max(12),
}).strict()

/**
 * Every item ships its own answer key: 3–5 accepted answers let the client
 * grade most attempts without a request (Plan 037 C3). The schema travels to
 * Gemini as `responseJsonSchema`, so the bounds are enforced while decoding.
 */
export const GenerateTransformationsResponseSchema = z.object({
  exercises: z.array(z.object({
    sourceSentence: z.string().min(4).max(300),
    instruction: z.string().min(3).max(300),
    referenceAnswer: z.string().min(4).max(300),
    acceptedAnswers: z.array(z.string().min(4).max(300)).min(3).max(5),
  }).strict()).min(1).max(5),
}).strict()

/**
 * Every item ships its own answer key: 3–5 accepted answers let the client
 * grade most attempts without a request (Plan 037 C3). The schema travels to
 * Gemini as `responseJsonSchema`, so the bounds are enforced while decoding.
 */
export const GenerateTranslationsResponseSchema = z.object({
    exercises: z.array(z.object({
        sourceEs: z.string().min(2).max(300),
        referenceEn: z.string().min(2).max(300),
        acceptedAnswers: z.array(z.string().min(2).max(300)).min(3).max(5),
    }).strict()).min(1).max(5),
}).strict()
