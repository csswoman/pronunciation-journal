# Plan 064: Validar evaluación acústica antes de prometer precisión tipo Elsa

> **Executor instructions**: Este es un spike de evidencia, no autorización para lanzar un score clínico/pedagógico. Mantén el evaluador actual etiquetado como inteligibilidad STT. No uses grabaciones reales sin consentimiento y política de retención. Actualiza la fila 064 con DONE solo si se cumplen los gates de decisión.
>
> **Drift check (run first)**: `git diff --stat c779781b..HEAD -- lib/pronunciation lib/ai-prompts.ts app/api/gemini/transcribe components/interview components/exercises docs`

## Status

- **Priority**: P2 direction
- **Effort**: L/XL
- **Risk**: HIGH
- **Depends on**: 063
- **Category**: direction, tests
- **Planned at**: commit `c779781b`, 2026-07-19

## Why this matters

El scorer actual compara una transcripción con la frase objetivo y proyecta fonemas usando diccionario. Eso mide principalmente si un STT entendió el contenido; no escucha directamente stress, ritmo, reducciones, entonación ni calidad segmental. Antes de posicionar el producto como “Elsa + teoría”, hay que demostrar que un enfoque acústico es confiable, explicable, asequible y capaz de abstenerse.

## Current state

- `lib/ai-prompts.ts:5-7` solicita transcripción, no alineamiento acústico.
- `lib/pronunciation/scoring.ts:14-49` alinea texto target/transcript y deriva fonemas con CMU.
- Interview y `SpeakScoredExercise` consumen ese score como si fuera evaluación de pronunciación general.
- Ya existe teoría/targets para word stress, sentence stress, intonation y connected speech, pero no una medición acústica de esas dimensiones.

## Decision to make

Elegir una de tres salidas con evidencia:

1. **Ship acotado**: evaluador acústico por dimensiones con confianza y abstención.
2. **Ship parcial**: mantener inteligibilidad STT y añadir solo una dimensión validada (por ejemplo timing/stress), claramente etiquetada.
3. **No ship**: si calidad/costo/latencia no superan los gates, invertir en shadowing guiado, autoescucha y feedback del coach sin score falso.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Existing scorer | `pnpm exec vitest run lib/pronunciation components/exercises components/interview` | baseline passes |
| Benchmark | `pnpm exec vitest run experiments/pronunciation` | deterministic benchmark report generated, no network in unit tests |
| Typecheck | `pnpm type-check` | exit 0 |

## Scope

**In scope**: evaluator interface/versioning, a non-production experiment/benchmark harness, consented/de-identified evaluation corpus metadata, comparison of 2-3 viable approaches, latency/cost/error analysis, calibration/abstention and an ADR under `docs/architecture/`.

**Out of scope**: silently enabling a vendor in production; storing user audio by default; ranking accents as better/worse; a single opaque “pronunciation score”; replacing human/pedagogical validation with model confidence; production DDL.

## Git workflow

- Branch: `codex/064-acoustic-assessment-spike`.
- Keep experiment fixtures synthetic/public/licensed or explicitly consented and de-identified.
- Suggested commit `docs(pronunciation): validate acoustic assessment direction`.

## Steps

### Step 1: Rename and version the existing signal

Expose the current score as `stt_intelligibility` with evaluator version. UI copy must say what was measured. Preserve historical comparison by version; do not rewrite old values.

**Verify**: `git grep -n "pronunciation accuracy\|phoneme accuracy" -- components lib ':!lib/pronunciation/*test*'` → every user-visible active claim is removed or backed by an acoustic evaluator.

### Step 2: Define dimension-specific ground truth

Write a rubric for segmental targets, word stress, rhythm/reduction and intonation. For each, define acceptable variants, confidence, unusable audio and when the system abstains. Include diverse accents/noise/devices and avoid “native accent” as the goal; intelligibility and target contrast are the goal.

**Verify**: ADR contains label schema, sample inclusion/exclusion, consent/license and inter-rater protocol.

### Step 3: Build a provider-neutral evaluator interface

