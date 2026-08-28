# Plan C — Bucle de error: los fallos vuelven

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un error gramatical detectado por la IA se etiquete, se guarde y reaparezca programado a 1, 3 y 7 días en una tarea distinta — en vez de mostrarse una vez y perderse.

**Architecture:** El corrector de producción pasa a devolver una etiqueta estructurada (`errorPattern`) además del texto libre. Un módulo puro de reincidencia (`error-recurrence.ts`) mantiene una cola de patrones con sus fechas de reaparición sobre el estado que ya existe (`user_learning_state`, sincronizado por outbox — sin migración). El compositor consulta esa cola y siembra las restricciones del Plan A con los patrones vencidos.

**Tech Stack:** TypeScript, Vitest, Zod, Gemini via `/api/gemini/grade-production`, Dexie + Supabase outbox.

**Cubre el problema #4 de la auditoría.** El problema #5 (bug `written_production → reading`) **ya está arreglado** en el commit `f4676785`.

**Depende del Plan A** (usa `SpeechConstraintId` y el campo `constraint`).

---

## File Structure

| Archivo | Responsabilidad |
| - | - |
| `lib/exercises/error-patterns.ts` (nuevo) | Taxonomía cerrada de patrones de error gramatical + su restricción de reparación. |
| `lib/exercises/production-grade.ts` (modificar) | `errorPattern?: ErrorPatternId` en el resultado. |
| `lib/ai-prompts.ts` (modificar) | Pedir la etiqueta al modelo, con la lista cerrada. |
| `app/api/gemini/grade-production/route.ts` (modificar) | Validar la etiqueta con Zod; descartar valores desconocidos. |
| `lib/practice/error-recurrence.ts` (nuevo) | Cola pura de reincidencia: registrar, vencer, reprogramar. |
| `lib/ai-practice/learning-state.ts` (modificar) | Guardar la cola dentro de `UserLearningState`. |
| `components/exercises/SpokenProductionExercise.tsx` (modificar) | Registrar el patrón al recibir la corrección. |
| `lib/practice/daily-plan/composer.ts` (modificar) | Sembrar restricciones con los patrones vencidos. |

---

## Task 1: Taxonomía de patrones de error

**Files:**
- Create: `lib/exercises/error-patterns.ts`
- Test: `lib/exercises/__tests__/error-patterns.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/exercises/__tests__/error-patterns.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  ERROR_PATTERNS,
  ERROR_PATTERN_IDS,
  isErrorPatternId,
  repairConstraintFor,
  describeErrorPattern,
} from '@/lib/exercises/error-patterns'
import { constraintById } from '@/lib/exercises/speech-constraints'

describe('ERROR_PATTERNS', () => {
  it('covers the learner\'s known failure modes', () => {
    expect(ERROR_PATTERN_IDS).toContain('tense_present_for_past')
    expect(ERROR_PATTERN_IDS).toContain('present_perfect_vs_past')
    expect(ERROR_PATTERN_IDS).toContain('missing_auxiliary')
    expect(ERROR_PATTERN_IDS).toContain('word_order')
    expect(ERROR_PATTERN_IDS).toContain('preposition_choice')
  })

  it('gives every pattern a Spanish description', () => {
    for (const id of ERROR_PATTERN_IDS) {
      expect(describeErrorPattern(id).length).toBeGreaterThan(5)
    }
  })

  it('points every repair constraint at a real constraint', () => {
    for (const pattern of ERROR_PATTERNS) {
      if (!pattern.repairConstraintId) continue
      expect(
        constraintById(pattern.repairConstraintId),
        `unknown constraint for ${pattern.id}`,
      ).not.toBeNull()
    }
  })
})

describe('isErrorPatternId', () => {
  it('accepts a known id', () => {
    expect(isErrorPatternId('tense_present_for_past')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isErrorPatternId('hallucinated_label')).toBe(false)
    expect(isErrorPatternId('')).toBe(false)
    expect(isErrorPatternId(null)).toBe(false)
    expect(isErrorPatternId(42)).toBe(false)
  })
})

describe('repairConstraintFor', () => {
  it('maps a past-tense error to the past narrative drill', () => {
    expect(repairConstraintFor('tense_present_for_past')).toBe('past_simple_narrative')
  })

  it('maps a present-perfect confusion to its drill', () => {
    expect(repairConstraintFor('present_perfect_vs_past')).toBe('present_perfect_experience')
  })

  it('returns null when no drill repairs the pattern', () => {
    expect(repairConstraintFor('spelling')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/exercises/__tests__/error-patterns.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/exercises/error-patterns.ts`:

