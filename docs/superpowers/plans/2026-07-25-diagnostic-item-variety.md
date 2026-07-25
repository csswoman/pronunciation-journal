# Diagnostic Item Variety Implementation Plan (Plan 072)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que cada corrida del diagnóstico de pronunciación varíe sus preguntas (distintos ítems de word-stress, distinto orden, semilla por sesión) en vez de mostrar siempre las mismas 5, sin tocar la honestidad del scoring ni agregar dependencias.

**Architecture:** Tres cambios acoplados. (1) La semilla de selección deja de ser fija por usuario y pasa a ser por sesión (estable dentro de una corrida). (2) El banco de word-stress se amplía a ~18 ítems y se muestrean N (5) por corrida usando el PRNG sembrado existente. (3) Scoring, componente de percepción y evidencia dejan de asumir la longitud global del banco y trabajan con el conteo de ítems de la corrida, pasado explícitamente. Los ítems muestreados fluyen por props desde el orquestador (`PronunciationAssessmentClient`) hasta el componente de percepción.

**Tech Stack:** TypeScript, React 19, Vitest + @testing-library/react, PRNG sembrado propio (`lib/pronunciation/assessment/seeded-random.ts`).

---

## File Structure

- `lib/pronunciation/assessment/word-stress-perception.ts` — **Modify.** Ampliar el banco de ítems; hacer que `wordStressScore`/`wordStressCorrectAnswers` reciban el total de ítems de la corrida; añadir helper de muestreo `sampleWordStressItems(seed, count)`.
- `lib/pronunciation/assessment/__tests__/word-stress-perception.test.ts` — **Create.** Tests puros del banco, muestreo determinista y scoring por conteo de corrida.
- `components/pronunciation-assessment/PronunciationPerceptionPrompt.tsx` — **Modify.** Recibir `wordStressItems` por prop (default = banco completo, para no romper otros usos); usar `items.length` local en lugar de la constante global.
- `components/pronunciation-assessment/PronunciationPromptFlow.tsx` — **Modify.** Aceptar y reenviar `wordStressItems` al componente de percepción.
- `components/pronunciation-assessment/PronunciationAssessmentClient.tsx` — **Modify.** Derivar una semilla de sesión una vez al montar; muestrear los ítems de word-stress con ella; pasarlos a `PronunciationPromptFlow`.
- `components/pronunciation-assessment/PronunciationEvidenceDetail.tsx` — **Modify.** Mostrar "X de N" usando el conteo real de ítems presentados (leído del resultado), no la longitud global del banco.
- `lib/pronunciation/assessment/types.ts` — **Modify.** Añadir un campo opcional `perceptionItemCount` a `TargetResult` para que la evidencia sepa cuántos ítems se presentaron sin depender del banco global.
- `lib/pronunciation/assessment/scoring.ts` — **Modify.** Propagar `perceptionItemCount` cuando llega en el `PerceptionAnswer`.
- `components/pronunciation-assessment/__tests__/PronunciationPromptFlow.test.tsx` — **Modify.** Inyectar `wordStressItems` deterministas para el test de word-stress (hoy depende del contenido fijo del banco).

---

## Task 1: Ampliar el banco de word-stress y hacer el scoring independiente del tamaño global

**Files:**
- Modify: `lib/pronunciation/assessment/word-stress-perception.ts`
- Test: `lib/pronunciation/assessment/__tests__/word-stress-perception.test.ts` (create)

- [ ] **Step 1: Escribir el test que falla**

