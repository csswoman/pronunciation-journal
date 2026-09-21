# Plan 011: El Plan diario incluye temas vencidos y el repaso de temas no inventa targets

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- lib/review/topic-review-step.ts lib/review/__tests__/topic-review-step.test.ts lib/practice/daily-plan/composer.ts lib/practice/daily-plan/fetchers.ts lib/practice/resolve-attribution.ts lib/practice/queries.ts lib/review/queue-count-queries.ts lib/review/client-queries.ts`
> Ante discrepancia con "Current state", STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (cambia la composición del plan diario; los slots están acotados)
- **Depends on**: none
- **Category**: correctness
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

El contrato (`docs/architecture/integrated-learning-loop.md`, "Política de
selección") pone como prioridad 1 del Plan diario "repasos vencidos" de todos
los dominios, pero el compositor nunca consulta `topic_srs`: un alumno con 20
conceptos de gramática vencidos recibe un plan sin ninguno, y Repaso y Daily
discrepan sobre qué está pendiente. Además, el paso de repaso de temas
atribuye cada ejercicio a un `text_fragments` inexistente
(`grammar-deck:<slug>`), creando filas SRS fantasma y contaminando
`answer_history.content_id`; y no lleva `selection.targetRefs`, así que el
plan no puede deduplicarlo ni reconciliarlo.

## Current state

### A. Atribución fantasma — `lib/review/topic-review-step.ts:6-25`

```ts
export function buildTopicReviewStep(topic: string, deckSlug: string, deck: GrammarStudyDeckData): DailyStep | null {
  const errorCorrection = generateErrorCorrectionFromDeck(deckSlug, topic, deck, 1)
  const quiz = deck.quiz?.slice(0, 3 - errorCorrection.length) ?? []
  if (quiz.length === 0 && errorCorrection.length === 0) return null
  const sourceRef = { source: 'text_fragments' as const, id: `grammar-deck:${deckSlug}` }
  const multipleChoice = quiz.map((question, index) => fromGenericExercise({
    id: `topic-review:${deckSlug}:${index}`, type: 'multiple_choice' as const, sourceRef,
    topic: normalizeReviewTopic(topic), question: question.q, options: question.options,
    answerIndex: question.answer, explanation: question.explain,
  }, 'review'))
  ...
  return { id: `review_topic:${deckSlug}`, kind: 'concept', title: deck.meta.title, subtitle: topic, icon: 'book-open', exercises, estMinutes: 3 }
}
```

`lib/practice/resolve-attribution.ts:97-104`: cualquier `ref.source === 'text_fragments'`
produce un outcome `{ namespace: 'text_fragments', id }`.
`lib/practice/queries.ts:180-183`: `allowSrs && source === 'text_fragments'` → `upsertFragmentSrs(id, grade)` (Dexie).
Línea 189: además `enqueueTopicSRSUpdate(userId, normalizedTopic, grade)` (el outcome real).

Test: `lib/review/__tests__/topic-review-step.test.ts`.

### B. Daily sin `topic_srs` — `lib/practice/daily-plan/composer.ts:85-102`

```ts
] = await Promise.all([
  getAllSounds(), fetchNewWords(userId, ...), fetchDueReviewWords(userId, ...), fetchSavedOrFamiliarWords(userId, ...),
  fetchDueSounds(userId), fetchWeakestSoundProgress(userId), db.learningState.get(userId).catch(() => null),
  readCompletedLessons().catch(() => []), getWordCategoryIndex(), getEffectiveLearnerLevel(userId),
])
```
Línea 195: `const hasDueSrs = dueWords.length > 0 || dueSounds.length > 0 || dueChunkStep !== null`.
`grep -rn topic_srs lib/practice/daily-plan/` → nada.

Existe el conteo servidor `lib/review/queue-count-queries.ts:42-57` (`countDueTopicsServer`)
con la consulta correcta: `topic_srs where user_id = ? and srs_status in ('review','mastered') and next_review_at <= now`.
La lectura cliente de temas vencidos, si existe, está en `lib/review/client-queries.ts`
(busca `topic` allí y en `lib/srs/`); el paso de repaso de temas se construye en
`lib/review/session-plan.ts` a partir de `buildTopicReviewStep`, y para obtener
el deck usa `deckSlugForTopic` (`lib/practice/topic-decks.ts`) + `getDeckBySlug`
(`lib/courses/grammar-deck/decks`).

Selección: `lib/practice/daily-plan/policy.ts:70-95` deduplica por
`selection.targetRefs` y limita `reason === 'due'` a `maxDueSteps`
(`MAX_DUE_STEPS` en `constants.ts`). Los candidatos se crean en el compositor
con `{ step, selection: { reason, targetRefs, source } }` (ver cómo se hace
para `dueChunkStep` en las líneas ~180-260 del compositor).

Tests: `lib/practice/daily-plan/__tests__/policy.test.ts`, `grammar-slot.test.ts`,
`selectors.test.ts`.

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm vitest run lib/review lib/practice` | all pass |
| Loop audit | `pnpm audit:learning-loop` | `OK (..., 0 issues)` |

## Scope

**In scope**:
- `lib/review/topic-review-step.ts` y su test
- `lib/practice/daily-plan/composer.ts`, `lib/practice/daily-plan/fetchers.ts` (añadir `fetchDueTopics`), `lib/practice/daily-plan/__tests__/` (nuevo `due-topics.test.ts`)
- `lib/review/client-queries.ts` solo si no existe ya un lector cliente de temas vencidos