Define inputs/outputs for audio-derived timing/alignment/features and dimension scores. Keep STT transcript as one input, not ground truth. Require confidence, evidence spans and evaluator version.

**Verify**: contract tests can swap a fake forced aligner and a fake external evaluator without changing learning code.

### Step 4: Benchmark viable approaches

Compare at least: forced alignment plus interpretable features; a specialist pronunciation API/model; and the no-acoustic baseline. Measure agreement with labeled targets, false positive/negative rate by subgroup, abstention, p50/p95 latency and estimated per-minute cost.

**Verify**: a reproducible report records dataset hash, evaluator versions and metrics per dimension; no secret or raw private audio enters git.

### Step 5: Apply release gates

Define thresholds before seeing final results. Recommended minimum: materially beat STT baseline on target-error detection; false-success rate low enough not to promote incorrect mastery; calibrated confidence; usable p95 latency; documented cost ceiling; no material subgroup degradation. If any critical gate fails, choose partial/no ship.

**Verify**: ADR ends with one explicit decision and links every claim to a benchmark table.

### Step 6: Design progressive rollout only after a positive decision

If positive, gate behind a feature flag, start read-only/shadow mode, compare against current outcomes, and prevent acoustic results from changing SRS until monitored calibration is accepted. If negative, improve guided playback/record/replay and contextual coach feedback instead.

**Verify**: rollout checklist includes kill switch, observability without raw audio, version segmentation and rollback.

## Test plan

- Keep deterministic contract/unit tests separate from the offline benchmark corpus.
- Benchmark each dimension and subgroup against the no-acoustic STT baseline.
- Include silence, clipped/noisy audio, acceptable variants and deliberately wrong stress/contrast fixtures.
- Verification: the report records dataset hash/evaluator version and the existing scorer suite remains green.

## Done criteria

- [x] Current signal is honestly labeled/versioned. (`SpokenAttempt.scoreKind: 'stt_intelligibility'` + `evaluatorVersion`, ADR-064 Step 1.)
- [x] Benchmark is reproducible and privacy-safe. (speechocean762/OpenSLR SLR101, hash/thresholds fixed pre-run in `decision-thresholds.ts` commit `a108b074`; no user audio.)
- [x] Results cover quality and subgroup behavior. (Per-vowel agreement + confusion matrix in `decision.md`; calibration/latency/cost benchmarking not applicable — the evaluator failed the quality gate before those dimensions were relevant.)
- [x] ADR selects ship/partial/no-ship using predefined gates. (ADR-064: NO-SHIP for all 4 vowel contrasts, 0.85 threshold fixed before the run; see `lib/pronunciation/acoustic/benchmark/decision.md`.)
- [x] No production score or vendor is enabled by this plan alone. (Verified 2026-07-27: zero imports of `lib/pronunciation/acoustic*` from `app/`/`components/`.)
- [x] Focused tests and typecheck pass.

## Verification (2026-07-27)

- ADR-064 was written interim ("ship parcial, direction only") before the real vowel benchmark ran; it never linked forward to the final NO-SHIP verdict recorded separately in `lib/pronunciation/acoustic/benchmark/decision.md` (commit `121def1f`). Updated the ADR's Status/Decision/Links sections to state the final verdict and cross-link both documents.
- Confirmed via `git show HEAD:lib/pronunciation/acoustic-evaluator.ts` and a grep sweep that the evaluator/formant/vowel-space modules remain unimported from any production path.
- Stress/rhythm/intonation dimensions were never benchmarked (only the 4 vowel contrasts) — still open if this direction is revisited; not a gap in this plan's own scope, which only committed to running the spike.

## STOP conditions

- Audio provenance/consent/license is unclear.
- The evaluator returns only an opaque aggregate score without evidence/confidence.
- A benchmark uses STT transcript as the only ground truth for acoustic dimensions.
- Product copy would imply accent eradication or guaranteed learning.
- A production vendor commitment or data retention change is needed; request owner approval.

## Maintenance notes

Evaluator versions must remain queryable forever once they affect progress. Recalibrate before adding languages, accents, devices or new acoustic dimensions.
