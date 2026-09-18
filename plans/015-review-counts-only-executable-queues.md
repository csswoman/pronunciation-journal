# Plan 015: El contador de Repaso solo promete lo que la sesión de Repaso puede ejecutar

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- lib/review/queue-count-queries.ts lib/review/session-plan.ts lib/practice/daily-plan/review-plan.ts lib/review/__tests__ components/practice/review "app/(authenticated)/review" "app/(authenticated)/practice/review" lib/home/review-queue.ts`
> Ante discrepancia con "Current state", STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (cambia números visibles en el hub de Repaso y en Home)
- **Depends on**: none
- **Category**: correctness
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

El contrato dice "Repaso ejecuta colas reales. No muestra una colección
genérica". Hoy el badge de Repaso suma palabras esenciales vencidas y
lecciones de inmersión vencidas, pero la sesión de Repaso las incluye como
pasos **sin ejercicios** (solo un enlace a otra superficie). El usuario ve
"12 pendientes", completa la sesión, y el contador no baja porque 7 de esos
12 nunca se ejecutaron ahí. Eso es exactamente una promesa que la app no
cumple.

## Current state

`lib/practice/daily-plan/review-plan.ts:50-90` (`buildLinkSteps`): para
essential words → un paso `id: 'review:essential-words'`, `exercises: []`,
`href: '/practice/essential-words'`; para cada lección de inmersión vencida →
`exercises: []`, `href: lesson.url`, `selection.source: 'immersion_lesson_progress'`.

`lib/review/session-plan.ts:5-22` (`composeReviewSessionPlan`): separa
`exerciseSteps` (sin `href` o con ejercicios) de `linkSteps` (`href` y 0
ejercicios) y los concatena al final.

`lib/review/queue-count-queries.ts:190-201`:
```ts
const reviewable = failedSentences + reviewableWords + soundsDue + reviewableTopics + dueLessons + essentialWordsDue + chunksDue
```
y devuelve también `dueLessons`, `essentialWordsDue` por separado. Consumido
por el hub de Repaso (busca `getReviewQueueCounts`/`reviewable` en
`components/practice/review/` y `app/(authenticated)/practice/review/`) y por
Home (`lib/home/review-queue.ts`, test `lib/home/__tests__/review-queue.test.ts`).

Contrato relevante: "Palabras esenciales conserva su sesión y presupuesto…
el Plan diario puede recomendar una sesión… pero no debe restar su historial,
cuota" (`docs/architecture/integrated-learning-loop.md`, sección "Palabras
esenciales y Plan diario"). Es decir: no convertir esas palabras en
ejercicios de Repaso; sí dejar de contarlas como ejecutables.

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Tests | `pnpm vitest run lib/review lib/home lib/practice/daily-plan components/practice/review` | all pass |
| Typecheck / lint | `pnpm type-check && pnpm lint` | exit 0 |

## Scope

**In scope**: `lib/review/queue-count-queries.ts` (+ test `lib/review/__tests__/queries.test.ts` o el que cubra los conteos), `lib/home/review-queue.ts` (+ test), los componentes del hub de Repaso que muestran `reviewable`, `lib/practice/daily-plan/review-plan.ts` solo para el `subtitle` de los link-steps.

**Out of scope**: `session-plan.ts` (la separación es correcta), Essential Words (presupuesto propio), inmersión (plan 012).

## Git workflow

- Rama: `advisor/015-review-counts` desde `dev`. Commit: `fix(review): count only executable queue items as reviewable`.

## Steps

### Step 1: Dos números en la query

En `queue-count-queries.ts` cambia el retorno a:
```ts
executable: failedSentences + reviewableWords + soundsDue + reviewableTopics + chunksDue,
elsewhere: dueLessons + essentialWordsDue,
reviewable: /* mantener = executable + elsewhere durante la transición */,
```
Añade comentario: "`elsewhere` se practica en su propia superficie; Repaso
solo enlaza". Actualiza el test de conteos.

**Verify**: `pnpm vitest run lib/review` → all pass.

### Step 2: Hub y Home muestran el número ejecutable

1. En el hub de Repaso, el badge/CTA principal usa `executable`; añade una
   línea secundaria "N más en Palabras esenciales / Inmersión" con `elsewhere`
   solo si > 0, con enlaces a esas superficies.
2. En `lib/home/review-queue.ts` usa `executable` para `dueCount` del
   `resolvePrimaryAction` (sublabel "N en repaso").
3. En `review-plan.ts`, cambia el `subtitle` de los link-steps para que
   diga explícitamente "Se practica en Palabras esenciales" / "Ver en Inmersión".
4. Cuando todo consuma `executable`, elimina `reviewable` del tipo de retorno.

**Verify**: `pnpm vitest run lib/home components/practice/review` → all pass. `grep -rn "\.reviewable" components lib app | grep -v __tests__` → 0.

### Step 3: Cierre

**Verify**: `pnpm type-check && pnpm lint` → exit 0.

## Done criteria

- [ ] Tests listados pasan
- [ ] `grep -rn "reviewable" lib/review/queue-count-queries.ts` → 0 (campo retirado)
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Los extractos no coinciden.
- Algún test de e2e/a11y (`tests/`) afirma el texto exacto del badge: reporta antes de cambiarlo.

## Maintenance notes

- Si en el futuro Repaso incorpora un ejercicio de reconocimiento por palabra esencial (sin tocar su cuota), esas palabras pasan de `elsewhere` a `executable`; el cambio está en un solo sitio.
