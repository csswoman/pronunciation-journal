import { z } from 'zod'
import {
  expandTemplate,
  matchAnswer,
  normalize,
  type AnswerSpec,
} from '@/lib/exercises/answer-match'
import {
  STRUCTURE_CHECKS,
  checkStructures,
  type StructureCheckId,
} from '@/lib/exercises/structure-checks'
import { DRILL_PROFILES, type DrillLevel } from '@/lib/exercises/grammar-drill/profiles'

const LEVEL_RANK: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }

const isStructureCheckId = (val: string): val is StructureCheckId => val in STRUCTURE_CHECKS

const StructureCheckIdSchema = z.string().refine(isStructureCheckId, {
  message: 'Id de comprobación de estructura no registrado',
})

const CommonWrongSchema = z.object({
  answer: z.string().min(1),
  feedback: z.string().min(1),
})

export const DrillTransformItemSchema = z.object({
  source: z.string().min(1),
  instruction: z.string().min(1),
  accept: z.array(z.string().min(1)).min(1),
  contractions: z.enum(['equivalent', 'require', 'forbid']).optional(),
  mustInclude: z.array(z.string().min(1)).optional(),
  requires: z.array(StructureCheckIdSchema).optional(),
  commonWrong: z.array(CommonWrongSchema).optional(),
  explanation: z.string().optional(),
})

export const DrillBuildItemSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('reorder'),
    accept: z.array(z.string().min(1)).min(1),
    chunks: z.array(z.string().min(1)).optional(),
  }),
  z.object({
    kind: z.literal('combine'),
    sources: z.array(z.string().min(1)).min(2),
    connector: z.string().optional(),
    accept: z.array(z.string().min(1)).min(1),
    requires: z.array(StructureCheckIdSchema).optional(),
  }),
])

export const DrillCorrectItemSchema = z.object({
  sentence: z.string().min(1),
  alreadyCorrect: z.boolean().optional(),
  accept: z.array(z.string().min(1)).min(1),
  explanation: z.string().optional(),
  commonWrong: z.array(CommonWrongSchema).optional(),
})

export const DrillPersonalizeItemSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('frame'),
    frame: z.string().min(1),
    slot: z.enum(['number', 'word', 'phrase']),
    requires: z.array(StructureCheckIdSchema).optional(),
    hintEs: z.string().optional(),
    example: z.string().optional(),
  }),
  z.object({
    mode: z.literal('open'),
    promptEs: z.string().min(1),
    starter: z.string().optional(),
    requires: z.array(StructureCheckIdSchema).min(1),
    minWords: z.number().int().positive(),
    maxWords: z.number().int().positive(),
    hintEs: z.string().optional(),
    example: z.string().optional(),
  }),
])

export type DrillTransformItem = z.infer<typeof DrillTransformItemSchema>
export type DrillBuildItem = z.infer<typeof DrillBuildItemSchema>
export type DrillCorrectItem = z.infer<typeof DrillCorrectItemSchema>
export type DrillPersonalizeItem = z.infer<typeof DrillPersonalizeItemSchema>

function getExpansions(patterns: string[], ctx: z.RefinementCtx, path: (string | number)[]): string[] {
  const result: string[] = []
  for (let i = 0; i < patterns.length; i++) {
    try {
      const exp = expandTemplate(patterns[i])
      if (exp.length > 64) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Plantilla excede 64 expansiones: ${patterns[i]}`, path: [...path, i] })
      }
      result.push(...exp)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Plantilla excede 64 expansiones o es inválida: ${msg}`, path: [...path, i] })
    }
  }
  return result
}