```ts
import type { SpeechConstraintId } from '@/lib/exercises/speech-constraints'

/**
 * Closed taxonomy of production error patterns.
 *
 * Closed on purpose: the label comes from an LLM, and an open string would
 * let hallucinated categories accumulate in the learner's state forever.
 * Anything outside this list is discarded at the API boundary.
 */
export type ErrorPatternId =
  | 'tense_present_for_past'
  | 'present_perfect_vs_past'
  | 'missing_auxiliary'
  | 'subject_verb_agreement'
  | 'word_order'
  | 'preposition_choice'
  | 'article_use'
  | 'plural_countable'
  | 'modal_form'
  | 'conditional_form'
  | 'gerund_infinitive'
  | 'comparative_form'
  | 'negation_form'
  | 'question_form'
  | 'vocabulary_choice'
  | 'spelling'

export interface ErrorPattern {
  id: ErrorPatternId
  /** Shown to the learner, in Spanish. */
  description: string
  /** Drill that rehearses the structure this error breaks, when one applies. */
  repairConstraintId: SpeechConstraintId | null
}

export const ERROR_PATTERNS: readonly ErrorPattern[] = [
  {
    id: 'tense_present_for_past',
    description: 'Usaste presente donde hacía falta pasado',
    repairConstraintId: 'past_simple_narrative',
  },
  {
    id: 'present_perfect_vs_past',
    description: 'Confundiste present perfect con past simple',
    repairConstraintId: 'present_perfect_experience',
  },
  {
    id: 'missing_auxiliary',
    description: 'Faltó el auxiliar (do/does/did/have/be)',
    repairConstraintId: 'question_form',
  },
  {
    id: 'subject_verb_agreement',
    description: 'El verbo no concuerda con el sujeto',
    repairConstraintId: null,
  },
  {
    id: 'word_order',
    description: 'El orden de las palabras no es el inglés natural',
    repairConstraintId: null,
  },
  {
    id: 'preposition_choice',
    description: 'Preposición equivocada',
    repairConstraintId: null,
  },
  {
    id: 'article_use',
    description: 'Uso incorrecto de a / an / the (o falta de artículo)',
    repairConstraintId: null,
  },
  {
    id: 'plural_countable',
    description: 'Problema con plurales o incontables',
    repairConstraintId: 'quantity_frequency',
  },
  {
    id: 'modal_form',
    description: 'Forma incorrecta tras un modal',
    repairConstraintId: 'justify_decision',
  },
  {
    id: 'conditional_form',
    description: 'La estructura condicional no está completa',
    repairConstraintId: 'second_conditional',
  },
  {
    id: 'gerund_infinitive',
    description: 'Gerundio donde iba infinitivo, o al revés',
    repairConstraintId: null,
  },
  {
    id: 'comparative_form',
    description: 'Comparativo o superlativo mal formado',
    repairConstraintId: 'comparison',
  },
  {
    id: 'negation_form',
    description: 'La negación no está bien construida',
    repairConstraintId: 'negative_experience',
  },
  {
    id: 'question_form',
    description: 'La pregunta no tiene la inversión correcta',
    repairConstraintId: 'question_form',
  },
  {
    id: 'vocabulary_choice',
    description: 'La palabra elegida no es la natural aquí',
    repairConstraintId: null,
  },
  {
    id: 'spelling',
    description: 'Error de ortografía',
    repairConstraintId: null,
  },
]

export const ERROR_PATTERN_IDS: readonly ErrorPatternId[] = ERROR_PATTERNS.map((p) => p.id)

export function isErrorPatternId(value: unknown): value is ErrorPatternId {
  return typeof value === 'string' && ERROR_PATTERN_IDS.includes(value as ErrorPatternId)
}

export function describeErrorPattern(id: ErrorPatternId): string {
  return ERROR_PATTERNS.find((p) => p.id === id)?.description ?? 'Error de producción'
}

export function repairConstraintFor(id: ErrorPatternId): SpeechConstraintId | null {
  return ERROR_PATTERNS.find((p) => p.id === id)?.repairConstraintId ?? null
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/exercises/__tests__/error-patterns.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/exercises/error-patterns.ts lib/exercises/__tests__/error-patterns.test.ts
git commit -m "feat(exercises): add closed taxonomy of production error patterns"
```

---

## Task 2: El corrector devuelve la etiqueta

