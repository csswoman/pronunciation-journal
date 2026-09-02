# Plan 084: Descomponer el orquestador del Plan Diario (`composer.ts`) por debajo del límite de líneas

> **Executor instructions**: Sigue este plan paso a paso. Corre cada comando de verificación y confirma la salida esperada antes de pasar al siguiente paso. Si ocurre algo de la sección "STOP conditions", detén la ejecución y reporta — no improvises. Al terminar, actualiza la fila de estado para este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a63525d0..HEAD -- lib/practice/daily-plan/composer.ts eslint.config.mjs`
> Si alguno de los archivos en scope cambió desde que se escribió este plan, compara los extractos de "Current state" contra el código vivo antes de proceder.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt, architecture
- **Planned at**: commit `a63525d0`, 2026-09-02

## Why this matters

`CLAUDE.md:L59` y `ENGINEERING_STANDARDS.md:L208` estipulan que ningún archivo debe exceder las 250 líneas (con advertencia ESLint a 300). Actualmente, `lib/practice/daily-plan/composer.ts` tiene **508 líneas** de código y figura explícitamente en la lista de "Deuda pendiente de split". El archivo mezcla dos responsabilidades mayores:
1. La construcción del plan diario completo (`buildDailyPlan`).
2. La construcción del plan específico de repaso (`buildReviewPlan`).
Además de heurísticas de filtrado y reparación de errores. Esta concentración dificulta la auditoría y aumenta el riesgo de regresiones en la pantalla de inicio. Este plan extrae `buildReviewPlan` a su propio módulo y modulariza la orquestación, reduciendo `composer.ts` a menos de 200 líneas y retirándolo de la allowlist de ESLint.

## Current state

- `lib/practice/daily-plan/composer.ts`:
  - Líneas 1–92: Imports, constantes de reparación de errores (`constraintIdsForDuePatterns`) y tipos de `ReviewPlan`.
  - Líneas 93–245: Implementación completa de `buildReviewPlan`.
  - Líneas 246–508: Implementación completa de `buildDailyPlan`.
- `ENGINEERING_STANDARDS.md:208`:
  > `| Deuda pendiente de split | ... lib/practice/daily-plan/composer.ts ... | Módulos cohesivos a la espera de extracción |`
- `eslint.config.mjs`: Contiene `lib/practice/daily-plan/composer.ts` en `MAX_LINES_ALLOWLIST`.

## Commands you will need

| Purpose   | Command                                         | Expected on success |
|-----------|-------------------------------------------------|---------------------|
| Typecheck | `pnpm type-check`                               | exit 0, no errors   |
| Tests     | `pnpm test -- daily-plan`                       | all pass            |
| Tests     | `pnpm test -- review`                           | all pass            |
| Lint      | `pnpm lint`                                     | exit 0, sin warns   |

## Scope

**In scope**:
- `lib/practice/daily-plan/review-plan.ts` (nuevo módulo para `buildReviewPlan` y sus tipos)
- `lib/practice/daily-plan/composer.ts` (conserva `buildDailyPlan` y re-exporta `buildReviewPlan` para backwards-compat)
- `lib/practice/daily-plan/index.ts` (exportaciones públicas del módulo)
- `eslint.config.mjs` (retirar `lib/practice/daily-plan/composer.ts` de `MAX_LINES_ALLOWLIST`)
- `ENGINEERING_STANDARDS.md` (actualizar la tabla de deuda de split)

**Out of scope**:
- No cambiar la política determinista de selección de candidatos de `policy.ts`.
- No modificar el contrato de `DailyPlan` ni `DailyStep` en `lib/practice/types.ts`.

## Steps

### Step 1: Extraer `buildReviewPlan` a `lib/practice/daily-plan/review-plan.ts`
- Crear `lib/practice/daily-plan/review-plan.ts` (≤180 líneas).
- Mover las funciones:
  - `buildReviewPlan`
  - `BuildReviewPlanOptions`
  - `ReviewPlan`
  - `shouldKeepNonExerciseStep`
- Importar los fetchers necesarios de `fetchers.ts` y las utilidades de selección.

### Step 2: Simplificar `lib/practice/daily-plan/composer.ts`
- Importar y re-exportar `buildReviewPlan` y sus tipos desde `./review-plan`.
- Conservar `buildDailyPlan` asegurando que no exceda las 250 líneas. Si supera 250 líneas, extraer la rutina de ensamblaje de pasos opcionales (`enrichDailyPlanWithOptionalSteps`) a `step-builders.ts`.

### Step 3: Retirar de `MAX_LINES_ALLOWLIST` en `eslint.config.mjs`
- Quitar `"lib/practice/daily-plan/composer.ts"` de la lista `MAX_LINES_ALLOWLIST`.
- Actualizar `ENGINEERING_STANDARDS.md` eliminando `composer.ts` del inventario de deuda de split.

### Step 4: Verificación
- Correr `pnpm test -- daily-plan` y verificar que la suite completa pase sin alteraciones de comportamiento.
- Correr `pnpm lint` y confirmar que ESLint no emite advertencias de `max-lines` sobre `composer.ts`.
- Correr `pnpm type-check`.

## STOP conditions
- Si algún módulo externo importa `buildReviewPlan` directamente desde `@/lib/practice/daily-plan/composer`, asegurar que la re-exportación mantenga intacta la compatibilidad hacia atrás.
