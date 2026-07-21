# ADR 064: Acoustic pronunciation assessment — validate before shipping

- **Status**: Steps 1-3 executed; Step 4 executed as vendor research only (no live benchmark); Steps 5-6 deferred.
- **Plan**: `plans/064-validate-acoustic-pronunciation-assessment.md`
- **Depends on**: plan 063 (`docs/architecture/exercises.md` row "3 — Future acoustic analysis")

## Context

The current pronunciation score (`lib/pronunciation/scoring.ts`, `scorePronunciation`) compares
an STT transcript against target text and projects CMU-dictionary phonemes onto that diff. It
measures whether an STT engine recognized the intended words — not whether the speaker produced
correct stress, rhythm, reductions, segmental quality, or intonation. `SpokenAttempt`
(`lib/pronunciation/spoken-attempt.ts`) already labels this signal honestly as
`scoreKind: 'stt_intelligibility'` with an `evaluatorVersion` tag, from plan 063 follow-up work.

The app already has substantial *target* theory/data for word stress, sentence stress, connected
speech (`lib/exercises/generators/connected-speech.ts`), and IPA (`lib/pronunciation/ipa-data.ts`,
`lib/lexicon/ipa.ts`) — but no acoustic *measurement* of whether a user's audio actually matches
those targets. This ADR is a spike to decide whether adding real acoustic assessment is currently
viable, per the three-way decision in the plan (ship acotado / ship parcial / no ship).

## Step 1 — Rename and version the existing signal (DONE)

`SpokenAttempt.scoreKind` and `evaluatorVersion` already existed from plan 063 and correctly avoid
overclaiming. This spike closed the remaining user-visible copy gaps found via
`git grep -n "pronunciation accuracy\|phoneme accuracy" -- components lib ':!lib/pronunciation/*test*'`:

| File | Before | After |
|---|---|---|
| `components/interview/InterviewResults.tsx:170` | "Overall pronunciation accuracy" | "Overall word recognition accuracy" |
| `components/progress/FluencyRadarCard.tsx:17` | "Sound Lab · phoneme accuracy" | "Sound Lab · word recognition" |
| `components/layout/stats/GuestBanner.tsx:32` | "...pronunciation accuracy..." | "...word recognition accuracy..." |

Verification grep now returns no matches outside test files. No historical `overallScore` values
were rewritten — the rename is copy-only; the underlying evaluator and its `stt-v1`-style version
tag are unchanged.

**Known gap (out of scope for this spike)**: `SpokenAttempt` / `evaluatorVersion` is a defined
contract (`lib/pronunciation/spoken-attempt.ts`) but no production call site constructs one yet —
`scorePronunciation` callers (e.g. `SpeakScoredExercise.tsx`) still consume raw `ScoringResult`
directly. Wiring `scorePronunciation` output through the `SpokenAttempt` contract is follow-up
work, not part of this ADR's decision.

## Step 2 — Dimension-specific ground truth (rubric)

For each dimension below: what "acceptable" means, what confidence/abstention looks like, and
what "unusable audio" means. None of these are implemented as acoustic measurements today — this
is the rubric a future acoustic evaluator would need to satisfy, and the standard step 4/5 must
benchmark against.

The explicit non-goal for every dimension: **the target is intelligibility and contrast, not a
"native accent."** No dimension below should be scored as distance-from-native-speaker.

### Segmental quality (individual phonemes / minimal pairs)
- **Acceptable variants**: any realization that preserves the phonemic contrast the exercise is
  testing (e.g. /iː/ vs /ɪ/ in "sheep"/"ship"); regional/L1-consistent allophonic variation that
  doesn't collapse the contrast is acceptable.
- **Unacceptable**: substitution that collapses the target contrast (the specific minimal-pair
  confusion the exercise exists to catch).
- **Confidence/abstain**: abstain when SNR is too low to resolve the contrasted formants/bursts,
  or when the segment falls at a clip boundary.
- **Unusable audio**: clipping, < ~300ms of usable signal, silence, or non-speech audio.

### Word stress
- **Acceptable variants**: any stress pattern within documented dialectal variation for the word
  (e.g. some noun/verb stress-shift pairs have accepted alternates); primary stress must land on
  a linguistically valid syllable.
- **Unacceptable**: stress on a syllable that changes word identity or is not attested in any
  major variety (flags a genuine production error, not an accent difference).
- **Confidence/abstain**: abstain on words under ~2 syllables where stress is not contrastive, or
  when pitch/intensity tracking fails due to background noise.