Create `lib/pronunciation/assessment/__tests__/word-stress-perception.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  WORD_STRESS_PERCEPTION_ITEMS,
  WORD_STRESS_ITEMS_PER_RUN,
  sampleWordStressItems,
  wordStressScore,
  wordStressCorrectAnswers,
} from '../word-stress-perception'

describe('word-stress bank', () => {
  it('has enough items to sample from without always repeating', () => {
    expect(WORD_STRESS_PERCEPTION_ITEMS.length).toBeGreaterThanOrEqual(15)
  })

  it('every item has a stressed index within its syllable range', () => {
    for (const item of WORD_STRESS_PERCEPTION_ITEMS) {
      expect(item.stressedSyllableIndex).toBeGreaterThanOrEqual(0)
      expect(item.stressedSyllableIndex).toBeLessThan(item.syllables.length)
    }
  })
})

describe('sampleWordStressItems', () => {
  it('returns exactly WORD_STRESS_ITEMS_PER_RUN items', () => {
    const items = sampleWordStressItems('seed-a', WORD_STRESS_ITEMS_PER_RUN)
    expect(items).toHaveLength(WORD_STRESS_ITEMS_PER_RUN)
  })

  it('returns no duplicates', () => {
    const items = sampleWordStressItems('seed-a', WORD_STRESS_ITEMS_PER_RUN)
    const words = items.map((i) => i.word)
    expect(new Set(words).size).toBe(words.length)
  })

  it('is deterministic for the same seed', () => {
    const a = sampleWordStressItems('seed-a', 5).map((i) => i.word)
    const b = sampleWordStressItems('seed-a', 5).map((i) => i.word)
    expect(a).toEqual(b)
  })

  it('varies across different seeds', () => {
    const a = sampleWordStressItems('seed-a', 5).map((i) => i.word)
    const b = sampleWordStressItems('seed-b', 5).map((i) => i.word)
    expect(a).not.toEqual(b)
  })
})

describe('wordStressScore with explicit total', () => {
  it('scores against the number of items actually presented, not the bank size', () => {
    // 3 of 5 correct in a 5-item run = 60
    expect(wordStressScore(3, 5)).toBe(60)
  })

  it('round-trips correct-answer count for a given run size', () => {
    expect(wordStressCorrectAnswers(60, 5)).toBe(3)
  })

  it('clamps out-of-range correct counts to the run total', () => {
    expect(wordStressScore(9, 5)).toBe(100)
    expect(wordStressScore(-1, 5)).toBe(0)
  })
})
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm exec vitest run lib/pronunciation/assessment/__tests__/word-stress-perception.test.ts`
Expected: FAIL — `sampleWordStressItems`, `WORD_STRESS_ITEMS_PER_RUN` no existen y `wordStressScore` no acepta un segundo argumento.

- [ ] **Step 3: Implementar los cambios**

Replace the full contents of `lib/pronunciation/assessment/word-stress-perception.ts` with:

