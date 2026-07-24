# Plan 068: Construir una Ruta de pronunciación basada en transferencia

> **Executor instructions**: Crea una ruta pedagógica distinta pero conectada con Courses, Sound Lab, Daily y Coach. Reutiliza contenido existente antes de autorar más. No desbloquees mastery por navegación/completion. Actualiza la fila 068 al terminar.
>
> **Drift check (run first)**: `git diff --stat 99c871cb..HEAD -- app/(authenticated)/courses components/courses app/styles/course-path.css lib/courses lib/pronunciation public/lessons public/grammar-decks components/theme/sidebar/navConfig.ts docs`
> El working tree del 2026-07-20 contiene cambios de plan 059 en `CoursePathProgressClient.tsx`; este plan no debe ejecutarse hasta reconciliarlos. Si siguen sin commit, detente y pide al owner aislarlos.

## Status

- **Priority**: P1 product/pedagogy
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/059-separate-learning-evidence-and-lesson-completion.md, plans/063-build-pronunciation-production-spine.md, plans/066-create-pronunciation-target-registry.md, plans/067-build-pronunciation-diagnostic.md
- **Category**: direction
- **Planned at**: commit `99c871cb`, 2026-07-20

## Why this matters

La Ruta actual declara que gramática y Sound Lab avanzan “en paralelo”, y el vínculo de pronunciación suele ser un enlace por nivel. Eso no comunica qué aprender primero ni exige transferencia de palabra a frase y conversación. Una Ruta de pronunciación explícita debe convertir el registro de targets y el diagnóstico en una secuencia visible, sin duplicar contenido ni crear otro sistema de progreso.

## Current state

- `components/courses/CoursePathPage.tsx` presenta una sola “Ruta de aprendizaje” CEFR y un aside que enlaza genéricamente a `/practice/sounds`.
- `lib/courses/curriculum.ts:542` dice: “La ruta trabaja la gramática y Sound Lab trabaja la pronunciación”.
- `lib/courses/types.ts:47` solo marca `soundLab?: boolean`; el plan 066 lo reemplazará progresivamente con target ids.
- `GrammarPronunciationBlock.tsx` enlaza `focus=<ipa>` y ofrece modelos TTS, pero no representa un trayecto completo ni criterio de avance.
- El track `connected-speech` ya aporta reductions, linking, elision y assimilation; `public/lessons` contiene stress e intonation. Deben reutilizarse.
- `CoursePathPage` usa `PageLayout`, `PageHeader`, semantic tokens y jerarquía editorial; la nueva ruta debe seguir ese patrón y el tema dinámico.
- **Señal consumida**: la ruta deriva estados de lección de la completion del plan 059 y de los `SpokenAttempt` scoreados del plan 063 (señal `stt_intelligibility`, reconocimiento de palabras vía STT). No crea evidencia nueva ni tabla de progreso propia (out of scope). No muestra ni depende de score acústico de stress/ritmo/intonation hasta la decisión del plan-071 benchmark.

## Route model

Crear `PronunciationPathCurriculum` derivado del registro 066, con cinco etapas:

1. Sonidos y contrastes de alto impacto.
2. Sílabas y word stress.
3. Sentence stress, ritmo y weak forms.
4. Linking, reductions, elision e assimilation.
5. Intonation y transferencia a situaciones reales.

Cada unidad declara targets, contenido teórico, práctica perceptiva, producción controlada, frase variada, misión de transferencia y evidencia requerida. CEFR adapta complejidad/material, pero no bloquea explorar.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Curriculum | `pnpm exec vitest run lib/pronunciation/path lib/courses/__tests__/curriculum.test.ts` | all selected tests pass |
| Route components | `pnpm exec vitest run components/courses/pronunciation-path` | all selected tests pass |
| Content audit | `pnpm audit:course-content` | exit 0 |
| Typecheck | `pnpm type-check` | exit 0 |
| Design tokens | `pnpm lint:design-tokens` | exit 0 |
| Accessibility | `pnpm test:a11y --grep "pronunciation path"` | targeted Playwright tests pass |

## Suggested executor toolkit

- Use `better-ui`, `web-design-guidelines` and `vercel-react-best-practices` after reading all mandatory design documents.
- Do not invoke image generation; this surface should reuse the established editorial course language and icon system.

## Scope

**In scope**:
- `lib/pronunciation/path/*` curriculum derivation and recommendation helpers.
- New `/courses/pronunciation` route and `components/courses/pronunciation-path/*`.
- Links from Courses, Sound Lab, diagnostic result and Daily reasons.
- Reuse/annotation of existing lessons and grammar decks; minimal new metadata only.
- Progress derived from canonical completion/evidence contracts, tests and route docs.

**Out of scope**:
- Replacing the grammar Course Path.
- Copying all course CSS/components into a second implementation.
- Creating new SRS or completion tables.
- Requiring acoustic success for targets not yet validated by the plan-071 benchmark.
- Authoring dozens of new lessons before the coverage audit identifies a concrete gap.

## Git workflow

- Branch: `codex/068-pronunciation-route` after plan-059 changes are committed/reconciled.
- Suggested commits: pure route model, route/UI, integrations/tests.
- Suggested message: `feat(courses): add pronunciation transfer path`.
- Stage exact paths only; do not push without instruction.

