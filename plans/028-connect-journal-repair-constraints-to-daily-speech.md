# Plan 028: Conectar restricciones de reparación del Diario a la práctica oral del Plan Diario

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 87636eca..HEAD -- lib/practice/daily-plan/composer.ts lib/practice/daily-plan/daily-steps-builder.ts lib/practice/daily-plan/step-builders.ts lib/exercises/generators/production.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug / pedagogy
- **Planned at**: commit `87636eca`, 2026-09-22

## Why this matters

Cuando un alumno comete un error gramatical o sintáctico en el Diario (ej. usar presente por pasado), el sistema extrae el patrón de error y agenda una fecha de reincidencia en `user_learning_state.errorRecurrence`. En el Plan Diario, `composer.ts:123` calcula `repairConstraints` y la cabecera `PedagogicalContextBanner.tsx` promete al alumno: `🔄 Reparación de 1 error del Journal`. Sin embargo, `step-builders.ts:111-116` hardcodea las restricciones `['rodeo_circumlocution', 'spoken_verb_transform']` y jamás recibe `repairConstraints`. El alumno ve una promesa pedagógica que la sesión nunca cumple: su error nunca regresa como ejercicio de producción oral correctivo.

## Current state

- `lib/practice/daily-plan/composer.ts:123`:
  ```ts
  const repairConstraints = constraintIdsForDuePatterns(aiState?.errorRecurrence)
  ```
  Calcula las restricciones correctivas pero solo las usa para `arc.journalRepairs` (el banner visual).
- `lib/practice/daily-plan/daily-steps-builder.ts:147-153`:
  ```ts
  const wordReview = buildWordReviewStep(
    reviewWords,
    'daily',
    savedOrFamiliarWordIds,
    wordIndex,
    studyDeckActiveLevel,
  )
  ```
  No recibe ni pasa `repairConstraints`.
- `lib/practice/daily-plan/step-builders.ts:110-117`:
  ```ts
  const spokenProduction = isExerciseAvailableOnSurface('spoken_production', targetSurface)
    ? generateSpokenProductionFromWordBank(
        productionWords,
        SPOKEN_PRODUCTION_PER_SESSION,
        ['rodeo_circumlocution', 'spoken_verb_transform'],
        learnerLevel,
      )
    : { exercises: [] }
  ```
  Las restricciones están fijas; `preferredConstraintIds` no incluye las de reparación.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm type-check`        | exit 0, no errors   |
| Tests     | `pnpm vitest run lib/practice/daily-plan/__tests__/` | all pass |
| Lint      | `pnpm lint`              | exit 0              |

## Scope

**In scope**:
- `lib/practice/daily-plan/step-builders.ts`
- `lib/practice/daily-plan/daily-steps-builder.ts`
- `lib/practice/daily-plan/composer.ts`
- `lib/practice/daily-plan/__tests__/repair-constraints-wiring.test.ts` (nuevo test)

**Out of scope**:
- Modificar la taxonomía de `SpeechConstraintId` o `ErrorPatternId`.
- Modificar el banner visual `PedagogicalContextBanner.tsx`.
- Modificar el corrector en `lib/journal/apply-feedback.ts`.

## Steps

### Step 1: Añadir `repairConstraints` al parámetro de `buildWordReviewStep` en `step-builders.ts`

Extiende la firma de `buildWordReviewStep`:
```ts
export function buildWordReviewStep(
  words: WordBankEntry[],
  context: PracticeContext = 'daily',
  savedOrFamiliarIds?: ReadonlySet<string>,
  wordIndex?: WordCategoryIndex,
  activeLevel?: CefrLevelId,
  repairConstraints: readonly SpeechConstraintId[] = [],
): DailyStep | null
```
En la llamada a `generateSpokenProductionFromWordBank`, antepón `repairConstraints` a las restricciones por defecto para que las reparaciones tengan prioridad:
```ts
const preferredConstraints = [
  ...repairConstraints,
  'rodeo_circumlocution',
  'spoken_verb_transform',
] as const

const spokenProduction = isExerciseAvailableOnSurface('spoken_production', targetSurface)
  ? generateSpokenProductionFromWordBank(
      productionWords,
      SPOKEN_PRODUCTION_PER_SESSION,
      preferredConstraints,
      learnerLevel,
    )
  : { exercises: [] }
```

**Verify**: `pnpm type-check` → exit 0.

### Step 2: Propagar `repairConstraints` en `daily-steps-builder.ts` y `composer.ts`

1. En `lib/practice/daily-plan/daily-steps-builder.ts`, añade `repairConstraints?: readonly SpeechConstraintId[]` a `BuildDailyCandidateStepsParams`.
2. Pasa `repairConstraints` a la invocación de `buildWordReviewStep`:
```ts
const wordReview = buildWordReviewStep(
  reviewWords,
  'daily',
  savedOrFamiliarWordIds,
  wordIndex,
  studyDeckActiveLevel,
  repairConstraints,
)
```
3. En `lib/practice/daily-plan/composer.ts:164`, pasa `repairConstraints` en el objeto que recibe `buildDailyCandidateSteps`.

**Verify**: `pnpm type-check` → exit 0.

### Step 3: Escribir test de regresión unitario

Crea `lib/practice/daily-plan/__tests__/repair-constraints-wiring.test.ts` que verifique:
1. Cuando `repairConstraints` contiene `['past_simple_narrative']`, el ejercicio de producción oral generado en el paso `word_review` utiliza la restricción `past_simple_narrative`.
2. Cuando `repairConstraints` está vacío, mantiene el comportamiento fallback previo (`rodeo_circumlocution` o `spoken_verb_transform`).

**Verify**: `pnpm vitest run lib/practice/daily-plan/__tests__/repair-constraints-wiring.test.ts` → all pass.

## Test plan

- Test 1: Inyección de `repairConstraints` prioritarias en `word_review`.
- Test 2: Fallback cuando no hay errores del journal pendientes.
- Test 3: Integración de `composer.ts` con estado que tiene `errorRecurrence`.

## Done criteria

- [x] `pnpm type-check` exits 0
- [x] `pnpm vitest run lib/practice/daily-plan/__tests__/` exits 0
- [x] `pnpm lint` exits 0
- [x] `plans/README.md` status row 028 updated

## STOP conditions

- `generateSpokenProductionFromWordBank` cambia de firma o deja de aceptar `preferredConstraintIds`.
- La llamada a `buildDailyCandidateSteps` falla en typecheck por interfaces desalineadas en tests existentes.

## Maintenance notes

- Si en el futuro se añade soporte para que los mazos de gramática también alimenten restricciones de habla mediante `constraintIdForDeck`, se deben componer en la misma lista priorizada de `repairConstraints`.