```ts
/**
 * Replayable listening items for the word-stress diagnostic.
 *
 * The learner hears one word at a time and identifies its stressed syllable.
 * This is perception evidence only; it does not make a claim about how the
 * learner produces stress in their own recording.
 *
 * A single run samples a fixed subset (WORD_STRESS_ITEMS_PER_RUN) from this
 * bank via the shared seeded PRNG, so repeated diagnostics vary instead of
 * always showing the same items. Scoring is expressed against the number of
 * items actually presented in that run, never the full bank length.
 */

import { createSeededRng, weightedSampleWithoutReplacement } from './seeded-random'

export interface WordStressPerceptionItem {
  word: string
  syllables: readonly string[]
  stressedSyllableIndex: number
}

export const WORD_STRESS_PERCEPTION_ITEMS: readonly WordStressPerceptionItem[] = [
  { word: 'photograph', syllables: ['pho', 'to', 'graph'], stressedSyllableIndex: 0 },
  { word: 'banana', syllables: ['ba', 'na', 'na'], stressedSyllableIndex: 1 },
  { word: 'computer', syllables: ['com', 'pu', 'ter'], stressedSyllableIndex: 1 },
  { word: 'important', syllables: ['im', 'por', 'tant'], stressedSyllableIndex: 1 },
  { word: 'understand', syllables: ['un', 'der', 'stand'], stressedSyllableIndex: 2 },
  { word: 'develop', syllables: ['de', 've', 'lop'], stressedSyllableIndex: 1 },
  { word: 'restaurant', syllables: ['res', 'tau', 'rant'], stressedSyllableIndex: 0 },
  { word: 'tomorrow', syllables: ['to', 'mo', 'rrow'], stressedSyllableIndex: 1 },
  { word: 'remember', syllables: ['re', 'mem', 'ber'], stressedSyllableIndex: 1 },
  { word: 'holiday', syllables: ['ho', 'li', 'day'], stressedSyllableIndex: 0 },
  { word: 'engineer', syllables: ['en', 'gi', 'neer'], stressedSyllableIndex: 2 },
  { word: 'hospital', syllables: ['hos', 'pi', 'tal'], stressedSyllableIndex: 0 },
  { word: 'employee', syllables: ['em', 'plo', 'yee'], stressedSyllableIndex: 2 },
  { word: 'animal', syllables: ['a', 'ni', 'mal'], stressedSyllableIndex: 0 },
  { word: 'experience', syllables: ['ex', 'pe', 'rience'], stressedSyllableIndex: 1 },
  { word: 'family', syllables: ['fa', 'mi', 'ly'], stressedSyllableIndex: 0 },
  { word: 'potato', syllables: ['po', 'ta', 'to'], stressedSyllableIndex: 1 },
  { word: 'necessary', syllables: ['ne', 'ce', 'ssary'], stressedSyllableIndex: 0 },
]

export const WORD_STRESS_PERCEPTION_EVALUATOR_VERSION = 'word-stress-listening-v1'

/** How many word-stress items one diagnostic run presents. */
export const WORD_STRESS_ITEMS_PER_RUN = 5

/**
 * Deterministically samples `count` items from the bank for one run using the
 * shared seeded PRNG. Same seed → same items and order. All items carry equal
 * weight (uniform sample); `weightedSampleWithoutReplacement` guarantees no
 * duplicates and consumes the rng deterministically.
 */
export function sampleWordStressItems(
  seed: number | string,
  count: number = WORD_STRESS_ITEMS_PER_RUN
): WordStressPerceptionItem[] {
  const rng = createSeededRng(seed)
  return weightedSampleWithoutReplacement(WORD_STRESS_PERCEPTION_ITEMS, () => 1, count, rng)
}

/**
 * Converts a correct-answer count into a 0-100 score, relative to the number
 * of items actually presented in the run (`total`), not the full bank size.
 */
export function wordStressScore(correctAnswers: number, total: number): number {
  if (total <= 0) return 0
  const bounded = Math.max(0, Math.min(correctAnswers, total))
  return (bounded / total) * 100
}

/** Inverse of `wordStressScore` for a run of `total` items. */
export function wordStressCorrectAnswers(score: number, total: number): number {
  return Math.round((score / 100) * total)
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm exec vitest run lib/pronunciation/assessment/__tests__/word-stress-perception.test.ts`
Expected: PASS (todos los casos).

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/assessment/word-stress-perception.ts lib/pronunciation/assessment/__tests__/word-stress-perception.test.ts
git commit -m "feat(pronunciation): expand word-stress bank and make scoring run-size relative

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Añadir `perceptionItemCount` al resultado y propagarlo en scoring

Word-stress evidence necesita saber cuántos ítems se presentaron. Lo llevamos en el `PerceptionAnswer` y lo copiamos al `TargetResult`.