## Steps

### Step 1: Derive the route from canonical targets

Implement pure helpers that group registry targets into the five stages, preserve prerequisites and filter/recommend by diagnostic priorities and existing evidence. Do not hardcode duplicate target definitions in the UI.

**Verify**: tests assert deterministic stages, acyclic prerequisites, all recommended ids exist and no target appears twice unintentionally.

### Step 2: Audit reusable content and expose gaps

Map each target to existing theory/model/practice/transfer assets. Produce a checked coverage matrix with states `complete`, `missing-model`, `missing-production`, `missing-transfer`. Only author content for P1 gaps blocking the first recommended path.

**Verify**: `pnpm audit:course-content` prints category coverage and fails on dangling refs, not on explicitly documented deferred gaps.

### Step 3: Define evidence-based lesson states

Use plan 059 completion for “contenido terminado” and plan 063 attempts for objective progress. Derive `not_started|learning|ready_for_transfer|retained` without treating route visits or an unscored shadowing attempt as mastery. Support low-confidence `needs_evidence` from diagnostic 067.

**Verify**: pure tests cover completion-only, perception-only, controlled-production, unscored, transfer-success and delayed-retention states.

### Step 4: Build the route surface

Create `/courses/pronunciation` using `PageLayout`/`PageHeader`, compact stage navigation, one active unit and progressive disclosure. Show one next action, why it is recommended and direct links to exact target practice. Use Spanish UI, semantic tokens, DM Sans/Mono/Andika rules and 44px touch targets. **Gate any route copy that states a pronunciation outcome/level behind a feature flag** so it can be withdrawn without a data migration if the plan-071 decision retires acoustic-adjacent claims; unit-state derivation (from completion/evidence) stays unflagged, only outcome phrasing is flagged. Frame progress as intelligibility/target contrast, never as “native” or accent eradication.

**Verify**: component tests cover empty/no-diagnostic, recommended, in-progress and completed states; a test asserts that with the copy flag off no unit renders a pronunciation-level/accuracy claim; token lint and targeted a11y pass.

### Step 5: Connect the existing surfaces

Add contextual links:

- Courses pronunciation blocks → exact route target;
- Sound Lab completion → next phrase/route action;
- diagnostic result → first recommended unit;
- Daily target → route lesson or exact practice;
- route transfer step → mission contract reserved for plan 070.

Keep old `/practice/sounds?focus=` deep links working.

**Verify**: route/link tests assert canonical target ids survive navigation and compatibility URLs still resolve.

### Step 6: Adapt complexity without hard-locking CEFR

Use CEFR/profile to select vocabulary, phrase length and scenario complexity, not to hide phonetic fundamentals. Allow explore/review at any stage. Make advanced connected speech require appropriate prerequisite evidence, with an explicit override rather than a dead lock.

**Verify**: A1/C1 fixtures get different material for the same target; both can access it and progress identity remains the same.

### Step 7: Update navigation and docs conservatively

Expose the route from Courses and Sound Lab first; do not add another primary sidebar item unless navigation capacity/user testing justifies it. Update architecture/pedagogy docs with the five-stage loop and source-of-truth matrix.

**Verify**: navigation snapshots pass and docs contain links to target registry, diagnostic, completion and SpokenAttempt contracts.

## Test plan

- Model pure route tests after current curriculum tests; model UI tests after `CoursePathPage.test.tsx`.
- Cover no diagnostic, partial evidence, unavailable acoustic dimension (rendered as `not_measured`, never a fabricated score), prerequisite override and exact Daily link.
- Add Playwright keyboard/landmark/focus checks plus manual light/dark/custom-hue and mobile/desktop validation.
- Verification: every command in “Commands you will need” passes.

## Done criteria

- [ ] `/courses/pronunciation` exposes five coherent transfer stages.
- [ ] The route derives targets from registry 066 and reuses existing content.
- [ ] Completion, objective evidence, transfer and retention remain distinct.
- [ ] Diagnostic and Daily lead to the exact recommended target.
- [ ] Existing Sound Lab deep links remain compatible.
- [ ] No fixed brand colors/fonts/local radii bypass the theme contract.
- [ ] Focused tests, content audit, a11y, typecheck and token lint pass.

## STOP conditions

- Plan 059 changes still overlap uncommitted course progress files.
- Registry 066 or diagnostic 067 is absent/equivalent behavior cannot be verified.
- A stage requires inventing target ids or a new completion source.
- Existing content is insufficient for the first path and more than three new lesson assets are required; report the exact coverage gaps first.
- Visual implementation needs local colors/radii to work; fix semantic tokens instead.
- A unit state or route copy would imply phoneme-level accuracy, an acoustic stress/rhythm/intonation score, or a single “native” accent goal before the plan-071 benchmark decision; keep unmeasured dimensions as `not_measured` and frame goals as intelligibility/target contrast.

## Maintenance notes

The route is an orchestrator over target/content/evidence contracts, not another source of truth. Future content should land by registering a target reference and passing coverage tests, not by editing route JSX directly.
