# Plan 066: Crear un registro canónico de objetivos de pronunciación

> **Executor instructions**: Sigue este plan paso a paso. Ejecuta cada verificación antes de continuar. Este plan define identidad y cobertura; no cambia SRS ni promete evaluación acústica. Al terminar, actualiza la fila 066 en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 99c871cb..HEAD -- lib/pronunciation lib/phoneme-practice/types.ts lib/courses/types.ts lib/courses/buildCurriculum.ts lib/courses/curriculum.ts lib/courses/grammar-deck/types.ts public/grammar-decks public/lessons docs/architecture`
> Si cambió un archivo in-scope, compara los extractos de “Current state” con el código actual. Ante una incompatibilidad semántica, detente y reporta; no inventes un segundo namespace.

## Status

- **Priority**: P1 foundation
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/062-fix-exercise-evidence-attribution.md
- **Category**: tech-debt, direction
- **Planned at**: commit `99c871cb`, 2026-07-20

## Why this matters

La app ya tiene fonemas, contrastes, word stress, connected speech e intonation, pero no comparte una identidad única para esos objetivos. Sound Lab persiste `contrast_id`, las lecciones usan un booleano `soundLab`, los grammar decks exponen IPA libre y el coach trabaja con frases. Sin un registro común, diagnóstico, currículo, evidencia y repaso no pueden apuntar al mismo target de forma verificable.

## Current state

- `lib/phoneme-practice/types.ts:146-150` modela solo progreso segmental mediante `contrast_id = "ipaA|ipaB"`.
- `lib/courses/types.ts:47` reduce el vínculo de una lección a `soundLab?: boolean`; no identifica qué habilidad fonética trabaja.
- `lib/courses/grammar-deck/types.ts:90` acepta `sounds?: string[]`, pero no distingue fonema, contraste, stress, ritmo o intonation.
- `lib/courses/curriculum.ts:521-530` contiene un track connected-speech con reductions/linking/elision/assimilation; `:542` todavía describe gramática y Sound Lab como carriles paralelos.
- `public/lessons/` ya contiene `word-stress-basics.json`, `sentence-stress.json`, `intonation-questions.json`, `connected-speech.json` y otros assets reutilizables.
- Convención: slugs/ids estables viven en módulos de dominio; content JSON referencia esos ids, y los tests de `lib/courses/__tests__/content-audit.test.ts` validan cobertura autoral.
- **Señal consumida**: este plan no consume ninguna señal de evaluación en runtime; solo declara *qué capacidades* de evidencia (perception, controlled production, contextual production, `stt_intelligibility`, y dimensiones acústicas opcionales) son válidas por target. La única señal de scoring hoy disponible es `stt_intelligibility` (reconocimiento de palabras vía STT); stress/ritmo/intonation quedan marcados como no medidos acústicamente hasta que el plan 071 tome su decisión de ship/partial/no-ship (el 064 validó la dirección pero no autorizó evaluador de producción).

## Target contract

Crear `PronunciationTarget` como unión discriminada con un `id` estable y versionable:

- `segmental.phoneme.<ipa-key>` y `segmental.contrast.<canonical-pair>`;
- `prosody.word-stress`, `prosody.sentence-stress`, `prosody.rhythm`, `prosody.intonation.<pattern>`;
- `connected.reduction.<pattern>`, `connected.linking`, `connected.elision`, `connected.assimilation`;
- los contextos/frases son material de transferencia que referencia targets; no son mastery targets globales por defecto.

Cada target declara categoría, CEFR recomendado, prerrequisitos, modalidades evaluables, señal mínima aceptable y referencias a contenido/práctica. “Scored by STT”, “self-reported” y “acoustically evaluated” deben ser capacidades distintas.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Registry tests | `pnpm exec vitest run lib/pronunciation lib/courses/__tests__/curriculum.test.ts lib/courses/__tests__/content-audit.test.ts` | all selected tests pass |
| Content audit | `pnpm audit:course-content` | exit 0 |
| Typecheck | `pnpm type-check` | exit 0, no TypeScript errors |
| Hard rules | `pnpm audit:hard-rules` | exit 0 |

## Suggested executor toolkit

- Read `PRODUCT.md` and `docs/superpowers/specs/2026-06-02-phoneme-practice-pedagogical-design.md` before assigning categories.
- Use the `supabase` skill only if implementation unexpectedly needs database DDL; this plan should not require it.

## Scope

**In scope**:
- New `lib/pronunciation/targets/types.ts`, `registry.ts`, `content-map.ts` and tests.
- Typed target references in `lib/courses/types.ts`, `lib/courses/buildCurriculum.ts` and grammar-deck types.
- Mechanical annotation of current pronunciation/connected-speech lessons and validation of unresolved refs.
- `docs/architecture/pronunciation-targets.md` describing identity, evaluator capability and ownership.

**Out of scope**:
- Changing user progress tables or SRS formulas.
- Implementing the pronunciation diagnostic, route, chat missions or acoustic evaluator.
- Treating arbitrary phrases as permanent targets.
- Guessing target mappings from title text at runtime; mapping must be authored or fail validation.

## Git workflow

- Branch: `codex/066-pronunciation-target-registry`.
- Commit logical units; suggested message: `feat(pronunciation): define canonical learning targets`.
- Stage exact paths only. Do not push or open a PR unless requested.

## Steps

### Step 1: Write the target identity ADR

Document categories, canonicalization rules, allowed evaluator signals and examples. Preserve existing canonical contrast ids through an adapter rather than migrating them. State that CEFR is a recommendation, not proof of mastery.

**Verify**: `Select-String -Path docs/architecture/pronunciation-targets.md -Pattern 'segmental','prosody','connected','stt_intelligibility','acoustic'` → every required concept has at least one match.

### Step 2: Implement the typed registry

Create a frozen registry keyed by `PronunciationTargetId`. Include pure helpers for lookup, prerequisite traversal, CEFR filtering and canonical contrast adaptation. Unknown ids return a typed error/result; they must never silently fall back to a generic sound.

**Verify**: tests cover unique ids, acyclic prerequisites, canonical contrast order, missing ids and deterministic ordering; registry test command passes.

### Step 3: Add authored target references to course/content types

Add `pronunciationTargetIds?: PronunciationTargetId[]` to course lessons and grammar-deck metadata while retaining `soundLab`/`sounds` as temporary compatibility fields. Update `buildCurriculum` so references survive serialization. Do not infer targets from the boolean.

**Verify**: curriculum tests show referenced ids on a segmental lesson and each connected-speech lesson; typecheck passes.

### Step 4: Map existing content explicitly

Annotate current stress, intonation, linking, reduction, elision, assimilation and high-value TH/schwa lessons. Build `content-map.ts` from authored refs and validate that every mapped file/slug exists. Leave genuinely ambiguous content unmapped with a documented audit entry.

**Verify**: content audit reports zero dangling target/content references and outputs a deterministic coverage summary by category.

### Step 5: Define evidence capabilities per target

For each target, declare which evidence modes are meaningful: perception, controlled production, contextual production, STT intelligibility and optional acoustic dimensions. Mark stress/rhythm/intonation as not acoustically measured until the plan-071 benchmark chooses a validated evaluator (plan 064 validated direction only and enabled no production evaluator).

**Verify**: tests reject a target that claims an unavailable capability and prove all mastery-eligible targets have at least one objective modality. Run `pnpm exec vitest run lib/pronunciation/targets` and confirm a fixture target declaring `acoustic` capability fails validation while an equivalent `stt_intelligibility` target passes.

### Step 6: Remove runtime dependence on vague links

Add adapters so existing `focus=<ipa>` and `sounds[]` deep links resolve through the registry. Emit development/test errors for unresolved refs. Keep legacy fields until all callers migrate; do not delete them in this plan.

**Verify**: existing Sound Lab deep-link tests remain green and new target-id links round-trip deterministically.

## Test plan

- Model registry integrity tests after `lib/courses/__tests__/content-audit.test.ts`.
- Cover duplicate ids, cycles, invalid CEFR, missing content, unsupported evaluator claims and legacy contrast adapters.
- Add one fixture per target family and one deliberately invalid fixture for each validator.
- Verification: all commands in “Commands you will need” pass.

## Done criteria

- [x] One canonical registry covers segmental, prosody and connected-speech targets. (`PRONUNCIATION_TARGETS` in `lib/pronunciation/targets/registry.ts`.)
- [x] Existing contrast ids retain a deterministic adapter. (`contrastIdToTargetId`/`targetIdToContrastId`, `registry.ts:207-254`.)
- [x] Course and grammar content reference target ids explicitly. (`pronunciationTargetIds?: PronunciationTargetId[]` on `lib/courses/types.ts:51` and `lib/courses/grammar-deck/types.ts:94`, legacy `soundLab`/`sounds` kept as deprecated compatibility fields per Step 3/6.)
- [x] Every target declares valid evidence capabilities and prerequisites. (`validateTarget`/`validateRegistry`, `registry.ts:255-333`.)
- [x] Content audit has no dangling references. (`content-map-audit.ts` walks curriculum + content map; `pnpm audit:course-content` passes.)
- [x] Focused tests, typecheck and hard-rule audits pass.
- [x] No files outside scope are staged; `plans/README.md` is updated. (Row 066 already read DONE; this pass only closed this file's own checklist to match.)

## Verification (2026-07-27)

- This file's own Done criteria were never checked off even though `plans/README.md` row 066 already recorded it DONE (2026-07-21) with real detail — pure documentation drift, not missing work.
- Re-ran the plan's own verification commands: `pnpm exec vitest run lib/pronunciation lib/courses/__tests__/curriculum.test.ts lib/courses/__tests__/content-audit.test.ts` (257 passed), `pnpm audit:course-content` (155 passed), `pnpm audit:hard-rules` (all 4 sub-audits pass; RLS audit's non-blocking coverage warning is pre-existing and unrelated to this plan), `pnpm type-check` (clean).
- Spot-checked Step 2/4/6 claims directly in code: `validateTarget`/`validateRegistry` reject unshipped `acoustic` claims and cyclic prerequisites; `content-map-audit.ts` flags `unknown_target`/`missing_file`/`unknown_authored_target`; legacy `contrast_id`/`focus=` links resolve via `lib/pronunciation/targets/legacy-links.ts`.

## STOP conditions

- Existing production ids cannot be mapped without rewriting persisted progress.
- Two current concepts require the same id but different pedagogical meaning; split them and report the decision.
- A target needs an acoustic capability not yet validated (the plan-071 benchmark has not chosen ship/partial-ship); mark it unavailable rather than simulating it.
- Annotation requires runtime title parsing or AI inference; keep the mapping authored.

## Maintenance notes

Every new pronunciation lesson, exercise generator, diagnostic item and mission must reference this registry. Reviewers should reject new free-form target namespaces or mastery claims that do not declare their evidence capability.