**Files:**
- Modify: `lib/pronunciation/assessment/types.ts`
- Modify: `lib/pronunciation/assessment/scoring.ts`
- Test: `lib/pronunciation/assessment/__tests__/scoring.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Add to `lib/pronunciation/assessment/__tests__/scoring.test.ts` inside the existing `describe('scorePerceptionPrompt', ...)` block (after the last `it`):

```ts
  it('carries perceptionItemCount from the answer onto the word-stress result', () => {
    const result = scorePerceptionPrompt(
      { targetId: targetId('prosody.word-stress'), stage: 'perception' },
      { correct: false, score: 60, perceptionItemCount: 5 }
    )

    expect(result.perceptionItemCount).toBe(5)
    expect(result.measurement).toEqual({ kind: 'scored', score: 60 })
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm exec vitest run lib/pronunciation/assessment/__tests__/scoring.test.ts -t "perceptionItemCount"`
Expected: FAIL — `perceptionItemCount` no existe en `PerceptionAnswer` ni en `TargetResult`.

- [ ] **Step 3: Añadir el campo al tipo del resultado**

In `lib/pronunciation/assessment/types.ts`, find the `TargetResult` interface (and its Zod `TargetResultSchema`). Add an optional numeric field to BOTH.

In the interface, add:

```ts
  /**
   * How many perception items were actually presented in this run, when the
   * target uses a sampled multi-item perception test (word-stress). Lets the
   * evidence UI say "X de N" without depending on the full bank size. Absent
   * for single-item or production targets.
   */
  perceptionItemCount?: number
```

In `TargetResultSchema` (the `z.object({...})`), add:

```ts
  perceptionItemCount: z.number().int().positive().optional(),
```

> Note: locate the exact object by searching for `TargetResultSchema` and the `TargetResult` interface in the file. Add the field alongside the existing optional fields; do not remove or reorder others.

- [ ] **Step 4: Propagar el campo en scoring**

In `lib/pronunciation/assessment/scoring.ts`:

4a. Extend `PerceptionAnswer`:

```ts
export interface PerceptionAnswer {
  /** Whether the learner picked the correct option. Objective — not self-report. */
  correct: boolean
  /** Aggregate score for a fixed multi-item perception test. */
  score?: number
  /** For sampled multi-item perception (word-stress): how many items were presented this run. */
  perceptionItemCount?: number
}
```

4b. In `scorePerceptionPrompt`, in the final `return buildResult({...})` for the objective perception path (the one with `evaluatorKind: 'perception_forced_choice'`), spread the count onto the result. Change that return from:

```ts
  return buildResult({
    targetId: selection.targetId,
    signalType: 'perception',
    measurement: { kind: 'scored', score: answer.score ?? (answer.correct ? 100 : 0) },
    evaluatorKind: 'perception_forced_choice',
    evaluatorVersion:
      selection.targetId === 'prosody.word-stress'
        ? WORD_STRESS_PERCEPTION_EVALUATOR_VERSION
        : 'perception-forced-choice-v1',
  })
```

to:

```ts
  return {
    ...buildResult({
      targetId: selection.targetId,
      signalType: 'perception',
      measurement: { kind: 'scored', score: answer.score ?? (answer.correct ? 100 : 0) },
      evaluatorKind: 'perception_forced_choice',
      evaluatorVersion:
        selection.targetId === 'prosody.word-stress'
          ? WORD_STRESS_PERCEPTION_EVALUATOR_VERSION
          : 'perception-forced-choice-v1',
    }),
    ...(answer.perceptionItemCount !== undefined
      ? { perceptionItemCount: answer.perceptionItemCount }
      : {}),
  }
```

- [ ] **Step 5: Correr los tests de scoring para verificar que pasan**

Run: `pnpm exec vitest run lib/pronunciation/assessment/__tests__/scoring.test.ts`
Expected: PASS (el nuevo caso y todos los previos).

- [ ] **Step 6: Commit**

```bash
git add lib/pronunciation/assessment/types.ts lib/pronunciation/assessment/scoring.ts lib/pronunciation/assessment/__tests__/scoring.test.ts
git commit -m "feat(pronunciation): carry presented-item count on perception results

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: El componente de percepción recibe sus ítems por prop

**Files:**
- Modify: `components/pronunciation-assessment/PronunciationPerceptionPrompt.tsx`
- Modify: `components/pronunciation-assessment/__tests__/PronunciationPromptFlow.test.tsx` (adjust the word-stress test to inject deterministic items)

- [ ] **Step 1: Ajustar el componente**

In `components/pronunciation-assessment/PronunciationPerceptionPrompt.tsx`:

1a. Update the import to also pull the run constant:

```ts
import {
  WORD_STRESS_PERCEPTION_ITEMS,
  wordStressScore,
  type WordStressPerceptionItem,
} from '@/lib/pronunciation/assessment/word-stress-perception'
```

1b. Extend the props:

```ts
interface PronunciationPerceptionPromptProps {
  selection: DiagnosticPromptSelection
  onAnswer: (answer: PerceptionAnswer | null) => void
  /** Word-stress items to present this run. Defaults to the full bank for non-sampled callers. */
  wordStressItems?: readonly WordStressPerceptionItem[]
}
```

1c. In the component signature, accept and resolve the items:

```ts
export function PronunciationPerceptionPrompt({
  selection,
  onAnswer,
  wordStressItems = WORD_STRESS_PERCEPTION_ITEMS,
}: PronunciationPerceptionPromptProps) {
```

1d. Replace every reference to `WORD_STRESS_PERCEPTION_ITEMS` INSIDE the component body with `wordStressItems`. There are these usages:

- `const wordStressItem = WORD_STRESS_PERCEPTION_ITEMS[wordStressIndex]` → `const wordStressItem = wordStressItems[wordStressIndex]`
- In `answerWordStress`, `const isLastItem = wordStressIndex + 1 === WORD_STRESS_PERCEPTION_ITEMS.length` → `=== wordStressItems.length`
- In `answerWordStress`, the `onAnswer` call:
  ```ts
  onAnswer({ correct: nextCorrectAnswers === WORD_STRESS_PERCEPTION_ITEMS.length, score: wordStressScore(nextCorrectAnswers) })
  ```
  becomes:
  ```ts
  onAnswer({
    correct: nextCorrectAnswers === wordStressItems.length,
    score: wordStressScore(nextCorrectAnswers, wordStressItems.length),
    perceptionItemCount: wordStressItems.length,
  })
  ```
- In the JSX progress copy: `Palabra {wordStressIndex + 1} de {WORD_STRESS_PERCEPTION_ITEMS.length}.` → `de {wordStressItems.length}.`

> The top-level `import` of `WORD_STRESS_PERCEPTION_ITEMS` stays — it is now the default prop value.

- [ ] **Step 2: Correr los tests del flujo — el de word-stress fallará (esperado)**

Run: `pnpm exec vitest run components/pronunciation-assessment/__tests__/PronunciationPromptFlow.test.tsx`
Expected: The word-stress test fails because the flow doesn't yet pass `wordStressItems` and the test still asserts `ba/com/im/un` → score 20. We fix the test in Step 3 and the flow wiring in Task 4.

- [ ] **Step 3: Actualizar el test de word-stress para inyectar ítems deterministas**

In `components/pronunciation-assessment/__tests__/PronunciationPromptFlow.test.tsx`, update `renderFlow` to forward an optional `wordStressItems` prop, and rewrite the word-stress test to pass a fixed 3-item list so it no longer depends on the bank contents.

3a. Extend `renderFlow`'s props type and the JSX (add the prop):

```ts
function renderFlow(
  props: Partial<{
    selections: DiagnosticPromptSelection[]
    capabilitySnapshot: CapabilitySnapshot
    onComplete: ReturnType<typeof vi.fn<OnComplete>>
    wordStressItems: WordStressPerceptionItem[]
  }> = {}
) {
  const onComplete = props.onComplete ?? vi.fn<OnComplete>()
  render(
    <PronunciationPromptFlow
      userId="user-1"
      selections={props.selections ?? selections}
      capabilitySnapshot={props.capabilitySnapshot ?? fullCapability}
      onComplete={onComplete}
      wordStressItems={props.wordStressItems}
    />
  )
  return onComplete
}
```

3b. Add the import at the top of the test file:

```ts
import type { WordStressPerceptionItem } from '@/lib/pronunciation/assessment/word-stress-perception'
```

3c. Replace the existing test `'offers an audible word-stress test and records the selected syllable as perception evidence'` with a deterministic version:

```ts
  it('offers an audible word-stress test and records the selected syllable as perception evidence', async () => {
    const items: WordStressPerceptionItem[] = [
      { word: 'photograph', syllables: ['pho', 'to', 'graph'], stressedSyllableIndex: 0 },
      { word: 'banana', syllables: ['ba', 'na', 'na'], stressedSyllableIndex: 1 },
      { word: 'computer', syllables: ['com', 'pu', 'ter'], stressedSyllableIndex: 1 },
    ]
    const onComplete = renderFlow({
      selections: [{ targetId: targetId('prosody.word-stress'), stage: 'perception' }],
      wordStressItems: items,
    })

    // Item 1: photograph — pick the correct stressed syllable 'pho' (index 0).
    await userEvent.click(screen.getByRole('button', { name: /escuchar palabra/i }))
    await userEvent.click(screen.getByRole('button', { name: 'pho' }))

    // Item 2: banana — three choices ba/na/na. Pick 'ba' (wrong; correct is index 1).
    const bananaChoices = within(screen.getByLabelText('Elige la sílaba con énfasis')).getAllByRole('button')
    expect(bananaChoices).toHaveLength(3)
    expect(bananaChoices.map((button) => button.textContent)).toEqual(['ba', 'na', 'na'])
    await userEvent.click(screen.getByRole('button', { name: /escuchar palabra/i }))
    await userEvent.click(screen.getByRole('button', { name: 'ba' }))

    // Item 3: computer — pick 'com' (wrong; correct is index 1).
    await userEvent.click(screen.getByRole('button', { name: /escuchar palabra/i }))
    await userEvent.click(screen.getByRole('button', { name: 'com' }))

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    // 1 of 3 correct = 33.33; perceptionItemCount reflects the injected run size.
    expect(onComplete.mock.calls[0][0][0]).toMatchObject({
      signalType: 'perception',
      evaluatorKind: 'perception_forced_choice',
      perceptionItemCount: 3,
    })
    const measurement = onComplete.mock.calls[0][0][0].measurement
    expect(measurement.kind).toBe('scored')
    if (measurement.kind === 'scored') {
      expect(Math.round(measurement.score)).toBe(33)
    }
  })
```

> This test now injects its own items, so it is immune to future bank edits. The `'pho'`/`'ba'`/`'com'` button labels correspond to the first syllable of each injected word.

- [ ] **Step 4: Verificar el estado (el flow aún no reenvía la prop; ver Task 4)**

Run: `pnpm exec vitest run components/pronunciation-assessment/__tests__/PronunciationPromptFlow.test.tsx -t "word-stress"`
Expected: STILL FAIL until Task 4 wires `wordStressItems` through the flow. This is expected — do not fix it here.

- [ ] **Step 5: Commit (WIP, sin verde total)**

```bash
git add components/pronunciation-assessment/PronunciationPerceptionPrompt.tsx components/pronunciation-assessment/__tests__/PronunciationPromptFlow.test.tsx
git commit -m "feat(pronunciation): perception prompt accepts word-stress items by prop

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: El flujo reenvía los ítems de word-stress

**Files:**
- Modify: `components/pronunciation-assessment/PronunciationPromptFlow.tsx`

- [ ] **Step 1: Añadir la prop y reenviarla**

In `components/pronunciation-assessment/PronunciationPromptFlow.tsx`:

1a. Add the import:

```ts
import type { WordStressPerceptionItem } from '@/lib/pronunciation/assessment/word-stress-perception'
```

1b. Extend the props interface:

```ts
interface PronunciationPromptFlowProps {
  userId: string
  selections: DiagnosticPromptSelection[]
  capabilitySnapshot: CapabilitySnapshot
  onComplete: (targetResults: TargetResult[]) => void
  /** Word-stress items sampled for this run; forwarded to the perception prompt. */
  wordStressItems?: readonly WordStressPerceptionItem[]
}
```

1c. Accept it in the signature:

```ts
export function PronunciationPromptFlow({
  userId,
  selections,
  capabilitySnapshot,
  onComplete,
  wordStressItems,
}: PronunciationPromptFlowProps) {
```

1d. Pass it to the perception prompt in the JSX. Change:

```tsx
        <PronunciationPerceptionPrompt
          key={current.targetId}
          selection={current}
          onAnswer={handlePerceptionAnswer}
        />
```

to:

```tsx
        <PronunciationPerceptionPrompt
          key={current.targetId}
          selection={current}
          onAnswer={handlePerceptionAnswer}
          wordStressItems={wordStressItems}
        />
```

- [ ] **Step 2: Correr los tests del flujo para verificar que pasan**

Run: `pnpm exec vitest run components/pronunciation-assessment/__tests__/PronunciationPromptFlow.test.tsx`
Expected: PASS (incluido el test de word-stress reescrito en Task 3).

- [ ] **Step 3: Commit**

```bash
git add components/pronunciation-assessment/PronunciationPromptFlow.tsx
git commit -m "feat(pronunciation): forward sampled word-stress items through prompt flow

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Semilla por sesión + muestreo en el orquestador

**Files:**
- Modify: `components/pronunciation-assessment/PronunciationAssessmentClient.tsx`

- [ ] **Step 1: Derivar semilla de sesión y muestrear**

In `components/pronunciation-assessment/PronunciationAssessmentClient.tsx`:

1a. Add imports:

```ts
import { useMemo, useRef } from 'react'
import { sampleWordStressItems } from '@/lib/pronunciation/assessment/word-stress-perception'
```

> `useMemo` is already imported; ensure `useRef` is added to the existing `react` import line. The existing import is:
> `import { useCallback, useMemo, useState, type ReactNode } from 'react'`
> Change it to:
> `import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'`

1b. Inside the component, right after the `useState` declarations, derive a per-session seed ONCE (stable across renders, distinct across mounts):

```ts
  // A per-session seed so each diagnostic run varies its selection and items,
  // while staying stable within a single run (so useMemo doesn't re-sample on
  // every render). userId keeps it reproducible-per-user within the session.
  const sessionSeedRef = useRef<string>(`${userId ?? 'guest'}:${Date.now()}:${Math.random()}`)
  const sessionSeed = sessionSeedRef.current
```

1c. Change the `selections` memo to seed from the session seed instead of `userId`:

```ts
  const selections = useMemo(
    () => selectDiagnosticPrompts({ seed: sessionSeed, cefrLevel: DEFAULT_CEFR }),
    [sessionSeed]
  )
```

1d. Add a memo that samples the word-stress items for this run:

```ts
  const wordStressItems = useMemo(
    () => sampleWordStressItems(sessionSeed),
    [sessionSeed]
  )
```

1e. Pass `wordStressItems` into `PronunciationPromptFlow` in the JSX. Change:

```tsx
      <PronunciationPromptFlow
        userId={userId ?? 'guest'}
        selections={selections}
        capabilitySnapshot={snapshot}
        onComplete={handlePromptsComplete}
      />
```

to:

```tsx
      <PronunciationPromptFlow
        userId={userId ?? 'guest'}
        selections={selections}
        capabilitySnapshot={snapshot}
        onComplete={handlePromptsComplete}
        wordStressItems={wordStressItems}
      />
```

> Note on restart: `handleRestart` resets stage but keeps the same session seed, so restarting shows the same run. That is acceptable for v1 (a restart resumes the same diagnostic). Varying on restart is out of scope.

- [ ] **Step 2: Typecheck**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 3: Correr toda la suite de assessment para no romper nada**

Run: `pnpm exec vitest run lib/pronunciation/assessment components/pronunciation-assessment`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add components/pronunciation-assessment/PronunciationAssessmentClient.tsx
git commit -m "feat(pronunciation): per-session seed and sampled word-stress items in diagnostic

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: La evidencia usa el conteo real de ítems presentados

**Files:**
- Modify: `components/pronunciation-assessment/PronunciationEvidenceDetail.tsx`
- Modify: `components/pronunciation-assessment/__tests__/PronunciationEvidenceDetail.test.tsx`

- [ ] **Step 1: Escribir/ajustar el test que falla**

In `components/pronunciation-assessment/__tests__/PronunciationEvidenceDetail.test.tsx`, add a test that a word-stress result with `perceptionItemCount: 5` and `score: 60` renders "3 de 5" (not "3 de 18"). Use the existing render helper / imports in that file for a `TargetResult`. Add:

```ts
  it('summarizes word-stress against the number of items presented this run', () => {
    const result: TargetResult = {
      targetId: targetId('prosody.word-stress'),
      status: 'strength',
      signalType: 'perception',
      confidence: 0.6,
      evaluatorKind: 'perception_forced_choice',
      evaluatorVersion: 'word-stress-listening-v1',
      measurement: { kind: 'scored', score: 60 },
      perceptionItemCount: 5,
    }
    render(<PronunciationEvidenceDetail targetResults={[result]} />)
    expect(screen.getByText(/3 de 5 palabras/i)).toBeInTheDocument()
  })
```

> If the test file lacks `targetId`/`TargetResult` imports, add:
> `import { targetId } from '@/lib/pronunciation/targets/registry'`
> `import type { TargetResult } from '@/lib/pronunciation/assessment/types'`
> and open the `<details>` if the summary is collapsed by default — mirror how existing tests in this file query the rendered evidence (they may need to click the `summary`).

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm exec vitest run components/pronunciation-assessment/__tests__/PronunciationEvidenceDetail.test.tsx -t "items presented"`
Expected: FAIL — currently renders "3 de 18" (full bank length).

- [ ] **Step 3: Ajustar el componente**

In `components/pronunciation-assessment/PronunciationEvidenceDetail.tsx`, in `measurementSummary`, change the word-stress branch to use the run count when present, falling back to the bank length:

```ts
    if (
      result.targetId === 'prosody.word-stress' &&
      result.evaluatorVersion === WORD_STRESS_PERCEPTION_EVALUATOR_VERSION
    ) {
      const total = result.perceptionItemCount ?? WORD_STRESS_PERCEPTION_ITEMS.length
      return `Identificaste la sílaba tónica en ${wordStressCorrectAnswers(measurement.score, total)} de ${total} palabras.`
    }
```

> `wordStressCorrectAnswers` now takes `(score, total)` (Task 1). The `WORD_STRESS_PERCEPTION_ITEMS` import stays as the fallback.

- [ ] **Step 4: Correr los tests de evidencia para verificar que pasan**

Run: `pnpm exec vitest run components/pronunciation-assessment/__tests__/PronunciationEvidenceDetail.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/pronunciation-assessment/PronunciationEvidenceDetail.tsx components/pronunciation-assessment/__tests__/PronunciationEvidenceDetail.test.tsx
git commit -m "feat(pronunciation): word-stress evidence reflects items presented this run

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Verificación final

- [ ] **Step 1: Typecheck**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 2: Suite completa de pronunciación**

Run: `pnpm exec vitest run lib/pronunciation components/pronunciation-assessment`
Expected: all pass.

- [ ] **Step 3: Lint de tokens de diseño (no se tocaron estilos, pero el plan 067 lo exige)**

Run: `pnpm lint:design-tokens`
Expected: exit 0.

- [ ] **Step 4: Verificación manual (dev server)**

Run: `pnpm dev`, abrir `/assessment/pronunciation`, completar el diagnóstico dos veces (recargando la página entre corridas). Confirmar que las palabras de word-stress y/o el orden de targets cambian entre corridas, y que la pantalla de evidencia dice "X de 5".

- [ ] **Step 5: Actualizar el estado del plan en README**

Editar la fila 072 de `plans/README.md` a `DONE (2026-07-25: per-session seed + sampled 18-item word-stress bank; run-size-relative scoring/evidence; focused tests + typecheck + token lint pass)`.

```bash
git add plans/README.md
git commit -m "docs: mark plan 072 done

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notas de honestidad (no violar)

- Este plan NO agrega ningún score acústico ni cambia qué se considera medible. Word-stress sigue siendo **percepción** (`perception_forced_choice`), nunca una afirmación sobre producción. Ampliar el banco y muestrear solo cambia *qué palabras* se oyen, no *qué se mide*.
- El scoring de STT y las abstenciones (`not_measured`) quedan intactos.
- La medición acústica de vocales es el plan 071, fuera de alcance aquí.