- **Unusable audio**: same as segmental.

### Rhythm / reduction (connected speech, weak forms)
- **Acceptable variants**: both reduced (weak form) and full/careful realizations are acceptable
  in isolation; the target is that the *pattern* is consistent and intelligible, not that
  reduction is mandatory. This directly reuses targets already defined in
  `lib/exercises/generators/connected-speech.ts`.
- **Unacceptable**: rhythm that breaks word/phrase boundaries so badly intelligibility degrades.
- **Confidence/abstain**: abstain when utterance duration is too short to measure inter-stress
  timing reliably (rhythm needs multi-syllable context).
- **Unusable audio**: single-word utterances (rhythm is not measurable below phrase level).

### Intonation
- **Acceptable variants**: any pitch contour consistent with the utterance's pragmatic function
  (e.g. rising for polar questions, falling for statements); dialectal pitch-range differences are
  acceptable.
- **Unacceptable**: contour that inverts or flattens the pragmatic function (e.g. flat/falling on
  a genuine yes/no question in a context where that changes meaning).
- **Confidence/abstain**: abstain on very short utterances (<~3 syllables) where pitch contour is
  underdetermined, or on unstable/creaky-voice segments.
- **Unusable audio**: same as segmental; additionally abstain if pitch tracker confidence is low
  across >50% of the voiced frames.

### Cross-dimension corpus requirements
- Diverse accents (non-native L1 backgrounds spanning at least 3-4 language families), diverse
  recording devices (phone mic vs headset), and a noise range from clean to moderate background
  noise, are all required in the eventual benchmark corpus — a corpus of only clean, single-accent
  audio cannot validate subgroup behavior (Step 4/5 gate).
- Every sample requires documented **consent and license** and must be de-identified before
  entering any repo path. See STOP conditions below — this spike does not use any real user
  recordings.

### Inter-rater protocol (for future rubric application)
When this rubric is applied to build a labeled benchmark set, each clip should be independently
labeled by ≥2 raters per dimension, with disagreements adjudicated by a third rater; label schema
must record the dimension, acceptable/unacceptable verdict, and rater confidence — not a single
opaque number.

## Step 3 — Provider-neutral evaluator interface

Added `lib/pronunciation/acoustic-evaluator.ts`: a typed contract any acoustic evaluator (a real
forced aligner, a vendor API, or a test fake) can implement, without the learning code depending
on a specific provider. STT transcript is explicitly typed as one *input*, not ground truth — the
interface has no method that treats transcript match as sufficient for an acoustic verdict.

Key shape (see file for full types):

- `AcousticEvaluator.evaluate(input: AcousticEvaluationInput): Promise<AcousticEvaluationResult>`
- `AcousticEvaluationInput` — audio reference (never raw audio bytes in this type; a handle/URI),
  target text, target dimensions to score, and the STT transcript as auxiliary context only.
- `AcousticEvaluationResult` — per-dimension `DimensionScore[]` (`dimension`, `score`,
  `confidence`, `evidenceSpans`, `abstained: boolean`), plus `evaluatorVersion` and
  `evaluatorKind` (mirrors `SpokenAttempt.scoreKind`'s discriminated-union pattern so a future
  acoustic kind can be added as a new union member without breaking switches on `scoreKind`).
- No method or field allows returning a single opaque aggregate score — every result is
  dimension-scoped with confidence and evidence, matching the plan's STOP condition.

Contract tests (`lib/pronunciation/__tests__/acoustic-evaluator.test.ts`) exercise the interface
with two fakes — `FakeForcedAlignerEvaluator` and `FakeVendorEvaluator` — proving learning-facing
code (a thin `scoreWithEvaluator` helper) is swappable without changes: both fakes satisfy the
same `AcousticEvaluator` contract and the test asserts the helper's behavior (abstention handling,
evidence-span passthrough) is identical regardless of which fake is injected.

No real evaluator (forced aligner or vendor) is implemented or called. This is contract-only,
per Step 3's verify criterion.

## Step 4 — Benchmark viable approaches (research only, no live benchmark)

**Scope note**: per owner decision during this spike, live benchmarking against real audio was
deferred — this repo has no consented/licensed audio corpus yet (a Step 4/5 STOP condition), and
comparing a vendor API live would be a production-vendor commitment requiring separate approval.
What follows is desk research on candidate approaches only; no API was called, no data was sent
to any third party, and no vendor relationship exists.