**Files:**
- Modify: `lib/exercises/production-grade.ts`
- Modify: `lib/ai-prompts.ts` (`GRADE_PRODUCTION_SYSTEM_PROMPT`)
- Modify: `app/api/gemini/grade-production/route.ts`
- Test: `app/api/gemini/grade-production/__tests__/error-pattern.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/api/gemini/grade-production/__tests__/error-pattern.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { GRADE_PRODUCTION_SYSTEM_PROMPT } from '@/lib/ai-prompts'
import { ERROR_PATTERN_IDS } from '@/lib/exercises/error-patterns'

describe('grade production prompt: error pattern', () => {
  it('asks for an errorPattern label', () => {
    expect(GRADE_PRODUCTION_SYSTEM_PROMPT).toContain('errorPattern')
  })

  it('lists every allowed pattern id so the model cannot invent one', () => {
    for (const id of ERROR_PATTERN_IDS) {
      expect(GRADE_PRODUCTION_SYSTEM_PROMPT, `missing ${id}`).toContain(id)
    }
  })

  it('declares errorPattern in the JSON shape', () => {
    expect(GRADE_PRODUCTION_SYSTEM_PROMPT).toContain('"errorPattern"')
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run app/api/gemini/grade-production/__tests__/error-pattern.test.ts`
Expected: FAIL — prompt has no `errorPattern`.

- [ ] **Step 3: Extend the result shape**

In `lib/exercises/production-grade.ts`, add to `ProductionGradeResult`, after `constraintMet`:

```ts
  /**
   * Structured label for the main error, when the response was not correct.
   * Drives scheduled recurrence — see lib/practice/error-recurrence.ts.
   */
  errorPattern?: ErrorPatternId
```

with the import at the top:

```ts
import type { ErrorPatternId } from './error-patterns'
```

- [ ] **Step 4: Extend the prompt**

In `lib/ai-prompts.ts`, add a rule 8 to `GRADE_PRODUCTION_SYSTEM_PROMPT` (immediately before the `Return ONLY valid JSON` line), and update the JSON shape line:

```ts
8. errorPattern — When correct is false, classify the SINGLE most important error using EXACTLY one of these ids (never invent one; omit the field when correct is true):
tense_present_for_past, present_perfect_vs_past, missing_auxiliary, subject_verb_agreement, word_order, preposition_choice, article_use, plural_countable, modal_form, conditional_form, gerund_infinitive, comparative_form, negation_form, question_form, vocabulary_choice, spelling

Return ONLY valid JSON, no markdown:
{"correct":boolean,"usedTarget":boolean,"grammaticallyCorrect":boolean,"constraintMet":boolean,"feedback":"...","corrections":"...","errorPattern":"...","score":number}`;
```

Keep the rest of the rubric exactly as the Plan A task left it.

- [ ] **Step 5: Validate at the boundary**

In `app/api/gemini/grade-production/route.ts`, add to `GradeResponseSchema`:

```ts
  errorPattern: z.string().max(64).optional(),
```

Then harden `parseGradeJson` — an unknown label must be dropped, not stored:

```ts
function parseGradeJson(raw: string): ProductionGradeResult {
  const parsed = parseGeminiJson(raw, (json) => GradeResponseSchema.parse(json));
  const constraintMet = parsed.constraintMet ?? true;
  const correct = parsed.correct && constraintMet;
  return {
    ...parsed,
    constraintMet,
    correct,
    // Discard hallucinated labels rather than letting them pollute the
    // learner's recurrence queue. Also drop it entirely when the answer
    // was correct — there is no error to schedule.
    errorPattern:
      !correct && isErrorPatternId(parsed.errorPattern) ? parsed.errorPattern : undefined,
    score: Math.round(parsed.score),
  };
}
```

with the import:

```ts
import { isErrorPatternId } from "@/lib/exercises/error-patterns";
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npx vitest run app/api/gemini/grade-production/__tests__/ && npx tsc --noEmit`
Expected: PASS and exit 0.

- [ ] **Step 7: Commit**

```bash
git add lib/exercises/production-grade.ts lib/ai-prompts.ts app/api/gemini/grade-production/route.ts app/api/gemini/grade-production/__tests__/error-pattern.test.ts
git commit -m "feat(grading): return a validated structured error pattern"
```

---

## Task 3: Cola de reincidencia

**Files:**
- Create: `lib/practice/error-recurrence.ts`
- Test: `lib/practice/__tests__/error-recurrence.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/practice/__tests__/error-recurrence.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  recordErrorPattern,
  duePatterns,
  markPatternRehearsed,
  RECURRENCE_INTERVALS_DAYS,
  type ErrorRecurrenceQueue,
} from '@/lib/practice/error-recurrence'

