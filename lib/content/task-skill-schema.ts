import { z } from 'zod'

/** Explicit authored attribution; exercise format never supplies a default. */
export const TaskSkillSchema = z.enum([
  'speaking', 'vocabulary', 'grammar', 'pronunciation', 'listening', 'reading', 'writing',
])
