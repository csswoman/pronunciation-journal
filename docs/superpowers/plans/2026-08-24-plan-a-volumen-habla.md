# Plan A — Volumen de habla y prompts con restricción

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pasar de 1 a 12+ emisiones habladas por sesión diaria, y hacer que cada prompt exija un tiempo verbal o función comunicativa concreta, de modo que el presente simple deje de ser siempre una respuesta válida.

**Architecture:** Se añade un módulo puro de "restricciones comunicativas" (`speech-constraints.ts`) que define pares *función × tiempo verbal* con su prompt en español y una instrucción de verificación en inglés para el corrector. `generateSpokenProductionFromWordBank` pasa a aceptar una restricción y a emitirla en el ejercicio. El corrector (`/api/gemini/grade-production`) recibe la restricción y devuelve un campo nuevo `constraintMet`; `correct` pasa a exigirlo. Finalmente el paso `word_review` sube su cuenta de producción hablada y se antepone un calentamiento de shadowing no evaluado.

**Tech Stack:** TypeScript, Vitest, Zod, Next.js route handlers, Gemini via `/api/gemini/*`.

**Cubre los problemas #1, #2 y #10 de la auditoría.**

---

## File Structure

| Archivo | Responsabilidad |
| - | - |
| `lib/exercises/speech-constraints.ts` (nuevo) | Catálogo puro de restricciones comunicativas + selector determinista. Sin I/O. |
| `lib/exercises/types.ts` (modificar) | Añadir `constraint?: SpeechConstraint` a `BaseProductionExercise`. |
| `lib/exercises/generators/production.ts` (modificar) | Generar N ejercicios hablados, cada uno con una restricción distinta. |
| `lib/exercises/production-grade.ts` (modificar) | Añadir `constraintMet` al resultado y `constraint` a la entrada. |
| `lib/ai-prompts.ts` (modificar) | Regla 3 del rúbrico: cumplimiento de la restricción. |
| `app/api/gemini/grade-production/route.ts` (modificar) | Zod: aceptar `constraint`, devolver `constraintMet`. |
| `components/exercises/SpokenProductionExercise.tsx` (modificar) | Enviar la restricción al corrector. |
| `components/exercises/ProductionTaskHeader.tsx` (modificar) | Mostrar la restricción como etiqueta visible. |
| `lib/practice/daily-plan/constants.ts` (modificar) | `SPOKEN_PRODUCTION_PER_SESSION = 12`. |
| `lib/practice/daily-plan/step-builders.ts` (modificar) | Usar la constante nueva; añadir paso de calentamiento. |
| `lib/exercises/generators/warmup.ts` (nuevo) | Generar frases de shadowing desde el word_bank. |

---

## Task 1: Catálogo de restricciones comunicativas

**Files:**
- Create: `lib/exercises/speech-constraints.ts`
- Test: `lib/exercises/__tests__/speech-constraints.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/exercises/__tests__/speech-constraints.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  SPEECH_CONSTRAINTS,
  selectConstraints,
  constraintById,
} from '@/lib/exercises/speech-constraints'

describe('SPEECH_CONSTRAINTS', () => {
  it('covers the tenses the learner avoids', () => {
    const ids = SPEECH_CONSTRAINTS.map((c) => c.id)
    expect(ids).toContain('past_simple_narrative')
    expect(ids).toContain('present_perfect_experience')
    expect(ids).toContain('future_plan')
    expect(ids).toContain('second_conditional')
    expect(ids).toContain('comparison')
    expect(ids).toContain('opinion_connector')
  })

  it('never offers a bare present-simple constraint', () => {
    // The whole point: the learner already defaults to present simple.
    const ids = SPEECH_CONSTRAINTS.map((c) => c.id)
    expect(ids).not.toContain('present_simple')
  })

  it('gives every constraint a Spanish prompt and an English check', () => {
    for (const c of SPEECH_CONSTRAINTS) {
      expect(c.promptEs('kitchen')).toContain('kitchen')
      expect(c.checkEn.length).toBeGreaterThan(10)
      expect(c.label.length).toBeGreaterThan(0)
    }
  })
})

describe('selectConstraints', () => {
  it('returns the requested count without repeating', () => {
    const picked = selectConstraints('seed-1', 5)
    expect(picked).toHaveLength(5)
    expect(new Set(picked.map((c) => c.id)).size).toBe(5)
  })

  it('is deterministic for the same seed', () => {
    expect(selectConstraints('seed-x', 4).map((c) => c.id))
      .toEqual(selectConstraints('seed-x', 4).map((c) => c.id))
  })

  it('differs across seeds', () => {
    const a = selectConstraints('seed-a', 3).map((c) => c.id).join()
    const b = selectConstraints('seed-b', 3).map((c) => c.id).join()
    expect(a).not.toBe(b)
  })

  it('caps at the catalogue size instead of repeating', () => {
    const picked = selectConstraints('seed', SPEECH_CONSTRAINTS.length + 10)
    expect(picked).toHaveLength(SPEECH_CONSTRAINTS.length)
  })

  it('can be restricted to a preferred subset', () => {
    const picked = selectConstraints('seed', 2, ['past_simple_narrative'])
    expect(picked[0]!.id).toBe('past_simple_narrative')
  })
})

describe('constraintById', () => {
  it('finds a known constraint', () => {
    expect(constraintById('past_simple_narrative')?.label).toBeTruthy()
  })

  it('returns null for an unknown id', () => {
    expect(constraintById('nope')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/exercises/__tests__/speech-constraints.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/exercises/speech-constraints"`.