const T0 = new Date('2026-08-24T10:00:00.000Z').getTime()
const DAY = 86_400_000

const empty: ErrorRecurrenceQueue = { entries: [] }

describe('recordErrorPattern', () => {
  it('schedules a new pattern one day out', () => {
    const q = recordErrorPattern(empty, 'tense_present_for_past', T0)
    expect(q.entries).toHaveLength(1)
    expect(q.entries[0]!.stage).toBe(0)
    expect(q.entries[0]!.dueAt).toBe(T0 + RECURRENCE_INTERVALS_DAYS[0]! * DAY)
  })

  it('uses 1, 3 and 7 day intervals', () => {
    expect(RECURRENCE_INTERVALS_DAYS).toEqual([1, 3, 7])
  })

  it('resets an existing pattern to stage 0 when it fails again', () => {
    let q = recordErrorPattern(empty, 'word_order', T0)
    q = markPatternRehearsed(q, 'word_order', true, T0 + DAY)   // advance to stage 1
    q = recordErrorPattern(q, 'word_order', T0 + 2 * DAY)       // fails again
    expect(q.entries).toHaveLength(1)
    expect(q.entries[0]!.stage).toBe(0)
    expect(q.entries[0]!.failCount).toBe(2)
  })

  it('keeps distinct patterns separate', () => {
    let q = recordErrorPattern(empty, 'word_order', T0)
    q = recordErrorPattern(q, 'article_use', T0)
    expect(q.entries).toHaveLength(2)
  })
})

describe('duePatterns', () => {
  it('returns nothing before the due date', () => {
    const q = recordErrorPattern(empty, 'word_order', T0)
    expect(duePatterns(q, T0 + DAY / 2)).toEqual([])
  })

  it('returns the pattern once due', () => {
    const q = recordErrorPattern(empty, 'word_order', T0)
    expect(duePatterns(q, T0 + DAY + 1000)).toEqual(['word_order'])
  })

  it('orders the most-failed pattern first', () => {
    let q = recordErrorPattern(empty, 'article_use', T0)
    q = recordErrorPattern(q, 'word_order', T0)
    q = recordErrorPattern(q, 'word_order', T0) // failed twice
    const due = duePatterns(q, T0 + 2 * DAY)
    expect(due[0]).toBe('word_order')
  })

  it('caps the number returned', () => {
    let q = empty
    for (const id of ['word_order', 'article_use', 'spelling', 'modal_form'] as const) {
      q = recordErrorPattern(q, id, T0)
    }
    expect(duePatterns(q, T0 + 2 * DAY, 2)).toHaveLength(2)
  })
})

