# Plan 017: Las mini-lecciones se ordenan por nivel y entran como candidatas del Plan diario

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- "app/(authenticated)/mini-lessons/page.tsx" components/mini-lessons lib/content/lessons.ts lib/learning-loop/theory-targets.ts lib/learning-loop/mini-lesson-deck-link.ts lib/practice/daily-plan`
> Ante discrepancia con "Current state", STOP.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 008 (lectura del nivel)
- **Category**: correctness / direction
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

Las 66 mini-lecciones declaran targets completos en el manifest, pero
`/mini-lessons` las lista todas sin nivel (un A1 ve "cleft sentences" junto a
"articles a/an/the") y el compositor del Plan diario nunca las selecciona: la
única forma de llegar a una es navegar el catálogo. Es contenido conectado en
teoría y sin salida en la práctica.

## Current state

`app/(authenticated)/mini-lessons/page.tsx`:
```tsx
const lessons = await getAllMiniLessons();
return <PageLayout archetype="catalog"><MiniLessonsBrowser lessons={lessons} /></PageLayout>;
```
`lib/content/lessons.ts`: `getAllMiniLessons()` (mira si el tipo de lección
tiene campo `level`; `lib/content/cefr-labels.ts` sugiere que sí o que hay
etiquetas). `lib/learning-loop/theory-targets.ts:7` `MINI_LESSON_EQUIVALENT_DECKS`
mapea slug de mini-lección → slug de mazo (`a1-…`, `b2-…`, `c1-…`, `cs-…`), de
donde se deduce nivel para las que tienen equivalencia.
`grep -rn mini lib/practice/daily-plan/*.ts` → nada.

Compositor: candidatos con `selection.reason` (ver `NEW_MATERIAL_REASONS` y
`'route_next'` en `policy.ts`/`constants.ts`); gramática del día en
`grammar-focus.ts` y `study-deck.ts` (lee cómo un `study_deck` step se
construye y cómo se marca `route_next`).

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Tests | `pnpm vitest run lib/content lib/learning-loop lib/practice/daily-plan components/mini-lessons` | all pass |
| Typecheck / lint | `pnpm type-check && pnpm lint` | exit 0 |
| Loop audit | `pnpm audit:learning-loop` | `0 issues` |

## Scope

**In scope**: `lib/content/lessons.ts` (helper `miniLessonLevel(slug)`), `app/(authenticated)/mini-lessons/page.tsx`, `components/mini-lessons/MiniLessonsBrowser.tsx` (orden/sección "de tu nivel"), nuevo `lib/practice/daily-plan/mini-lesson-step.ts` + test, `composer.ts` (añadir el candidato), tests.

**Out of scope**: contenido de las lecciones, `theory-targets.ts` (solo lectura), cuotas del compositor.

## Git workflow

- Rama: `advisor/017-mini-lessons-level` desde `dev`. Commits: `feat(mini-lessons): order catalog by learner level`, `feat(daily): offer a mini-lesson when its topic is weak`.

## Steps

### Step 1: Nivel por mini-lección

En `lib/content/lessons.ts` añade `miniLessonLevel(slug): CefrLevelId | null`:
usa el campo `level` de la lección si existe; si no, el prefijo del mazo
equivalente (`resolveMiniLessonDeckLink`/`MINI_LESSON_EQUIVALENT_DECKS`);
`cs-*`/sin equivalencia → `null`. Test en `lib/content/__tests__/`.

**Verify**: `pnpm vitest run lib/content` → all pass.

### Step 2: Catálogo ordenado por nivel

La página obtiene `getEffectiveLearnerLevelServer(user.id)` (o invitado →
`null`) y pasa `learnerLevel` a `MiniLessonsBrowser`, que muestra primero
una sección "Para tu nivel" (nivel y ±1) y luego el resto agrupado por nivel,
con las de nivel `null` al final bajo "Habla conectada / general". No ocultar
nada: la Ruta es explorable por contrato.

**Verify**: `pnpm vitest run components/mini-lessons` → all pass (añade un test de orden).

### Step 3: Candidato del Plan diario

Crea `lib/practice/daily-plan/mini-lesson-step.ts`: dado el tema débil del
día (`weakTopic`, ya calculado en el compositor) busca una mini-lección cuyo
mazo equivalente sea `deckSlugForTopic(weakTopic)`; si existe y no está en
`lesson_completions`, devuelve un `DailyStep` `kind: 'concept'` con `href`
a `/mini-lessons/<slug>`, `exercises: []`, `selection: { reason: 'route_next', targetRefs: [theoryTopicForDeck(deckSlug)], source: 'mini_lesson' }`
(usa los literales que permita el tipo). En el compositor añádelo como
candidato **después** de `study-deck` para que no lo desplace.
Test: con tema débil `theory:a1-articulos-basicos` propone `articles-a-an-the`.

**Verify**: `pnpm vitest run lib/practice/daily-plan` → all pass. `pnpm audit:learning-loop` → `0 issues`.

### Step 4: Cierre

**Verify**: `pnpm type-check && pnpm lint` → exit 0.

## Done criteria

- [ ] Tests listados pasan
- [ ] `grep -rn "mini-lesson-step" lib/practice/daily-plan/composer.ts` → ≥1
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Los extractos no coinciden.
- `novelty-budget.test.ts` falla por el candidato nuevo: reporta los números; no ajustes cuotas.

## Maintenance notes

- Una mini-lección solo puede entrar al plan si tiene mazo equivalente; para las que no, añadir la equivalencia en `theory-targets.ts` es el camino, no un matching por texto.
