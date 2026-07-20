# Plan 062: Atribuir cada resultado a la palabra, contraste y skill correctos

> **Executor instructions**: Antes de cambiar SRS, prueba la identidad emitida por cada generador. Un ejercicio grupal no puede producir una calificación individual arbitraria. Actualiza la fila 062 al terminar.
>
> **Drift check (run first)**: `git diff --stat c779781b..HEAD -- lib/lexicon/exercises.ts lib/exercises/generators/match-pairs.ts lib/phoneme-practice app/(authenticated)/practice/sounds lib/progress/activity-hub.ts lib/practice/types.ts`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: 061
- **Category**: bug
- **Planned at**: commit `c779781b`, 2026-07-19
- **Progress**: DONE (2026-07-20 on `codex/062-evidence-attribution`)

## Why this matters

El scheduler solo es útil si sabe qué entidad fue evaluada. Dictionary mezcla ids del catálogo con UUIDs de `word_bank`, `match_pairs` atribuye un resultado grupal a la primera palabra y Sound Lab registra la sesión completa en el primer contraste configurado. Esas señales contaminan dominio, sonidos débiles y recomendaciones.

## Current state

- `lib/lexicon/exercises.ts:40` publica `sourceRef: { source: 'word_bank', id: word.id }`, aunque `word.id` pertenece al catálogo léxico.
- `lib/word-bank/srs-queries.ts` interpreta ese id como PK UUID de `word_bank`.
- `lib/exercises/generators/match-pairs.ts:97` usa el primer registro como `sourceRef` para una respuesta agregada, pese a que el archivo reconoce que no es una calificación uno-a-uno.
- `lib/phoneme-practice/mixed-session.ts:46-79` calcula el contraste débil, pero en `129-132` descarta el resultado; los ejercicios no llevan `contrastId` explícito.
- `app/(authenticated)/practice/sounds/sound/[soundId]/page.tsx:51-82` carga y actualiza solo el primer contraste del sonido.
- `lib/progress/activity-hub.ts:32-64` clasifica skills con listas parciales; slugs nuevos pueden no contribuir o recibir tags por contexto que no corresponden.

## Target contract

- `sourceRef` usa ids del namespace que declara; una referencia `word_bank` siempre es su UUID real.
- Un resultado contiene cero, una o varias atribuciones explícitas con outcome por entidad; cero significa “no produce SRS”.
- Todo ejercicio fonémico que modifica contraste incluye `contrastId`; la sesión agrupa resultados por ese id.
- `ExerciseSlug → SkillTag[]` es una matriz exhaustiva comprobada por TypeScript.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Dictionary | `pnpm exec vitest run lib/lexicon lib/exercises/generators lib/word-bank hooks/__tests__/useLexiconPracticeSession.test.tsx` | pass |
| Sounds | `pnpm exec vitest run lib/phoneme-practice app components/practice lib/progress` | selected tests pass |
| Typecheck | `pnpm type-check` | exit 0 |

## Scope

**In scope**: exercise result/source identity types, Dictionary adapters, `match_pairs` attribution, phoneme session builder/page completion, exhaustive skill tags and tests.

**Out of scope**: changing SM-2 math; bulk-correcting historical rows by guessing; acoustic scoring; UI redesign; adding new exercise formats beyond metadata needed for attribution.

## Git workflow

- Branch: `codex/062-evidence-attribution`.
- Suggested commit `fix(practice): attribute evidence to canonical targets`.
- Stage explicit paths only.

## Steps

### Step 1: Define a typed attribution contract ✅

**Landed**: `lib/practice/attribution.ts` + optional `attribution` / `attributionVersion` on `PracticeAnswer`.

### Step 2: Preserve Dictionary content-to-bank identity ✅

**Landed**: `bankId` on sentence_context sources; `sourceRef` = `word_bank`+UUID or `lexicon`+catalog; `toWordEntry` + lexicon hook join; UUID gate in `savePracticeAnswer`.

### Step 3: Fix group exercise semantics ✅

**Landed**: `match_pairs` → `attributeGroupResult({ mode: 'non_srs' })` via `resolveAnswerAttribution`; SRS blocked when `srsEligible === false`; lexicon page no longer invents group penalties.

### Step 4: Carry contrast identity through Sound Lab ✅

**Landed**: `buildAdaptiveSession` stamps `contrastId` from weakest contrast; adapters + submit payload; `finishAttributedContrastSessions` groups updates; Sound Lab page uses all contrast progress.

### Step 5: Make skill classification exhaustive ✅

**Landed**: `lib/progress/skill-matrix.ts` (`satisfies Record<ExerciseSlug, readonly SkillTag[]>`); `deriveSkillTags` uses matrix only (context does not invent skills).

### Step 6: Quarantine historical ambiguity ✅

**Landed**: `attribution` + `attributionVersion` merged into `exercise_payload`; `isAttributedTargetEvidence` / `isLegacyAnswerPayload` helpers + tests.

## Done criteria

- [x] Every SRS-eligible result has canonical target identity.
- [x] Dictionary never passes a catalog id as a bank UUID.
- [x] Group exercises are per-target or explicitly non-SRS.
- [x] Contrast updates are independent of array/config order.
- [x] Every exercise slug has an explicit skill mapping.
- [x] Focused tests and typecheck pass.

## STOP conditions

- The UI does not expose enough per-item information to grade a group exercise; mark it non-SRS instead of inferring.
- Historical rows lack deterministic ids; do not mass rewrite them.
- Sound exercises combine contrasts without identifying which target was evaluated; change generation first.
- Fixing identity appears to require changing scheduler math; keep that in plan 061.

## Maintenance notes

Treat target identity as part of the exercise API, not analytics decoration. New exercise generators must ship with attribution and skill-matrix tests.