describe('markPatternRehearsed', () => {
  it('advances the stage on success', () => {
    let q = recordErrorPattern(empty, 'word_order', T0)
    q = markPatternRehearsed(q, 'word_order', true, T0 + DAY)
    expect(q.entries[0]!.stage).toBe(1)
    expect(q.entries[0]!.dueAt).toBe(T0 + DAY + RECURRENCE_INTERVALS_DAYS[1]! * DAY)
  })

  it('retires the pattern after the final stage', () => {
    let q = recordErrorPattern(empty, 'word_order', T0)
    q = markPatternRehearsed(q, 'word_order', true, T0 + DAY)      // stage 1
    q = markPatternRehearsed(q, 'word_order', true, T0 + 4 * DAY)  // stage 2
    q = markPatternRehearsed(q, 'word_order', true, T0 + 11 * DAY) // retired
    expect(q.entries).toHaveLength(0)
  })

  it('sends the pattern back to stage 0 on failure', () => {
    let q = recordErrorPattern(empty, 'word_order', T0)
    q = markPatternRehearsed(q, 'word_order', true, T0 + DAY)
    q = markPatternRehearsed(q, 'word_order', false, T0 + 4 * DAY)
    expect(q.entries[0]!.stage).toBe(0)
  })

  it('ignores a pattern that is not queued', () => {
    expect(markPatternRehearsed(empty, 'word_order', true, T0)).toEqual(empty)
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/practice/__tests__/error-recurrence.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/practice/error-recurrence.ts`:

```ts
import type { ErrorPatternId } from '@/lib/exercises/error-patterns'

/**
 * Spaced recurrence for production error patterns.
 *
 * Separate from the word/sound SRS on purpose: this schedules a *pattern*
 * (the learner's recurring mistake), not an item, and it is satisfied by any
 * exercise that rehearses the structure — which is what makes the error come
 * back in a different task instead of the same one.
 *
 * Pure module: no I/O, no clock. Callers pass `now`.
 */

/** Days from a failure to each successive rehearsal. */
export const RECURRENCE_INTERVALS_DAYS: readonly number[] = [1, 3, 7]

const DAY_MS = 86_400_000

export interface ErrorRecurrenceEntry {
  patternId: ErrorPatternId
  /** Index into RECURRENCE_INTERVALS_DAYS. */
  stage: number
  /** Epoch ms when this pattern should be rehearsed again. */
  dueAt: number
  /** Total times the learner has produced this error. */
  failCount: number
  lastFailedAt: number
}

export interface ErrorRecurrenceQueue {
  entries: ErrorRecurrenceEntry[]
}

export const EMPTY_RECURRENCE_QUEUE: ErrorRecurrenceQueue = { entries: [] }

/** Record a fresh failure: resets the pattern to the shortest interval. */
export function recordErrorPattern(
  queue: ErrorRecurrenceQueue,
  patternId: ErrorPatternId,
  now: number,
): ErrorRecurrenceQueue {
  const existing = queue.entries.find((e) => e.patternId === patternId)
  const entry: ErrorRecurrenceEntry = {
    patternId,
    stage: 0,
    dueAt: now + RECURRENCE_INTERVALS_DAYS[0]! * DAY_MS,
    failCount: (existing?.failCount ?? 0) + 1,
    lastFailedAt: now,
  }
  return {
    entries: [...queue.entries.filter((e) => e.patternId !== patternId), entry],
  }
}

/** Patterns whose rehearsal is due, most-failed first. */
export function duePatterns(
  queue: ErrorRecurrenceQueue,
  now: number,
  limit = 3,
): ErrorPatternId[] {
  return queue.entries
    .filter((e) => e.dueAt <= now)
    .sort((a, b) => b.failCount - a.failCount || a.dueAt - b.dueAt)
    .slice(0, limit)
    .map((e) => e.patternId)
}

/**
 * Report the outcome of a rehearsal.
 * Success advances the interval; the last stage retires the pattern.
 * Failure sends it back to the start.
 */
export function markPatternRehearsed(
  queue: ErrorRecurrenceQueue,
  patternId: ErrorPatternId,
  success: boolean,
  now: number,
): ErrorRecurrenceQueue {
  const existing = queue.entries.find((e) => e.patternId === patternId)
  if (!existing) return queue

  const others = queue.entries.filter((e) => e.patternId !== patternId)

  if (!success) {
    return {
      entries: [
        ...others,
        {
          ...existing,
          stage: 0,
          dueAt: now + RECURRENCE_INTERVALS_DAYS[0]! * DAY_MS,
          failCount: existing.failCount + 1,
          lastFailedAt: now,
        },
      ],
    }
  }

  const nextStage = existing.stage + 1
  // Cleared the final interval — the pattern is considered repaired.
  if (nextStage >= RECURRENCE_INTERVALS_DAYS.length) {
    return { entries: others }
  }

  return {
    entries: [
      ...others,
      {
        ...existing,
        stage: nextStage,
        dueAt: now + RECURRENCE_INTERVALS_DAYS[nextStage]! * DAY_MS,
      },
    ],
  }
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/practice/__tests__/error-recurrence.test.ts`
Expected: PASS — 13 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/practice/error-recurrence.ts lib/practice/__tests__/error-recurrence.test.ts
git commit -m "feat(practice): add spaced recurrence queue for error patterns"
```

---

## Task 4: Persistir la cola en el estado de aprendizaje

**Files:**
- Modify: `lib/ai-practice/learning-state.ts` (`UserLearningState`, `createEmptyState`, `applyExerciseResult`)
- Test: `lib/ai-practice/__tests__/learning-state-recurrence.test.ts`

**Contexto:** `user_learning_state` ya se sincroniza vía outbox (`lib/ai-practice/queries.ts:78`) y se lee en servidor (`lib/ai-practice/server-state.ts`). La cola viaja dentro de ese JSON — **no hace falta migración**.

- [ ] **Step 1: Write the failing test**

Create `lib/ai-practice/__tests__/learning-state-recurrence.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  applyProductionGrade,
} from '@/lib/ai-practice/learning-state'
import { duePatterns } from '@/lib/practice/error-recurrence'

const T0 = new Date('2026-08-24T10:00:00.000Z').getTime()
const DAY = 86_400_000

describe('createEmptyState', () => {
  it('starts with an empty recurrence queue', () => {
    expect(createEmptyState('u1', 'd1').errorRecurrence).toEqual({ entries: [] })
  })
})

describe('applyProductionGrade', () => {
  it('queues the pattern when the learner fails', () => {
    const state = applyProductionGrade(
      createEmptyState('u1', 'd1'),
      { correct: false, errorPattern: 'tense_present_for_past' },
      T0,
    )
    expect(state.errorRecurrence.entries).toHaveLength(1)
    expect(duePatterns(state.errorRecurrence, T0 + 2 * DAY)).toEqual(['tense_present_for_past'])
  })

  it('does nothing when there is no pattern', () => {
    const state = applyProductionGrade(
      createEmptyState('u1', 'd1'),
      { correct: false },
      T0,
    )
    expect(state.errorRecurrence.entries).toEqual([])
  })

  it('advances a queued pattern when the learner gets it right', () => {
    let state = applyProductionGrade(
      createEmptyState('u1', 'd1'),
      { correct: false, errorPattern: 'word_order' },
      T0,
    )
    state = applyProductionGrade(
      state,
      { correct: true, rehearsedPattern: 'word_order' },
      T0 + DAY,
    )
    expect(state.errorRecurrence.entries[0]!.stage).toBe(1)
  })

  it('tolerates state saved before this field existed', () => {
    const legacy = { ...createEmptyState('u1', 'd1') }
    delete (legacy as { errorRecurrence?: unknown }).errorRecurrence
    const state = applyProductionGrade(
      legacy as ReturnType<typeof createEmptyState>,
      { correct: false, errorPattern: 'spelling' },
      T0,
    )
    expect(state.errorRecurrence.entries).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/ai-practice/__tests__/learning-state-recurrence.test.ts`
Expected: FAIL — `applyProductionGrade` is not exported.

- [ ] **Step 3: Extend the state**

In `lib/ai-practice/learning-state.ts`, add the imports:

```ts
import {
  EMPTY_RECURRENCE_QUEUE,
  markPatternRehearsed,
  recordErrorPattern,
  type ErrorRecurrenceQueue,
} from '@/lib/practice/error-recurrence'
import type { ErrorPatternId } from '@/lib/exercises/error-patterns'
```

Add the field to `interface UserLearningState`:

```ts
  /** Scheduled re-exposure for production error patterns. */
  errorRecurrence: ErrorRecurrenceQueue
```

In `createEmptyState`, add to the returned object:

```ts
    errorRecurrence: EMPTY_RECURRENCE_QUEUE,
```

Then append the new reducer at the end of the file:

```ts
export interface ProductionGradeEvent {
  correct: boolean
  /** Pattern the grader identified, when the answer was wrong. */
  errorPattern?: ErrorPatternId
  /** Pattern this exercise was rehearsing, when it came from the queue. */
  rehearsedPattern?: ErrorPatternId
}

/**
 * Fold an AI production grade into the learner's state.
 *
 * This is the step that was missing: the grader already identified the
 * mistake, but nothing consumed it, so the same error could recur forever
 * without ever being rescheduled.
 */
export function applyProductionGrade(
  state: UserLearningState,
  event: ProductionGradeEvent,
  now: number = Date.now(),
): UserLearningState {
  // Older persisted rows predate this field.
  let queue: ErrorRecurrenceQueue = state.errorRecurrence ?? EMPTY_RECURRENCE_QUEUE

  if (event.rehearsedPattern) {
    queue = markPatternRehearsed(queue, event.rehearsedPattern, event.correct, now)
  }

  if (!event.correct && event.errorPattern) {
    queue = recordErrorPattern(queue, event.errorPattern, now)
  }

  return {
    ...state,
    updatedAt: new Date(now).toISOString(),
    errorRecurrence: queue,
  }
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run lib/ai-practice/__tests__/ && npx tsc --noEmit`
Expected: PASS and exit 0. Existing tests that build a `UserLearningState` literal now need `errorRecurrence` — prefer calling `createEmptyState()` and spreading it over hand-writing the object.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/learning-state.ts lib/ai-practice/__tests__/learning-state-recurrence.test.ts
git commit -m "feat(ai-practice): fold production grades into an error recurrence queue"
```

---

## Task 5: Registrar el error desde el ejercicio

**Files:**
- Modify: `components/exercises/SpokenProductionExercise.tsx`
- Modify: `lib/exercises/feedback.ts` (surface the pattern description)

- [ ] **Step 1: Show the pattern name in the feedback**

In `lib/exercises/feedback.ts`, find `pedagogicalFeedbackFromProductionGrade` and include the pattern description when present, so the learner sees *what kind* of mistake it was — not just the corrected sentence. Add the import:

```ts
import { describeErrorPattern } from '@/lib/exercises/error-patterns'
```

and inside that function, build the tip as:

```ts
  const patternTip = grade.errorPattern
    ? `Patrón a vigilar: ${describeErrorPattern(grade.errorPattern)}.`
    : undefined
```

then pass `patternTip` through as the feedback's `tip` when it is set (keeping the existing tip as the fallback).

- [ ] **Step 2: Persist the pattern when grading returns**

In `components/exercises/SpokenProductionExercise.tsx`, extend the `onResult` extras inside `handleContinue` so the session layer can forward the pattern:

```ts
    onResult(grade.correct, transcript, Date.now() - startMs.current, {
      score: grade.score,
      feedback: pedagogicalFeedbackFromProductionGrade(grade),
      errorPattern: grade.errorPattern,
      rehearsedPattern: exercise.constraint?.id
        ? rehearsedPatternForConstraint(exercise.constraint.id)
        : undefined,
    })
```

Add to `lib/practice/exercise-renderer/generic-registry.tsx`'s `GenericRenderExtras` type:

```ts
  /** Structured error label from AI grading, when the answer was wrong. */
  errorPattern?: ErrorPatternId
  /** Pattern this exercise was scheduled to rehearse, when applicable. */
  rehearsedPattern?: ErrorPatternId
```

And add the reverse lookup to `lib/exercises/error-patterns.ts`:

```ts
/** The pattern a given repair drill rehearses, if any. */
export function rehearsedPatternForConstraint(
  constraintId: SpeechConstraintId,
): ErrorPatternId | null {
  return ERROR_PATTERNS.find((p) => p.repairConstraintId === constraintId)?.id ?? null
}
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/exercises/SpokenProductionExercise.tsx lib/exercises/feedback.ts lib/exercises/error-patterns.ts lib/practice/exercise-renderer/generic-registry.tsx
git commit -m "feat(exercises): carry the error pattern out of production grading"
```

---

## Task 6: Sembrar el plan con los patrones vencidos

**Files:**
- Modify: `lib/practice/daily-plan/composer.ts`
- Test: `lib/practice/daily-plan/__tests__/recurrence-seeding.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/practice/daily-plan/__tests__/recurrence-seeding.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { constraintIdsForDuePatterns } from '@/lib/practice/daily-plan/composer'
import { recordErrorPattern, EMPTY_RECURRENCE_QUEUE } from '@/lib/practice/error-recurrence'

const T0 = new Date('2026-08-24T10:00:00.000Z').getTime()
const DAY = 86_400_000

describe('constraintIdsForDuePatterns', () => {
  it('returns the repair drills for due patterns', () => {
    const queue = recordErrorPattern(
      EMPTY_RECURRENCE_QUEUE, 'tense_present_for_past', T0,
    )
    expect(constraintIdsForDuePatterns(queue, T0 + 2 * DAY))
      .toContain('past_simple_narrative')
  })

  it('returns nothing before anything is due', () => {
    const queue = recordErrorPattern(EMPTY_RECURRENCE_QUEUE, 'word_order', T0)
    expect(constraintIdsForDuePatterns(queue, T0)).toEqual([])
  })

  it('skips patterns with no repair drill', () => {
    const queue = recordErrorPattern(EMPTY_RECURRENCE_QUEUE, 'spelling', T0)
    expect(constraintIdsForDuePatterns(queue, T0 + 2 * DAY)).toEqual([])
  })

  it('handles a missing queue', () => {
    expect(constraintIdsForDuePatterns(undefined, T0)).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/practice/daily-plan/__tests__/recurrence-seeding.test.ts`
Expected: FAIL — `constraintIdsForDuePatterns` is not exported.

- [ ] **Step 3: Add the selector and use it**

In `lib/practice/daily-plan/composer.ts`, add the imports:

```ts
import { duePatterns, type ErrorRecurrenceQueue } from '@/lib/practice/error-recurrence'
import { repairConstraintFor } from '@/lib/exercises/error-patterns'
import type { SpeechConstraintId } from '@/lib/exercises/speech-constraints'
```

Add the exported helper near the top of the file:

```ts
/**
 * Repair drills for the error patterns due today. Seeded into production
 * generation so a past mistake comes back as a DIFFERENT task, which is the
 * point: re-showing the identical exercise tests recall of that item, not of
 * the pattern.
 */
export function constraintIdsForDuePatterns(
  queue: ErrorRecurrenceQueue | undefined,
  now: number = Date.now(),
): SpeechConstraintId[] {
  if (!queue) return []
  return duePatterns(queue, now)
    .map(repairConstraintFor)
    .filter((id): id is SpeechConstraintId => id !== null)
}
```

Then, inside `buildDailyPlan`, right after `weakTopic` is computed, add:

```ts
  const repairConstraints = constraintIdsForDuePatterns(aiState?.errorRecurrence)
```

and pass it into the grammar step from Plan B (and into `buildWordReviewStep` if you extend that signature the same way):

```ts
  const grammarStep = await buildGrammarFocusStep(
    weakDeckSlug ?? DEFAULT_GRAMMAR_DECK,
    reviewWords,
    'daily',
    repairConstraints,
  )
```

Update `buildGrammarFocusStep` in `lib/practice/daily-plan/grammar-focus.ts` to accept and prefer them:

```ts
export async function buildGrammarFocusStep(
  deckSlug: string | null,
  words: WordBankEntry[],
  context: PracticeContext = 'daily',
  repairConstraints: readonly string[] = [],
): Promise<DailyStep | null> {
```

and inside, replace the constraint seeding with:

```ts
  const constraintId = constraintIdForDeck(deckSlug)
  // Due repairs come first: a scheduled error outranks the day's deck topic.
  const preferred = [
    ...repairConstraints,
    ...(constraintId ? [constraintId] : []),
  ]
  const { exercises: generated } = generateSpokenProductionFromWordBank(
    words,
    GRAMMAR_PRODUCTION_COUNT,
    preferred,
  )
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run lib/practice/daily-plan/__tests__/ && npx tsc --noEmit`
Expected: PASS and exit 0.

- [ ] **Step 5: Commit**

```bash
git add lib/practice/daily-plan/composer.ts lib/practice/daily-plan/grammar-focus.ts lib/practice/daily-plan/__tests__/recurrence-seeding.test.ts
git commit -m "feat(daily): seed production with due error-pattern repairs"
```

---

## Task 7: Verificación completa

- [ ] **Step 1: Full suite**

Run: `npx vitest run && npx tsc --noEmit && npx next lint`
Expected: all green, exit 0.

- [ ] **Step 2: Manual end-to-end check**

Run `pnpm dev` and verify the loop actually closes:
1. Open `/daily`, reach a spoken production item with a **Pasado** badge.
2. Answer deliberately in present simple (e.g. "I go to the kitchen").
3. Confirm it is marked incorrect and the feedback names the pattern ("Usaste presente donde hacía falta pasado").
4. In DevTools, inspect the persisted learning state and confirm `errorRecurrence.entries` contains `tense_present_for_past` with a `dueAt` about 24 h out.
5. Temporarily set that entry's `dueAt` to a past timestamp, reload `/daily`, and confirm the plan now includes a past-narrative drill.

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "test(practice): stabilize error recurrence expectations"
```

---

## Notas de riesgo

- **Fiabilidad de la etiqueta.** El modelo puede clasificar mal el error. Por eso la taxonomía es cerrada y se descarta lo desconocido, pero un `errorPattern` equivocado programará el drill equivocado. Mitigación: el intervalo más corto es 1 día y basta un acierto para avanzar, así que un falso positivo cuesta un ejercicio, no una semana.
- **Crecimiento de la cola.** No hay poda. Si la usuaria falla mucho al principio, la cola puede llegar a ~16 entradas (el tamaño de la taxonomía) — acotado, pero conviene revisar que `duePatterns(..., limit)` se llame siempre con límite en el compositor.
- **Conflictos de sincronización.** `user_learning_state` es un JSON de fila única; dos dispositivos editando a la vez hacen last-write-wins y pueden perder entradas. Es el comportamiento que ya tiene el resto del estado, así que no lo empeora — pero no lo tomes como almacenamiento autoritativo.
- **`applyExerciseResult` sigue sin conectarse al plan diario.** Este plan conecta la producción libre, no los demás ejercicios: `applyExerciseResult` solo lo llama `hooks/useStreamingChat.ts`. Conectar los ejercicios normales a `weakTopics` es trabajo aparte y merece su propio plan.
