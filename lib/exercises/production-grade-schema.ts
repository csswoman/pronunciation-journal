import { z } from 'zod'

/** JSON contract shared by the production route and prompt evaluation. */
export const productionGradeResponseSchema = z.object({
  correct: z.boolean(),
  usedTarget: z.boolean(),
  grammaticallyCorrect: z.boolean(),
  constraintMet: z.boolean().optional(),
  feedback: z.string().max(2000),
  corrections: z.string().max(2000).optional(),
  errorPattern: z.string().max(64).optional(),
  score: z.number().min(0).max(100),
}).strict()
