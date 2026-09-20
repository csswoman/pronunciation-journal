# Plan 013: Los 37 mazos añadidos desde engVid entran en la Ruta o dejan de publicarse

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- public/grammar-decks lib/courses/curriculum.ts lib/courses/grammar-deck lib/content/__tests__/content-integrity.test.ts lib/courses/__tests__/content-audit.test.ts lib/landing/content.ts`
> Ante discrepancia con "Current state", STOP.

## Status

- **Priority**: P1
- **Effort**: M (decisión de producto + trabajo mecánico por mazo)
- **Risk**: LOW
- **Depends on**: none
- **Category**: correctness / content
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

El commit `865381f8` ("add 38 study decks inspired by engVid") dejó 37 mazos
en `public/grammar-decks/` que (a) no están referenciados por ninguna lección
de la Ruta (`COURSE_PATH_CURRICULUM`), (b) no pasan el esquema porque tienen
menos de 6 tarjetas, y (c) se listan igualmente en `/practice/decks` vía
`listAllDecks()`. Dos tests del repo (`content-integrity` y `content-audit`)
fallan por esto desde entonces y bloquean `pnpm test` en `prepush`. Para el
usuario es contenido que aparece en el catálogo pero que ningún objetivo
canónico, plan diario ni checkpoint conoce, y que puede no renderizarse.

## Current state

Slugs huérfanos (37; `a1-plural-nouns-spelling` también está huérfano pero sí pasa el esquema):

```
a1-plural-nouns-spelling a2-comparatives-superlatives a2-irregular-verbs-table
a2-literal-phrasal-verbs a2-prepositions-at-on-in-time a2-riddles-wordplay a2-silent-letters
academic-142-adjectives academic-word-list b1-commas-punctuation b1-common-collocations-make-do
b1-gerunds-and-infinitives b1-homophones-homographs b1-online-texting-abbreviations
b1-phrasal-verbs-commands b1-prepositional-verbs-dependent b1-shortened-words-spoken
b1-stative-verbs b1-suffixes-ful-less b1-verbs-ending-en b2-avoiding-redundancies
b2-common-proverbs b2-crime-justice-vocabulary b2-formal-vs-informal b2-open-ended-questions
b2-persuasive-speaking b2-stress-changes-meaning b2-suffixes-ize-ization biz-basic-qa
biz-common-interview-qa biz-manager-collocations biz-people-idioms biz-professional-emails
biz-resume-cv-tips biz-situational-interview-qa ielts-task-1-letters
pronunciation-on-sound pronunciation-tongue-twisters
```

Causa del fallo de esquema (verificado parseando los 314 archivos con
`GrammarStudyDeckSchema`): en los 37, `cards` tiene menos de 6 elementos
(`Too small: expected array to have >=6 items`). Estos archivos llevan además
`"isGenerated": true` en la raíz.

Tests que fallan:
- `lib/content/__tests__/content-integrity.test.ts:86-89` — "every grammar deck is referenced by the curriculum".
- `lib/courses/__tests__/content-audit.test.ts:11-30` — "finds no structural content issues" (`invalid-schema`).

Catálogo: `app/(authenticated)/practice/decks/page.tsx:7` → `listAllDecks()`
(`lib/courses/grammar-deck/decks.ts`). `getDeckBySlug(slug)` es el lector
por slug (mira en el mismo archivo si valida con el esquema o devuelve el
JSON crudo; determina qué ve hoy el usuario al abrir uno de los 37).

Ruta: `lib/courses/curriculum.ts` construye niveles con `buildLevel(...)` y
entradas `*CourseInputs()`; mira `a1CourseInputs()` y cómo una lección
declara su `lessonSlug` (debe coincidir con el nombre del archivo del mazo).
Tracks no CEFR existentes: `biz-*`, `tech-*`, `chunk-*`, `cs-*` (ver
`lib/courses/types.ts` `CoursePathTrackId`).

Landing: `lib/landing/content.ts:34` publica el número de mazos (ver plan 005).

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Tests de contenido | `pnpm vitest run lib/content/__tests__/content-integrity.test.ts lib/courses/__tests__/content-audit.test.ts` | all pass |
| Loop audit | `pnpm audit:learning-loop` | `0 issues` |
| Typecheck | `pnpm type-check` | exit 0 |

## Scope

**In scope**:
- `public/grammar-decks/<37 archivos>.json` (completar a ≥6 tarjetas **o** mover fuera de `public/`)
- `lib/courses/curriculum.ts` (añadir las lecciones a su nivel/track)
- `lib/learning-loop/content-manifest.ts` solo si el manifest no recoge automáticamente las lecciones nuevas de la Ruta (comprueba con `pnpm audit:learning-loop` tras el cambio)
- `lib/landing/content.ts` (actualizar el conteo si cambia)

**Out of scope**:
- Cambiar el mínimo de 6 tarjetas del esquema — es una decisión de calidad de contenido; no bajar el umbral para que pase el test.
- `lib/courses/grammar-deck/decks.ts` (lector).
- El tercer test que falla (`EssentialWordsSession.test.tsx`, mock sin `ensureDbReady`): lo resuelve el propietario.

## Git workflow

- Rama: `advisor/013-orphan-decks` desde `dev`.
- Un commit por decisión: `content(decks): retire generated decks below quality bar` / `feat(courses): add engVid decks to A2–B2 route`.

## Steps

### Step 0: Decisión (STOP si no la conoces)

Este plan requiere una decisión del propietario por mazo o por grupo:
**A) completar** el mazo a ≥6 tarjetas de calidad y enlazarlo a la Ruta, o
**B) retirar** el archivo de `public/grammar-decks/` (moverlo a
`scripts/content/drafts/grammar-decks/` para no perderlo). Si no tienes la
decisión, aplica **B a todos** (es reversible y deja el catálogo honesto) y
repórtalo.

### Step 1: Retirar (opción B)

1. `git mv public/grammar-decks/<slug>.json scripts/content/drafts/grammar-decks/<slug>.json` para cada slug de la lista que no se vaya a completar.
2. Ejecuta `pnpm content-index:generate` si el índice de contenido incluye mazos (revisa `scripts/generate-content-index.ts`).

**Verify**: `pnpm vitest run lib/content/__tests__/content-integrity.test.ts lib/courses/__tests__/content-audit.test.ts` → all pass (o solo quedan los mazos de la opción A pendientes).

### Step 2: Completar y enlazar (opción A, por mazo)

1. Añade tarjetas hasta ≥6 siguiendo la estructura de un mazo válido del mismo
   nivel (p. ej. `public/grammar-decks/a1-verbo-to-be.json`): cada tarjeta con
   `id` único, `tag`, `title`, `lede`, `blocks` de tipos permitidos por el
   esquema (`conjugation`, `verb-table`, `contrast`, `pairs`, `rules`, …;
   lista completa en `lib/courses/grammar-deck/schema.ts`). Incluye un `quiz`
   de 3–5 preguntas con `explain` no vacío (el audit marca `empty-explanation`).
   Elimina `"isGenerated": true` si el esquema es estricto; si no lo es,
   puedes dejarlo.
2. En `lib/courses/curriculum.ts` añade la lección al nivel correspondiente
   (`a2`, `b1`, `b2`) o al track (`biz`, `academic`/`ielts` si existe; si no
   existe un track, STOP y reporta: crear un track es un cambio mayor).
3. Ejecuta `pnpm audit:learning-loop` y confirma que la lección aparece en
   `course_path`/`grammar_deck` con `0 issues`.

**Verify**: los dos tests de contenido pasan; `pnpm audit:learning-loop` → `0 issues`.

### Step 3: Cifra de landing y cierre

Actualiza `lib/landing/content.ts` con `ls public/grammar-decks | wc -l`.

**Verify**: `pnpm type-check` → exit 0. `pnpm vitest run lib/landing` (si existe el test del plan 005) → pass.

## Test plan

- Los dos tests de contenido existentes son la verificación; no añadir tests.
- Si se adopta la opción A, `lib/courses/__tests__/grammar-deck-coverage.test.ts` debe seguir en verde.

## Done criteria

- [ ] `pnpm vitest run lib/content/__tests__/content-integrity.test.ts lib/courses/__tests__/content-audit.test.ts` all pass
- [ ] `pnpm audit:learning-loop` → `0 issues`
- [ ] Ningún archivo de `public/grammar-decks/` tiene `cards.length < 6`
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Un slug de la lista está referenciado por algún otro sitio (`grep -rn "<slug>" lib components app --include=*.ts --include=*.tsx` distinto de tests): reporta antes de retirarlo.
- Falta un track para `academic-*`/`ielts-*`.
- `getDeckBySlug` sirve mazos inválidos sin validar y hay usuarios con progreso (`lesson_completions`) sobre esos slugs: reporta; retirar borraría contexto de esas filas.

## Maintenance notes

- Regla para contenido nuevo: ningún mazo entra en `public/grammar-decks/` sin
  su lección en `curriculum.ts` y sin pasar `pnpm audit:course-content`.
  Esos dos tests ya lo vigilan; el fallo actual lleva ignorado desde `865381f8`.