- [ ] **Step 3: Write the implementation**

Create `lib/exercises/speech-constraints.ts`:

```ts
/**
 * Communicative constraints for free spoken/written production.
 *
 * Why this exists: the generic prompt "say a sentence with X" is always
 * satisfiable in present simple, so a learner who defaults to the present
 * never leaves it and still scores `correct`. Each constraint forces one
 * tense or discourse function, and ships the English instruction the grader
 * uses to verify compliance.
 */

export type SpeechConstraintId =
  | 'past_simple_narrative'
  | 'present_perfect_experience'
  | 'future_plan'
  | 'second_conditional'
  | 'comparison'
  | 'opinion_connector'
  | 'past_continuous_interrupted'
  | 'justify_decision'
  | 'problem_explanation'
  | 'negative_experience'
  | 'question_form'
  | 'quantity_frequency'

export interface SpeechConstraint {
  id: SpeechConstraintId
  /** Short badge shown to the learner, e.g. "Pasado". */
  label: string
  /** Full task prompt in Spanish. Receives the target word. */
  promptEs: (word: string) => string
  /** Instruction the grader applies to decide `constraintMet`. */
  checkEn: string
}

export const SPEECH_CONSTRAINTS: readonly SpeechConstraint[] = [
  {
    id: 'past_simple_narrative',
    label: 'Pasado',
    promptEs: (w) => `Cuenta en PASADO algo que hiciste con "${w}". Usa past simple.`,
    checkEn: 'The response must contain at least one past simple verb (e.g. went, bought, was). Present-tense-only responses fail.',
  },
  {
    id: 'present_perfect_experience',
    label: 'Present perfect',
    promptEs: (w) => `Di algo que YA HAS hecho (o nunca has hecho) con "${w}". Usa present perfect.`,
    checkEn: 'The response must use present perfect (have/has + past participle). Past simple alone fails.',
  },
  {
    id: 'future_plan',
    label: 'Planes',
    promptEs: (w) => `Habla de un PLAN futuro con "${w}". Usa "going to" o "will".`,
    checkEn: 'The response must express a future plan with "going to", "will", or present continuous for future. Present simple alone fails.',
  },
  {
    id: 'second_conditional',
    label: 'Hipótesis',
    promptEs: (w) => `Imagina algo hipotético con "${w}". Usa "If I ... , I would ...".`,
    checkEn: 'The response must contain a second conditional: an "if" clause with past simple plus a "would" main clause.',
  },
  {
    id: 'comparison',
    label: 'Comparar',
    promptEs: (w) => `Compara "${w}" con otra cosa. Usa un comparativo (more/-er ... than) o un superlativo.`,
    checkEn: 'The response must contain a comparative or superlative structure (e.g. "-er than", "more X than", "the most X").',
  },
  {
    id: 'opinion_connector',
    label: 'Opinión',
    promptEs: (w) => `Da tu OPINIÓN sobre "${w}" y justifícala con "because" o "so".`,
    checkEn: 'The response must state an opinion and justify it with a connector such as "because", "so", "although" or "however".',
  },
  {
    id: 'past_continuous_interrupted',
    label: 'Pasado continuo',
    promptEs: (w) => `Di qué ESTABAS haciendo con "${w}" cuando pasó algo. Usa "was/were + -ing" y "when".`,
    checkEn: 'The response must contain a past continuous ("was/were" + -ing), ideally interrupted by a "when" clause.',
  },
  {
    id: 'justify_decision',
    label: 'Justificar',
    promptEs: (w) => `Elige entre dos opciones relacionadas con "${w}" y explica POR QUÉ en dos frases.`,
    checkEn: 'The response must state a choice and give a reason for it. A single unjustified statement fails.',
  },
  {
    id: 'problem_explanation',
    label: 'Explicar',
    promptEs: (w) => `Explica un PROBLEMA relacionado con "${w}" y cómo lo resolverías.`,
    checkEn: 'The response must describe a problem and propose a solution. Naming the problem alone fails.',
  },
  {
    id: 'negative_experience',
    label: 'Negación',
    promptEs: (w) => `Di algo que NO hiciste o NO te gusta sobre "${w}". Usa una forma negativa.`,
    checkEn: 'The response must contain a grammatical negative form (didn\'t, don\'t, haven\'t, never, etc.).',
  },
  {
    id: 'question_form',
    label: 'Preguntar',
    promptEs: (w) => `Formula una PREGUNTA usando "${w}" para alguien que acabas de conocer.`,
    checkEn: 'The response must be a grammatical English question with correct auxiliary/subject inversion or a wh- word.',
  },
  {
    id: 'quantity_frequency',
    label: 'Frecuencia',
    promptEs: (w) => `Di CON QUÉ FRECUENCIA o CUÁNTO usas "${w}". Usa un adverbio de frecuencia o cuantificador.`,
    checkEn: 'The response must contain a frequency adverb (usually, rarely, twice a week...) or a quantifier (a lot of, a few...).',
  },
]

/** djb2 — same hashing approach as `exerciseId` in lib/exercises/utils.ts. */
function hashSeed(seed: string): number {
  let hash = 5381
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i)
  }
  return hash >>> 0
}

export function constraintById(id: string): SpeechConstraint | null {
  return SPEECH_CONSTRAINTS.find((c) => c.id === id) ?? null
}

/**
 * Deterministically pick `count` distinct constraints. `preferred` ids are
 * placed first (used later by Plan C to re-target a learner's weak patterns).
 */
export function selectConstraints(
  seed: string,
  count: number,
  preferred: readonly string[] = [],
): SpeechConstraint[] {
  const preferredList = preferred
    .map((id) => constraintById(id))
    .filter((c): c is SpeechConstraint => c !== null)

  const preferredIds = new Set(preferredList.map((c) => c.id))
  const rest = SPEECH_CONSTRAINTS.filter((c) => !preferredIds.has(c.id))

  // Deterministic rotation: start at an offset derived from the seed.
  const offset = hashSeed(seed) % (rest.length || 1)
  const rotated = [...rest.slice(offset), ...rest.slice(0, offset)]

  return [...preferredList, ...rotated].slice(0, Math.min(count, SPEECH_CONSTRAINTS.length))
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/exercises/__tests__/speech-constraints.test.ts`
Expected: PASS — 9 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/exercises/speech-constraints.ts lib/exercises/__tests__/speech-constraints.test.ts
git commit -m "feat(exercises): add communicative constraints for spoken production"
```

---

## Task 2: Llevar la restricción al tipo de ejercicio

**Files:**
- Modify: `lib/exercises/types.ts` (interface `BaseProductionExercise`)
- Test: `lib/exercises/__tests__/production-constraint.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/exercises/__tests__/production-constraint.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateSpokenProductionFromWordBank } from '@/lib/exercises/generators/production'
import type { WordBankEntry } from '@/lib/word-bank/types'