### Candidate 1 — Forced alignment + interpretable features (open-source)
- **Approach**: Montreal Forced Aligner (MFA) or a Kaldi/gentle-style aligner to get phoneme/word
  timestamps from audio + transcript, then derive interpretable features (duration ratios for
  rhythm, F0 contour via e.g. `pyin`/`crepe` for intonation, formant tracking for segmental
  quality) on top of the alignment.
- **Cost**: no per-call vendor cost; compute cost only (self-hosted or batch job).
- **Latency**: MFA alignment is not designed for real-time; typical use is offline/batch
  (seconds-to-minutes per utterance depending on setup), which conflicts with an interactive
  practice-session UX unless pre-warmed or run async.
- **Explainability**: high — every score traces to a specific timestamp/feature, satisfying the
  plan's "evidence spans" requirement naturally.
- **Risk**: engineering-heavy; stress/intonation feature extraction quality varies with audio
  conditions; would need in-house tuning and validation against the Step 2 rubric.

### Candidate 2 — Specialist pronunciation assessment API (vendor)
Publicly documented options (desk research only, current as of this spike; pricing/latency
claims are the vendors' own public marketing/docs and were not independently verified):
- **Azure AI Speech — Pronunciation Assessment**: returns accuracy/fluency/completeness/prosody
  sub-scores per phoneme/word/utterance; documented as near-real-time; consumption-based pricing
  per audio-second under Azure Speech services.
- **SpeechAce**: dedicated pronunciation-scoring API with phoneme-level and word-stress scoring;
  commercial per-call pricing (contact-sales tier for volume).
- **ELSA API / Speechsuper**: consumer-app-oriented pronunciation scoring APIs with similar
  phoneme/fluency sub-scores; commercial pricing.

None of these were called. Any of them would require: a data processing agreement, sending user
audio to a third party (conflicts with "no vendor commitment" and current no-audio-retention
posture unless scoped explicitly), and a cost/latency benchmark against real traffic before any
production decision — all out of scope for this spike per the STOP conditions.

### Candidate 3 — No-acoustic baseline (current system)
- Already in production as `stt_intelligibility`. Zero incremental cost/latency/vendor risk.
  Known limitation: cannot measure stress/rhythm/intonation/segmental quality directly, only
  whether STT recognized the words.

### Why no live benchmark ran
Running Step 4's quantitative comparison (agreement with labeled targets, false positive/negative
rate by subgroup, abstention rate, p50/p95 latency, per-minute cost) requires: (a) a labeled,
consented, de-identified, diverse audio corpus per the Step 2 rubric, and (b) for Candidate 2,
an approved vendor relationship. Neither exists yet. Producing the benchmark without them would
violate two explicit plan STOP conditions ("Audio provenance/consent/license is unclear" and "A
production vendor commitment... needs owner approval").

## Step 5 — Release gates

Not evaluated — gates require the Step 4 quantitative benchmark, which did not run. Deferred.

## Step 6 — Progressive rollout design

Not designed — contingent on a positive Step 5 decision, which did not happen. Deferred.

## Decision

**Ship parcial, direction only** (interim): keep `stt_intelligibility` as the sole production
signal, now honestly labeled everywhere in the UI. The provider-neutral evaluator interface and
contract tests from Step 3 are merged as groundwork, but are not wired into any production path
and score nothing today. No acoustic dimension (segmental/stress/rhythm/intonation) is shipped or
promised. No vendor is engaged. No production score changes as a result of this ADR.

**To reach a final ship/partial/no-ship decision** (Steps 4-6), a follow-up plan must supply:
1. A consented, licensed, de-identified, diverse audio corpus meeting the Step 2 rubric's
   diversity requirements, labeled per the inter-rater protocol.
2. Explicit owner approval to evaluate (not yet commit to) one vendor API against that corpus,
   including a data processing agreement covering audio sent to that vendor.
3. A budget/scope for building or hosting a forced-alignment pipeline (Candidate 1) if that path
   is preferred over a vendor.

Until that follow-up plan executes Step 4 for real, this app must not claim acoustic pronunciation
assessment anywhere in product copy.

## Links

- Plan: `plans/064-validate-acoustic-pronunciation-assessment.md`
- Prior deferral: `docs/architecture/exercises.md` (row "3 — Future acoustic analysis")
- Honest-signal contract: `lib/pronunciation/spoken-attempt.ts`
- New evaluator contract: `lib/pronunciation/acoustic-evaluator.ts`
- Contract tests: `lib/pronunciation/__tests__/acoustic-evaluator.test.ts`