function checkMinLevels(requires: StructureCheckId[] | undefined, level: DrillLevel, ctx: z.RefinementCtx, path: (string | number)[]) {
  if (!requires) return
  for (const id of requires) {
    const check = STRUCTURE_CHECKS[id]
    if (check && LEVEL_RANK[check.minLevel] > LEVEL_RANK[level]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Estructura ${id} (${check.minLevel}) excede el nivel del drill (${level})`, path })
    }
  }
}

function safeMatchAnswer(answer: string, spec: AnswerSpec) {
  try {
    return matchAnswer(answer, spec)
  } catch {
    return null
  }
}

export const GrammarDrillSchema = z.object({
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  reviewed: z.boolean(),
  transform: z.array(DrillTransformItemSchema).optional(),
  build: z.array(DrillBuildItemSchema).optional(),
  correct: z.array(DrillCorrectItemSchema).optional(),
  personalize: z.array(DrillPersonalizeItemSchema).optional(),
}).superRefine((drill, ctx) => {
  const profile = DRILL_PROFILES[drill.level]
  const techniques = [
    { name: 'transform', items: drill.transform },
    { name: 'build', items: drill.build },
    { name: 'correct', items: drill.correct },
    { name: 'personalize', items: drill.personalize },
  ] as const

  // Regla 1: 3 a 5 items por técnica
  for (const { name, items } of techniques) {
    if (items && (items.length < 3 || items.length > 5)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Técnica ${name} debe tener entre 3 y 5 ítems`, path: [name] })
    }
  }

  // Regla Transform
  drill.transform?.forEach((item, idx) => {
    const expansions = getExpansions(item.accept, ctx, ['transform', idx, 'accept'])
    checkMinLevels(item.requires, drill.level, ctx, ['transform', idx, 'requires'])
    if (item.mustInclude) {
      for (const word of item.mustInclude) {
        const missing = expansions.find((exp) => !normalize(exp).split(' ').includes(normalize(word)))
        if (missing) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `mustInclude "${word}" falta en expansión "${missing}"`, path: ['transform', idx] })
      }
    }
    const spec: AnswerSpec = { accept: item.accept, contractions: item.contractions, mustInclude: item.mustInclude }
    const match = safeMatchAnswer(item.source, spec)
    if (match && (match.kind === 'exact' || match.kind === 'variant' || match.kind === 'typo')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La oración original no puede ser una respuesta válida de transformación', path: ['transform', idx, 'source'] })
    }
    item.commonWrong?.forEach((cw, cIdx) => {
      if (expansions.some((exp) => normalize(exp) === normalize(cw.answer))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `commonWrong coincide con expansión aceptada: ${cw.answer}`, path: ['transform', idx, 'commonWrong', cIdx] })
      }
    })
    if (item.requires && item.requires.length > 0) {
      for (const exp of expansions) {
        const { ok } = checkStructures(exp, item.requires)
        if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Expansión "${exp}" no cumple las estructuras requeridas`, path: ['transform', idx] })
      }
    }
  })

  // Regla Build
  drill.build?.forEach((item, idx) => {
    const expansions = getExpansions(item.accept, ctx, ['build', idx, 'accept'])
    if (item.kind === 'combine') {
      if (profile.buildMode === 'reorder') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Técnica combine no permitida en nivel ${drill.level}`, path: ['build', idx] })
      }
      checkMinLevels(item.requires, drill.level, ctx, ['build', idx, 'requires'])
      if (item.requires && item.requires.length > 0) {
        for (const exp of expansions) {
          const { ok } = checkStructures(exp, item.requires)
          if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Expansión "${exp}" no cumple las estructuras requeridas`, path: ['build', idx] })
        }
      }
    } else if (item.kind === 'reorder') {
      if (expansions.length > 1) {
        const firstBag = normalize(expansions[0]).split(' ').sort().join('|')
        for (let i = 1; i < expansions.length; i++) {
          const bag = normalize(expansions[i]).split(' ').sort().join('|')
          if (bag !== firstBag) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Todas las expansiones de reorder deben usar el mismo multiconjunto de tokens', path: ['build', idx, 'accept', i] })
          }
        }
      }
    }
  })

  // Regla Correct
  if (drill.correct) {
    let alreadyCorrectCount = 0
    drill.correct.forEach((item, idx) => {
      const expansions = getExpansions(item.accept, ctx, ['correct', idx, 'accept'])
      const spec: AnswerSpec = { accept: item.accept }
      const match = safeMatchAnswer(item.sentence, spec)
      if (item.alreadyCorrect) {
        alreadyCorrectCount++
        if (match && match.kind !== 'exact' && match.kind !== 'variant') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Oración marked alreadyCorrect no coincide con accept', path: ['correct', idx, 'sentence'] })
        }
      } else {
        if (match && match.kind !== 'no_match') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Oración errónea fue aceptada por accept', path: ['correct', idx, 'sentence'] })
        }
      }
      item.commonWrong?.forEach((cw, cIdx) => {
        if (expansions.some((exp) => normalize(exp) === normalize(cw.answer))) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `commonWrong coincide con expansión aceptada: ${cw.answer}`, path: ['correct', idx, 'commonWrong', cIdx] })
        }
      })
    })
    const expected = Math.round(drill.correct.length * profile.alreadyCorrectRatio)
    if (Math.abs(alreadyCorrectCount - expected) > 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Cantidad de alreadyCorrect (${alreadyCorrectCount}) difiere del ratio esperado (${expected}) en más de 1`, path: ['correct'] })
    }
  }

  // Regla Personalize
  drill.personalize?.forEach((item, idx) => {
    checkMinLevels(item.requires, drill.level, ctx, ['personalize', idx, 'requires'])
  })
})

export type GrammarDrill = z.infer<typeof GrammarDrillSchema>
