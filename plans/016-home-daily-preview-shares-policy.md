# Plan 016: La vista previa del plan diario en Home refleja el plan real

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- lib/home/queries.ts lib/practice/daily-plan/composer.ts lib/practice/daily-plan/constants.ts lib/daily components/home/HomeHeroCard.tsx components/home/HomeHeroStepList.tsx`
> Ante discrepancia con "Current state", STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (plan 003 de la serie anterior ya dejó el compositor fuera del bundle inicial; respetarlo)
- **Category**: correctness / tech-debt
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

Home muestra una lista de pasos "del plan de hoy" generada por
`getDailyPlanPreview`, una segunda implementación que su propio comentario
pide "mantener en sincronía" con `buildDailyPlan`. Ya no lo está: la preview
no tiene ningún paso de chunks (el 70% declarado del plan), añade una
mini-lección que el compositor nunca selecciona, y no filtra por nivel. El
usuario ve en la portada un plan distinto del que ejecuta al pulsar
"Empezar". Es contenido inventado en la pantalla más vista.

## Current state

`lib/home/queries.ts:147-152` (comentario que admite la duplicación) y
`:211-254`: pasos fijos `word_review` (si hay word_bank) → `phoneme_focus` →
`minimal_pairs` → `listening` → `concept:<mini-lesson>` vía
`getTodaysMiniLesson()`; `DAILY_PLAN_STEP_COUNT = 5` redeclarado en la línea 22.

`lib/practice/daily-plan/composer.ts`: el plan real reserva slots para chunks
(`RESERVED_CHUNK_NEW_SLOTS`, `MAX_DUE_STEPS` en `constants.ts`), incluye
`dueChunkStep`, `pronunciationChunkStep`, gramática (`grammar-focus.ts`,
`study-deck.ts`), inmersión (`immersion-step.ts`), y filtra por
`getEffectiveLearnerLevel`. Importa el cliente Supabase de navegador, por eso
la preview no puede llamarlo desde el servidor (comentario en `queries.ts:17-21`).

El plan diario real, una vez construido en cliente, se guarda en Dexie
(`lib/daily/plan-storage.ts`; mira qué clave/fecha usa) y `hooks/useDailyPlan.ts`
lo lee.

Consumidor de la preview: `components/home/HomeHeroCard.tsx` /
`HomeHeroStepList.tsx` (tests en `components/home/__tests__/HomeHeroCard.test.tsx`).

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Tests | `pnpm vitest run lib/home lib/practice/daily-plan components/home` | all pass |
| Typecheck / lint | `pnpm type-check && pnpm lint` | exit 0 |
| Bundle | `pnpm analyze:bundle:check` (si existe) | dentro de presupuesto |

## Scope

**In scope**: `lib/home/queries.ts` (`getDailyPlanPreview`), nuevo `lib/practice/daily-plan/step-kinds.ts` (puro), `components/home/HomeHeroStepList.tsx` (mostrar plan real si existe), `hooks/useDailyPlan.ts` solo si hace falta exponer un lector "plan de hoy si ya existe", tests.

**Out of scope**: el compositor (`composer.ts`), `constants.ts` (no cambiar cuotas), `plan-storage.ts` (no cambiar formato).

## Git workflow

- Rama: `advisor/016-home-preview` desde `dev`. Commits: `refactor(daily): extract step-kind order to a pure module`, `fix(home): preview mirrors real daily plan composition`.

## Steps

### Step 1: Módulo puro con el orden de tipos de paso

Crea `lib/practice/daily-plan/step-kinds.ts` exportando
`DAILY_PLAN_STEP_COUNT` (muévelo aquí desde `constants.ts` re-exportándolo
allí para no romper imports) y una función pura
`previewStepKinds(input: { hasDueWords: boolean; hasDueSounds: boolean; hasProgress: boolean; level: CEFRLevel }): DailyStepPreviewKind[]`
que devuelva el orden **que produce el compositor**: chunk (siempre, por
`RESERVED_CHUNK_NEW_SLOTS`), repaso vencido si lo hay (palabra/sonido),
gramática, sonido, y el resto hasta `DAILY_PLAN_STEP_COUNT`. Deriva la lista
leyendo el compositor, no inventando; anota en el JSDoc de qué líneas del
compositor sale cada regla. Test: `lib/practice/daily-plan/__tests__/step-kinds.test.ts`.

**Verify**: `pnpm vitest run lib/practice/daily-plan` → all pass.

### Step 2: La preview usa el módulo y nada más

En `getDailyPlanPreview` sustituye la lista fija por `previewStepKinds(...)`
mapeada a títulos/subtítulos/iconos; elimina `getTodaysMiniLesson()` de la
preview y el `DAILY_PLAN_STEP_COUNT` local. Obtén `level` con
`getEffectiveLearnerLevelServer(userId)` (ya se usa en `queries.ts:313`).

**Verify**: `pnpm vitest run lib/home components/home` → all pass tras actualizar tests. `grep -n "getTodaysMiniLesson" lib/home/queries.ts` → 0.

### Step 3: Si hoy ya hay plan real, mostrar ese

En `HomeHeroStepList` (cliente), lee con `useLiveQuery` el plan de hoy desde
Dexie (`plan-storage.ts`); si existe, renderiza sus pasos reales (título y
estado) en lugar de la preview SSR. Mantén la preview como estado inicial
para no bloquear el render. Test en `HomeHeroCard.test.tsx`: con plan en
Dexie se muestran sus títulos.

**Verify**: `pnpm vitest run components/home` → all pass. `pnpm analyze:bundle:check` (si existe) → sin superar presupuesto (el hook no debe importar el compositor).

### Step 4: Cierre

**Verify**: `pnpm type-check && pnpm lint` → exit 0.

## Done criteria

- [ ] Tests listados pasan
- [ ] `grep -n "Mantener ambas en sincronía" lib/home/queries.ts` → 0
- [ ] `grep -n "DAILY_PLAN_STEP_COUNT = " lib/home/queries.ts` → 0
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Los extractos no coinciden.
- Importar el módulo nuevo desde `lib/home/queries.ts` arrastra `lib/db` o el cliente Supabase al servidor: reporta; el módulo debe ser puro.
- El presupuesto de bundle de la ruta `/` se supera al leer Dexie en el hero.

## Maintenance notes

- Toda regla nueva del compositor que cambie el *tipo* de pasos debe tocar `step-kinds.ts`; el test compara ambos.
