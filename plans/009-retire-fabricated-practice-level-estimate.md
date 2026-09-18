# Plan 009: Ningún nivel se deriva de la precisión de pronunciación ni de una semilla B1

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- lib/ai-practice/load-state.ts lib/ai-practice/learning-state.ts lib/ai-practice/wire.ts lib/learner-level/core.ts lib/exercises/generators/production.ts lib/ai-practice/__tests__`
> Ante discrepancia con "Current state", STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (recomendado tras 008)
- **Category**: correctness
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

El único "estimador por práctica" del sistema mapea la **precisión de
pronunciación** a una banda CEFR (`accuracyToCEFR`) y su "confianza" es
`intentos / 100`. Un alumno que pronuncia bien pero tiene gramática A1 sale
como C1; un alumno nuevo nace con una semilla `B1, 0.5` que no proviene de
ningún dato. `resolveLearnerLevel` tiene una rama que promueve ese valor a
`practice_estimate` cuando la confianza llega a 0.6, es decir, tras 60
intentos de pronunciación la app "estima" con alta confianza un B1
inventado. Ese nivel alimenta el prompt del coach, la dificultad de
producción y el plan diario para usuarios sin placement. Este plan elimina
la fabricación y deja el nivel del estado de aprendizaje como espejo del
nivel resuelto, nunca como fuente.

## Current state

`lib/ai-practice/load-state.ts:32-39`:
```ts
function accuracyToCEFR(accuracy: number): UserLearningState["level"]["cefrEstimate"] {
  if (accuracy <= 30) return "A1"; if (accuracy <= 45) return "A2"; if (accuracy <= 60) return "B1";
  if (accuracy <= 75) return "B2"; if (accuracy <= 88) return "C1"; return "C2";
}
```
`load-state.ts:132-134`:
```ts
const avgAccuracy = resolvedStats?.averageAccuracy ?? 0;
const cefrEstimate = accuracyToCEFR(avgAccuracy);
const confidence = Math.min(1, (resolvedStats?.totalAttempts ?? 0) / 100);
```
`load-state.ts:157-163`:
```ts
level: stored?.level
  ? { ...stored.level, confidence: Math.max(stored.level.confidence, confidence) }
  : { cefrEstimate, confidence },
```
`lib/ai-practice/learning-state.ts:282` (`createEmptyState`): `level: { cefrEstimate: "B1", confidence: 0.5 }`.

`lib/learner-level/core.ts:45-54`: rama `if (input.practiceLevel && confidence >= 0.6)` → `source: 'practice_estimate'`.

`lib/ai-practice/wire.ts:53-56`: `learningState?.level.cefrEstimate ?? "B1"` para el idioma del coach.
`lib/exercises/generators/production.ts:57-63`: docstring que ya se queja del default B1 (léelo antes de tocar).

`components/auth/AuthProvider.tsx:145-164` sobrescribe `cefrEstimate` con el
nivel del perfil al iniciar sesión (tras el plan 008, con el nivel resuelto).

Tests: `lib/ai-practice/__tests__/load-state.test.ts`, `learning-state.test.ts`,
`wire.test.ts`; `lib/learner-level/__tests__/core.test.ts` (tiene un caso
"uses supported practice evidence over the starter default" que hay que invertir).

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm vitest run lib/ai-practice lib/learner-level lib/exercises` | all pass |

## Scope

**In scope**:
- `lib/ai-practice/load-state.ts`, `lib/ai-practice/learning-state.ts`
- `lib/learner-level/core.ts` y su test
- `lib/ai-practice/__tests__/load-state.test.ts`, `learning-state.test.ts`, `wire.test.ts`
- `lib/ai-practice/wire.ts` (solo el fallback `?? "B1"` → `?? "A1"` con comentario)

**Out of scope**:
- La migración SQL del CHECK de `cefr_level_source` (dejar `practice_estimate` en el CHECK; no hay filas y no hace daño).
- `lib/exercises/generators/production.ts` — solo lectura; si su default depende del B1, anótalo en el reporte final.
- `AuthProvider.tsx`.

## Git workflow

- Rama: `advisor/009-retire-fake-level-estimate` desde `dev`.
- Un commit: `fix(cefr): stop deriving learner level from pronunciation accuracy`.

## Steps

### Step 1: Eliminar `accuracyToCEFR`

1. En `load-state.ts` borra `accuracyToCEFR` (32-39) y las líneas 132-134.
   Sustituye el bloque `level:` (157-163) por:
   ```ts
   // El nivel del estado es un espejo del nivel resuelto (perfil), nunca una
   // inferencia propia. AuthProvider lo hidrata; aquí solo se conserva.
   level: stored?.level ?? base.level,
   ```
2. En `learning-state.ts:282` cambia la semilla a
   `level: { cefrEstimate: "A1", confidence: 0 }` con comentario
   "sin evidencia; AuthProvider lo sustituye por el nivel del perfil".
3. En `wire.ts:53-56` cambia `?? "B1"` por `?? "A1"` y actualiza el comentario.

**Verify**: `grep -n "accuracyToCEFR" lib` → 0. `pnpm vitest run lib/ai-practice` → ajusta los tests que esperaban B1/confianza y confirma all pass.

### Step 2: Retirar la rama de promoción del resolver

1. En `core.ts` elimina la rama `if (input.practiceLevel && confidence >= 0.6)`
   y los campos `practiceLevel`/`practiceConfidence` de `LearnerLevelInput`.
   Conserva `'practice_estimate'` en `LEARNER_LEVEL_SOURCES` para poder leer
   filas antiguas si existieran, con comentario "solo lectura; ningún escritor
   activo".
2. En `client-queries.ts` y `server-queries.ts` deja de pasar
   `practiceLevel`/`practiceConfidence` (y elimina la lectura de
   `user_learning_state` en `server-queries.ts` si solo servía para eso).
3. En `core.test.ts` reemplaza el caso "uses supported practice evidence over
   the starter default" por "ignores local practice estimate" que asegure que
   con `profileSource: 'starter_default'` el resultado es `A1 / starter_default`.

**Verify**: `pnpm vitest run lib/learner-level` → all pass.

### Step 3: Cierre

**Verify**: `pnpm type-check`, `pnpm lint` → exit 0.

## Test plan

- `load-state.test.ts`: con `stored` sin `level`, el nivel es el de `createEmptyState` (A1, 0); con `averageAccuracy: 95` el nivel no cambia.
- `core.test.ts`: caso invertido.
- `wire.test.ts`: fallback A1.

## Done criteria

- [ ] `pnpm type-check`, `pnpm lint` exit 0
- [ ] `pnpm vitest run lib/ai-practice lib/learner-level` all pass
- [ ] `grep -rn "accuracyToCEFR\|practiceConfidence" lib components hooks` → 0
- [ ] `grep -n 'cefrEstimate: "B1"' lib/ai-practice/learning-state.ts` → 0
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Los extractos no coinciden.
- Algún test fuera de `lib/ai-practice` o `lib/learner-level` falla porque
  dependía de la semilla B1 (busca `"B1"` en el error): repórtalo con la
  ruta; no lo "arregles" cambiando el test si el comportamiento esperado es
  pedagógico (p. ej. dificultad de un generador).

## Maintenance notes

- Si se quiere un estimador real por práctica, debe: (a) usar evidencia de
  gramática/vocabulario (`answer_history` con `topic`/`sourceRef`), no de
  pronunciación; (b) escribirse por ruta de servidor con `source: 'practice_estimate'`
  (ver plan 007); (c) tener test de calibración. Hasta entonces el nivel solo
  cambia por placement, checkpoint o elección manual.