function entry(id: string, text: string): WordBankEntry {
  return {
    id,
    text,
    meaning: `significado de ${text}`,
    example: `This is a ${text} example sentence.`,
    ipa: null,
    difficulty: 3,
    source: 'word_bank',
    srs_status: 'review',
  } as unknown as WordBankEntry
}

describe('generateSpokenProductionFromWordBank with constraints', () => {
  it('attaches a constraint to every generated exercise', () => {
    const { exercises } = generateSpokenProductionFromWordBank(
      [entry('1', 'kitchen'), entry('2', 'travel')],
      2,
    )
    expect(exercises).toHaveLength(2)
    for (const ex of exercises) {
      expect(ex.constraint).toBeDefined()
      expect(ex.constraint!.id).toBeTruthy()
      expect(ex.constraint!.label).toBeTruthy()
    }
  })

  it('uses the constraint prompt instead of the generic one', () => {
    const { exercises } = generateSpokenProductionFromWordBank([entry('1', 'kitchen')], 1)
    const ex = exercises[0]!
    expect(ex.taskPrompt).toContain('kitchen')
    // The old generic prompts must be gone.
    expect(ex.taskPrompt).not.toBe('Di una oración usando "kitchen".')
  })

  it('varies constraints across a multi-exercise batch', () => {
    const entries = ['a', 'b', 'c', 'd'].map((t, i) => entry(String(i), t))
    const { exercises } = generateSpokenProductionFromWordBank(entries, 4)
    const ids = exercises.map((e) => e.constraint!.id)
    expect(new Set(ids).size).toBeGreaterThan(1)
  })

  it('generates as many exercises as requested when the pool allows', () => {
    const entries = Array.from({ length: 12 }, (_, i) => entry(String(i), `word${i}`))
    const { exercises } = generateSpokenProductionFromWordBank(entries, 12)
    expect(exercises).toHaveLength(12)
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/exercises/__tests__/production-constraint.test.ts`
Expected: FAIL — `ex.constraint` is `undefined` (property does not exist).

- [ ] **Step 3: Add the field to the type**

In `lib/exercises/types.ts`, add the import at the top of the file:

```ts
import type { SpeechConstraint } from '@/lib/exercises/speech-constraints'
```

Then, inside `interface BaseProductionExercise` (the one that already declares `taskPrompt`, `targetItem`, `targetMeaning`, `targetIpa`, `exampleSentence`), add:

```ts
  /**
   * Communicative constraint the learner must satisfy (tense or function).
   * Optional so legacy persisted exercises still typecheck.
   */
  constraint?: SpeechConstraint
```

- [ ] **Step 4: Update the generator**

In `lib/exercises/generators/production.ts`:

Replace the `SPOKEN_PROMPTS` constant and its `promptIndex` usage for spoken exercises. First add the import:

```ts
import { selectConstraints } from '@/lib/exercises/speech-constraints'
```

Delete the `SPOKEN_PROMPTS` array entirely. Then replace the whole body of `generateSpokenProductionFromWordBank` with:

```ts
export function generateSpokenProductionFromWordBank(
  entries: WordBankEntry[],
  count: number,
  preferredConstraintIds: readonly string[] = [],
): GenerationResult<SpokenProductionExercise> {
  const skipped: SkippedEntry[] = []
  const usable = entries.filter((entry) => {
    const { eligible } = assessWordBankEntry(entry, 'spoken_production')
    return eligible
  })

  const exercises: SpokenProductionExercise[] = []
  const chosen = pick(usable, count)

  // Seed from the batch so a session is stable but different day to day.
  const seed = chosen.map((e) => e.id).join('|')
  const constraints = selectConstraints(seed, chosen.length, preferredConstraintIds)

  chosen.forEach((entry, index) => {
    const assessment = assessWordBankEntry(entry, 'spoken_production')
    if (!assessment.eligible) {
      skipped.push(toSkipped(entry, assessment.reasons))
      return
    }

    // Cycle the constraint list when the batch is larger than the catalogue.
    const constraint = constraints[index % constraints.length]!

    exercises.push({
      id: exerciseId('spoken_production', entry.id, constraint.id),
      type: 'spoken_production',
      exerciseType: { domain: 'vocabulary', mode: 'speak', variant: 'sentence' },
      taskPrompt: constraint.promptEs(entry.text),
      constraint,
      ...baseFields(entry),
    })
  })

  return { exercises, skipped }
}
```

Note: `promptIndex` is still used by `generateWrittenProductionFromWordBank`, so leave that helper in place.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx vitest run lib/exercises/__tests__/production-constraint.test.ts lib/exercises/generators/__tests__/production.test.ts`
Expected: PASS. If the pre-existing `production.test.ts` asserts on the old generic prompt text, update that assertion to check `taskPrompt` contains the target word instead — the old prompts are intentionally gone.

- [ ] **Step 6: Type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add lib/exercises/types.ts lib/exercises/generators/production.ts lib/exercises/__tests__/production-constraint.test.ts lib/exercises/generators/__tests__/production.test.ts
git commit -m "feat(exercises): generate spoken production with tense constraints"
```

---

## Task 3: El corrector verifica la restricción

**Files:**
- Modify: `lib/exercises/production-grade.ts`
- Modify: `lib/ai-prompts.ts:98` (`GRADE_PRODUCTION_SYSTEM_PROMPT`, `buildGradeProductionUserPrompt`)
- Modify: `app/api/gemini/grade-production/route.ts`
- Test: `lib/exercises/__tests__/grade-production-prompt.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/exercises/__tests__/grade-production-prompt.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  GRADE_PRODUCTION_SYSTEM_PROMPT,
  buildGradeProductionUserPrompt,
} from '@/lib/ai-prompts'

describe('GRADE_PRODUCTION_SYSTEM_PROMPT', () => {
  it('documents constraintMet in the rubric', () => {
    expect(GRADE_PRODUCTION_SYSTEM_PROMPT).toContain('constraintMet')
  })

  it('requires constraintMet for a correct verdict', () => {
    expect(GRADE_PRODUCTION_SYSTEM_PROMPT).toMatch(/correct.*constraintMet/s)
  })

  it('declares constraintMet in the JSON shape', () => {
    expect(GRADE_PRODUCTION_SYSTEM_PROMPT).toContain('"constraintMet"')
  })
})

describe('buildGradeProductionUserPrompt', () => {
  it('includes the constraint check when one is supplied', () => {
    const prompt = buildGradeProductionUserPrompt({
      targetItem: 'kitchen',
      taskPrompt: 'Cuenta en PASADO algo que hiciste con "kitchen".',
      production: 'I cleaned the kitchen yesterday.',
      modality: 'spoken',
      level: 'B1',
      constraintCheck: 'The response must contain at least one past simple verb.',
    })
    expect(prompt).toContain('past simple verb')
    expect(prompt).toContain('Required constraint')
  })

  it('omits the constraint block when absent', () => {
    const prompt = buildGradeProductionUserPrompt({
      targetItem: 'kitchen',
      taskPrompt: 'Use kitchen in a sentence.',
      production: 'I have a kitchen.',
      modality: 'written',
    })
    expect(prompt).not.toContain('Required constraint')
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/exercises/__tests__/grade-production-prompt.test.ts`
Expected: FAIL — the prompt has no `constraintMet` and the builder rejects `constraintCheck`.

- [ ] **Step 3: Update the shared result shape**

In `lib/exercises/production-grade.ts`, add to `interface ProductionGradeResult`, right after `grammaticallyCorrect`:

```ts
  /**
   * The response satisfied the required communicative constraint (tense or
   * function). True when no constraint was requested.
   */
  constraintMet: boolean
```

And add to `interface GradeProductionInput`, after `level`:

```ts
  /** English instruction describing the constraint the grader must verify. */
  constraintCheck?: string
```

- [ ] **Step 4: Update the prompt**

In `lib/ai-prompts.ts`, replace `GRADE_PRODUCTION_SYSTEM_PROMPT` with:

```ts
export const GRADE_PRODUCTION_SYSTEM_PROMPT = `You are an English teacher grading a learner's original production (written or spoken, provided as text).

Evaluate strictly using this rubric:
1. usedTarget — Did the learner use the target item with correct meaning and an acceptable form (minor spelling typos in spoken transcripts are OK)?
2. grammaticallyCorrect — Is the production a grammatical English sentence/response appropriate for the learner's CEFR level (stated below; default A2–B2)? Judge leniently for lower levels; minor slips OK; broken structure = false.
3. constraintMet — If a "Required constraint" is stated below, did the response satisfy it? This is the learner's growth edge: a grammatical sentence that ignores the required tense or function is NOT acceptable, however fluent it sounds. When no constraint is stated, set this to true.
4. correct — true ONLY when usedTarget AND grammaticallyCorrect AND constraintMet are all true.
5. score — integer 0–100:
   - 90–100: constraint satisfied, target used naturally, grammar solid
   - 70–89: constraint satisfied, small grammar/word issues
   - 50–69: constraint missed but sentence otherwise fine, OR constraint met with weak grammar
   - 20–49: target missing or largely incorrect
   - 0–19: empty, off-topic, or not English
6. feedback — 1–3 short sentences in Spanish: praise what worked, then one concrete fix. When constraintMet is false, say explicitly which structure was required and show it. Be encouraging, not harsh.
7. corrections — optional improved version of their sentence that satisfies the constraint (omit if already perfect).

Return ONLY valid JSON, no markdown:
{"correct":boolean,"usedTarget":boolean,"grammaticallyCorrect":boolean,"constraintMet":boolean,"feedback":"...","corrections":"...","score":number}`;
```

Then update the builder in the same file:

```ts
export function buildGradeProductionUserPrompt(input: {
  targetItem: string
  targetMeaning?: string
  taskPrompt: string
  production: string
  modality: 'written' | 'spoken'
  level?: CEFRLevel
  constraintCheck?: string
}): string {
  const meaningLine = input.targetMeaning
    ? `\nTarget meaning: ${input.targetMeaning}`
    : '';
  const levelLine = input.level ? `\nLearner CEFR level: ${input.level}` : '';
  const constraintLine = input.constraintCheck
    ? `\nRequired constraint: ${input.constraintCheck}`
    : '';
  return `Task shown to the learner: ${input.taskPrompt}
Target item: "${input.targetItem}"${meaningLine}
Modality: ${input.modality}${levelLine}${constraintLine}

Learner production:
"""
${input.production}
"""`;
}
```

- [ ] **Step 5: Update the API route**

In `app/api/gemini/grade-production/route.ts`:

Add `constraintCheck` to `GradeProductionSchema`, after `level`:

```ts
  constraintCheck: z.string().max(400).optional(),
```

Add `constraintMet` to `GradeResponseSchema`, after `grammaticallyCorrect`:

```ts
  constraintMet: z.boolean().optional(),
```

Then make `parseGradeJson` default it to `true` for backward compatibility (an older model reply without the field must not fail the learner):

```ts
function parseGradeJson(raw: string): ProductionGradeResult {
  const parsed = parseGeminiJson(raw, (json) => GradeResponseSchema.parse(json));
  const constraintMet = parsed.constraintMet ?? true;
  return {
    ...parsed,
    constraintMet,
    // Defend the invariant in code: never report `correct` when the
    // constraint was missed, even if the model says otherwise.
    correct: parsed.correct && constraintMet,
    score: Math.round(parsed.score),
  };
}
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npx vitest run lib/exercises/__tests__/grade-production-prompt.test.ts app/api/gemini/grade-production/__tests__`
Expected: PASS. The existing route tests may construct a `ProductionGradeResult` literal — add `constraintMet: true` to those fixtures.

- [ ] **Step 7: Type check**

Run: `npx tsc --noEmit`
Expected: exit 0. If `pedagogicalFeedbackFromProductionGrade` in `lib/exercises/feedback.ts` destructures the result, it keeps compiling — the field is additive.

- [ ] **Step 8: Commit**

```bash
git add lib/exercises/production-grade.ts lib/ai-prompts.ts app/api/gemini/grade-production/route.ts lib/exercises/__tests__/grade-production-prompt.test.ts
git commit -m "feat(grading): verify communicative constraint before marking correct"
```

---

## Task 4: El cliente envía la restricción y la muestra

**Files:**
- Modify: `components/exercises/SpokenProductionExercise.tsx:88-104` (the `gradeProduction` call)
- Modify: `components/exercises/ProductionTaskHeader.tsx`
- Modify: `lib/exercises/grade-production-client.ts`

- [ ] **Step 1: Forward the constraint from the client helper**

Open `lib/exercises/grade-production-client.ts` and confirm `gradeProduction` forwards its whole input object to the route body. If it builds the body field-by-field, add `constraintCheck` to that construction. If it spreads the input (`body: JSON.stringify(input)`), no change is needed — verify with:

Run: `grep -n "constraintCheck\|JSON.stringify" lib/exercises/grade-production-client.ts`

- [ ] **Step 2: Send the constraint from the exercise component**

In `components/exercises/SpokenProductionExercise.tsx`, inside `runGrading`, change the `gradeProduction` call to:

```ts
        const result = await gradeProduction({
          targetItem: exercise.targetItem,
          targetMeaning: exercise.targetMeaning,
          taskPrompt: exercise.taskPrompt,
          production: transcript,
          modality: 'spoken',
          level: exercise.level,
          constraintCheck: exercise.constraint?.checkEn,
        })
```

- [ ] **Step 3: Show the constraint badge**

In `components/exercises/ProductionTaskHeader.tsx`, render the constraint label above the prompt. Add inside the component's returned markup, immediately before the existing `taskPrompt` text node:

```tsx
      {exercise.constraint && (
        <span className="self-start rounded-full bg-accent-subtle px-3 py-1 text-label-sm font-medium text-accent">
          {exercise.constraint.label}
        </span>
      )}
```

If `bg-accent-subtle` / `text-accent` are not the token names in `app/globals.css`, run `grep -n "accent" app/globals.css` and use the project's actual accent tokens. Do not hardcode a color.

- [ ] **Step 4: Verify the app builds and type checks**

Run: `npx tsc --noEmit && npx next lint --dir components/exercises`
Expected: exit 0, no new warnings.

- [ ] **Step 5: Commit**

```bash
git add components/exercises/SpokenProductionExercise.tsx components/exercises/ProductionTaskHeader.tsx lib/exercises/grade-production-client.ts
git commit -m "feat(exercises): send and display the spoken production constraint"
```

---

## Task 5: Subir el volumen de producción hablada

**Files:**
- Modify: `lib/practice/daily-plan/constants.ts`
- Modify: `lib/practice/daily-plan/step-builders.ts:71`
- Test: `lib/practice/daily-plan/__tests__/spoken-volume.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/practice/daily-plan/__tests__/spoken-volume.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildWordReviewStep } from '@/lib/practice/daily-plan/step-builders'
import { SPOKEN_PRODUCTION_PER_SESSION } from '@/lib/practice/daily-plan/constants'
import type { WordBankEntry } from '@/lib/word-bank/types'

function entry(i: number): WordBankEntry {
  return {
    id: `w${i}`,
    text: `word${i}`,
    meaning: `meaning ${i}`,
    example: `This is a word${i} example sentence here.`,
    ipa: null,
    difficulty: 3,
    source: 'word_bank',
    srs_status: 'review',
  } as unknown as WordBankEntry
}

describe('daily spoken production volume', () => {
  it('targets at least 12 spoken items per session', () => {
    expect(SPOKEN_PRODUCTION_PER_SESSION).toBeGreaterThanOrEqual(12)
  })

  it('builds many spoken exercises when the word pool is large', () => {
    const words = Array.from({ length: 20 }, (_, i) => entry(i))
    const step = buildWordReviewStep(words)
    expect(step).not.toBeNull()

    const spoken = step!.exercises.filter(
      (ex) => ex.payload.kind === 'generic' && ex.payload.data.type === 'spoken_production',
    )
    expect(spoken.length).toBeGreaterThanOrEqual(10)
  })

  it('still produces a step when the pool is small', () => {
    const step = buildWordReviewStep([entry(1), entry(2)])
    expect(step).not.toBeNull()
    expect(step!.exercises.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/practice/daily-plan/__tests__/spoken-volume.test.ts`
Expected: FAIL — `SPOKEN_PRODUCTION_PER_SESSION` is not exported.

- [ ] **Step 3: Add the constant**

In `lib/practice/daily-plan/constants.ts`, append:

```ts
/**
 * Spoken free-production items per daily session.
 *
 * Was effectively 1. Automating retrieval under time pressure needs volume,
 * not perfection: this is the single highest-impact number in the daily plan.
 */
export const SPOKEN_PRODUCTION_PER_SESSION = 12

/** Shadowing warm-up phrases played before the first free production. */
export const WARMUP_PHRASE_COUNT = 4
```

- [ ] **Step 4: Raise the count in the builder**

In `lib/practice/daily-plan/step-builders.ts`, add `SPOKEN_PRODUCTION_PER_SESSION` to the existing import from `./constants`, then change line 71 from:

```ts
  const spokenProduction = generateSpokenProductionFromWordBank(words, 1)
```

to:

```ts
  const spokenProduction = generateSpokenProductionFromWordBank(
    words,
    SPOKEN_PRODUCTION_PER_SESSION,
  )
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx vitest run lib/practice/daily-plan/__tests__/`
Expected: PASS. Existing daily-plan tests that assert an exact exercise count for `word_review` will now see more items — update those expectations to the new counts rather than reverting the constant.

- [ ] **Step 6: Commit**

```bash
git add lib/practice/daily-plan/constants.ts lib/practice/daily-plan/step-builders.ts lib/practice/daily-plan/__tests__/spoken-volume.test.ts
git commit -m "feat(daily): raise spoken production from 1 to 12 per session"
```

---

## Task 6: Calentamiento de shadowing antes de producir

**Files:**
- Create: `lib/exercises/generators/warmup.ts`
- Test: `lib/exercises/generators/__tests__/warmup.test.ts`
- Modify: `lib/practice/daily-plan/step-builders.ts` (prepend warm-up to `word_review`)

- [ ] **Step 1: Write the failing test**

Create `lib/exercises/generators/__tests__/warmup.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateWarmupShadowPhrases } from '@/lib/exercises/generators/warmup'
import type { WordBankEntry } from '@/lib/word-bank/types'

function entry(i: number): WordBankEntry {
  return {
    id: `w${i}`,
    text: `word${i}`,
    meaning: `meaning ${i}`,
    example: `I really like this word${i} in the morning.`,
    ipa: null,
    difficulty: 3,
    source: 'word_bank',
    srs_status: 'review',
  } as unknown as WordBankEntry
}

describe('generateWarmupShadowPhrases', () => {
  it('returns the requested number of phrases', () => {
    const words = Array.from({ length: 8 }, (_, i) => entry(i))
    expect(generateWarmupShadowPhrases(words, 4)).toHaveLength(4)
  })

  it('only uses entries that have an example sentence', () => {
    const withExample = entry(1)
    const withoutExample = { ...entry(2), example: null } as unknown as WordBankEntry
    const phrases = generateWarmupShadowPhrases([withExample, withoutExample], 4)
    expect(phrases).toHaveLength(1)
    expect(phrases[0]!.phrase).toContain('word1')
  })

  it('marks warm-up phrases as unscored', () => {
    const phrases = generateWarmupShadowPhrases([entry(1)], 1)
    expect(phrases[0]!.scored).toBe(false)
  })

  it('returns an empty list when there is nothing usable', () => {
    expect(generateWarmupShadowPhrases([], 4)).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/exercises/generators/__tests__/warmup.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/exercises/generators/warmup.ts`:

```ts
import type { WordBankEntry } from '@/lib/word-bank/types'
import { exerciseId, pick } from '@/lib/exercises/utils'

/**
 * Warm-up shadowing phrase.
 *
 * Deliberately NOT a graded exercise type: it writes nothing to
 * answer_history and cannot be failed. Its only job is to get the learner
 * speaking before the first free production, which is where speaking anxiety
 * otherwise stops the session.
 */
export interface WarmupShadowPhrase {
  id: string
  phrase: string
  /** Always false — warm-ups are never scored. */
  scored: false
}

export function generateWarmupShadowPhrases(
  entries: WordBankEntry[],
  count: number,
): WarmupShadowPhrase[] {
  const usable = entries.filter(
    (e) => typeof e.example === 'string' && e.example.trim().length > 0,
  )
  return pick(usable, count).map((entry) => ({
    id: exerciseId('warmup_shadow', entry.id, entry.example ?? ''),
    phrase: entry.example!.trim(),
    scored: false as const,
  }))
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/exercises/generators/__tests__/warmup.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Expose warm-up phrases on the step**

In `lib/practice/types.ts`, find `interface DailyStep` and add:

```ts
  /** Unscored shadowing phrases played before the step's first free production. */
  warmupPhrases?: WarmupShadowPhrase[]
```

with the import:

```ts
import type { WarmupShadowPhrase } from '@/lib/exercises/generators/warmup'
```

Then in `lib/practice/daily-plan/step-builders.ts`, inside `buildWordReviewStep`, add the import:

```ts
import { generateWarmupShadowPhrases } from '@/lib/exercises/generators/warmup'
```

and add `WARMUP_PHRASE_COUNT` to the `./constants` import. Then, in the returned object for the `word_review` step, add:

```ts
    warmupPhrases: generateWarmupShadowPhrases(words, WARMUP_PHRASE_COUNT),
```

- [ ] **Step 6: Type check and run the daily-plan suite**

Run: `npx tsc --noEmit && npx vitest run lib/practice/daily-plan/__tests__/`
Expected: exit 0 and PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/exercises/generators/warmup.ts lib/exercises/generators/__tests__/warmup.test.ts lib/practice/types.ts lib/practice/daily-plan/step-builders.ts
git commit -m "feat(daily): add unscored shadowing warm-up before free production"
```

---

## Task 7: Verificación completa

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: all green. Fix any daily-plan test that asserted the old single-spoken-exercise shape by updating its expectation to the new volume — do not lower the constant to satisfy an old test.

- [ ] **Step 2: Type check and lint**

Run: `npx tsc --noEmit && npx next lint`
Expected: exit 0.

- [ ] **Step 3: Manual smoke test**

Run: `pnpm dev`, open `/daily`, and confirm:
- The "Repaso de palabras" step now contains many spoken items, not one.
- Each spoken item shows a constraint badge (Pasado / Present perfect / …) and a Spanish prompt naming the required structure.
- Answering a past-tense prompt in present simple is marked **incorrect**, with feedback naming the missing structure.
- The warm-up phrases appear before the first microphone prompt.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "test(daily): update expectations for higher spoken production volume"
```

---

## Notas de riesgo

- **Rate limit — YA RESUELTO (commit `c6c289f1`).** `maxPermanent` en `/api/gemini/grade-production` está subido de 30 a 120. Nota: la ventana es de **60 segundos** (`lib/api/rate-limit.ts:181`), no por sesión ni por día, así que 30/min ya era holgado para 12 producciones; el cambio es un margen extra para un despliegue de un solo usuario, no un desbloqueo necesario. No hace falta tocar nada más aquí.
- **Coste real de API.** La restricción efectiva no es el rate limit de la app sino la cuota de Google sobre `gemini-2.5-flash-lite`. Ya existe cadena de fallback (`lib/gemini/fallback.ts`: flash-lite → flash), así que un agotamiento degrada de modelo en vez de romper la sesión. Vigila el consumo tras subir el volumen.
- **Duración de sesión.** 12 producciones habladas superan los 12 minutos objetivo. El Plan E introduce las rondas rápidas (10 s por ítem) que hacen ese volumen viable; hasta entonces, considera `SPOKEN_PRODUCTION_PER_SESSION = 8` como valor intermedio si la sesión se siente larga.
- **Regla offline.** La producción libre ya es online-only por decisión previa documentada en `production.ts`. Este plan no cambia esa excepción, pero la hace mucho más visible: si el usuario está offline, gran parte del paso queda inaccesible. El Plan E debe cubrir el fallback.