**Out of scope**:
- `lib/practice/resolve-attribution.ts` y `lib/practice/queries.ts` — no cambiar la semántica de `text_fragments`; el arreglo es dejar de emitir el ref falso.
- `lib/review/session-plan.ts` — Repaso ya funciona; solo se corrige el paso.
- Limpieza de filas Dexie `srsData` con id `fragment:grammar-deck:*` (inertes; follow-up).
- `MAX_DUE_STEPS` y `RESERVED_CHUNK_NEW_SLOTS`.

## Git workflow

- Rama: `advisor/011-daily-topic-srs` desde `dev`.
- Commits: `fix(review): stop attributing topic review to a phantom text fragment`, `feat(daily): include overdue grammar topics as due candidates`.

## Steps

### Step 1: El paso de repaso de temas deja de inventar un fragment

1. En `topic-review-step.ts` elimina `sourceRef` y su uso en
   `fromGenericExercise`; el `topic: normalizeReviewTopic(topic)` ya produce el
   outcome canónico. Comprueba que `generateErrorCorrectionFromDeck` no añade
   por su cuenta un `sourceRef` de `text_fragments` (abre
   `lib/exercises/generators/error-correction.ts` y busca `sourceRef`); si lo
   hace con el mismo id `grammar-deck:`, elimínalo también allí (añádelo al
   scope en tu commit y anótalo).
2. Añade al `DailyStep` devuelto:
   ```ts
   selection: { reason: 'due', targetRefs: [`topic:${normalizeReviewTopic(topic)}`], source: 'topic_srs' }
   ```
   Comprueba el tipo de `selection` en `lib/practice/types.ts` (o donde
   esté `DailyStep`) y usa exactamente los literales permitidos para `source`;
   si `'topic_srs'` no es un literal permitido, añádelo a la unión.
3. En `topic-review-step.test.ts` añade: ningún ejercicio tiene
   `sourceRef.source === 'text_fragments'`; el paso lleva `selection.targetRefs` con el topic.

**Verify**: `pnpm vitest run lib/review` → all pass.
**Verify**: `grep -rn "grammar-deck:\${" lib/review lib/exercises` → 0.

### Step 2: Fetcher de temas vencidos para el cliente

En `lib/practice/daily-plan/fetchers.ts` añade `fetchDueTopics(userId, limit = 3): Promise<Array<{ topic: string; nextReviewAt: string }>>`.
Fuente: Dexie primero (si hay tabla local de `topic_srs`; busca `topicSrs`
en `lib/db/index.ts`), y si no, el cliente Supabase **a través de un módulo
`queries.ts`** existente (`lib/review/client-queries.ts` o `lib/srs/queries.ts`;
nunca desde el compositor). Misma condición que `countDueTopicsServer`.
Ordena por `next_review_at` ascendente.

**Verify**: `pnpm type-check` → exit 0. `pnpm lint` → exit 0 (la regla D de ESLint fallará si pones Supabase fuera de `*queries*.ts`).

### Step 3: El compositor incluye los temas vencidos como candidatos `due`

1. Añade `fetchDueTopics(userId)` al `Promise.all` del compositor.
2. Para cada tema (máximo 2): `deckSlugForTopic(topic)` → `getDeckBySlug(slug)` →
   `buildTopicReviewStep(topic, slug, deck)`; descarta nulos. Añade cada paso
   como candidato con `selection` tal como lo devuelve el paso.
3. Incluye `dueTopicSteps.length > 0` en `hasDueSrs`.
4. Crea `lib/practice/daily-plan/__tests__/due-topics.test.ts` (patrón:
   `grammar-slot.test.ts`, que ya mockea fetchers): con un tema vencido y sin
   otras cosas vencidas, el plan contiene un paso `review_topic:<slug>`; con
   `MAX_DUE_STEPS` alcanzado por palabras, el tema no desplaza más allá del
   límite (verifica que `policy.test.ts` cubre el tope y añade un caso si no).

**Verify**: `pnpm vitest run lib/practice/daily-plan` → all pass.
**Verify**: `pnpm audit:learning-loop` → `OK`.

### Step 4: Cierre

**Verify**: `pnpm type-check`, `pnpm lint` → exit 0.

## Test plan

- `topic-review-step.test.ts`: sin `text_fragments`; con `selection`.
- `due-topics.test.ts`: inclusión y tope.
- Suite existente de `lib/practice/daily-plan` sigue verde (comprueba
  especialmente `novelty-budget.test.ts` y `policy.test.ts`).

## Done criteria

- [ ] `pnpm type-check`, `pnpm lint` exit 0
- [ ] `pnpm vitest run lib/review lib/practice` all pass
- [ ] `grep -rn "text_fragments" lib/review/topic-review-step.ts` → 0
- [ ] `grep -rn "fetchDueTopics" lib/practice/daily-plan/composer.ts` → ≥1
- [ ] `pnpm audit:learning-loop` → `0 issues`
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Los extractos no coinciden.
- No existe ningún lector cliente de `topic_srs` y añadirlo requiere una
  tabla Dexie nueva (cambio de versión de esquema en `lib/db/index.ts`):
  reporta; el esquema Dexie tiene su propio protocolo de migración.
- `novelty-budget.test.ts` o `policy.test.ts` fallan porque el nuevo
  candidato `due` cambia la proporción 70/30: reporta con los números; no
  ajustes constantes.

## Maintenance notes

- Los temas vencidos compiten por `MAX_DUE_STEPS` con palabras, sonidos y
  chunks. Si el backlog de temas crece, el orden dentro de `due` lo decide
  `rankCandidates` en `policy.ts`; ahí se ajusta la prioridad, no en el compositor.
- Follow-up: filas Dexie `srsData` con clave `fragment:grammar-deck:*` quedan
  inertes; una migración de limpieza es opcional.
- Revisor: confirmar que `answer_history.content_id` de un repaso de tema ya
  no empieza por `text_fragments:grammar-deck:`.
