# ADR 064: Acoustic pronunciation assessment — validate before shipping

- **Status**: Steps 1-3 executed; Step 4 vendor research done, then re-run as a real formant-based benchmark against speechocean762 — **NO-SHIP for all 4 vowel contrasts** (see Decision); Steps 5-6 not applicable. Reopened 2026-09-25 by plan 038 with a fourth candidate (on-device phoneme CTC): candidate vetted, benchmark **not run** — corpus access needs the owner (see Candidate 4).
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

### Candidate 4 — On-device phoneme CTC (plan 038, phase B)

Unlike Candidate 1, a phoneme-CTC model needs no separate forced aligner: the CTC frames *are*
the alignment. Unlike Candidate 2, nothing leaves the device. Verified 2026-09-25 against the
Hugging Face API, not from memory.

**1. Model ID** — `onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX`, an ONNX conversion of
`facebook/wav2vec2-lv-60-espeak-cv-ft` (wav2vec2-large fine-tuned on Common Voice to emit
espeak/IPA phoneme labels). Consumed from `@huggingface/transformers` via
`pipeline('automatic-speech-recognition', ...)` with audio resampled to 16 kHz.

**2. License** — Apache 2.0 (`license:apache-2.0` in the model metadata). Permissive; no
commercial restriction, unlike the benchmark corpus below.

**3. Size per variant** — from `GET /api/models/...?blobs=true`:

| Variant | Size |
|---|---|
| `model.onnx` (fp32) | 1264.0 MB |
| `model_fp16.onnx` | 632.3 MB |
| `model_int8` / `model_quantized` / `model_uint8` | 317.7 MB |
| `model_q4.onnx` | 241.7 MB |
| `model_bnb4.onnx` | 222.8 MB |
| `model_q4f16.onnx` | **196.9 MB** |

The smallest quantized variant is 196.9 MB, under the plan's 400 MB STOP condition, so the
"look for a base-sized alternative" branch of step B1 does not trigger. 197 MB is still a
deliberate, one-time, explicitly-consented download — never automatic (phase C, step 1).

**4. Output phoneme inventory** — 392 tokens in `vocab.json`, plus `<pad>` / `<s>` / `</s>` /
`<unk>`. The model is multilingual, so most of that inventory is irrelevant here (Mandarin
tone-marked tokens like `iɛ5`, palatalized Slavic tokens like `nʲ`, aspirated `tʰ`). The English
subset is standard espeak IPA: `ɑː æ ʌ ə ɔː aʊ aɪ b tʃ d ð ɛ ɜː eɪ f ɡ h ɪ iː dʒ k l m n ŋ oʊ ɔɪ
p ɹ s ʃ t θ ʊ uː v w j z ʒ`, plus allophones the app would fold in (`ɾ` flap, `ɚ`, `r`, `ɑ`, `ɔ`,
`ɜ`, bare `e o a i u`).

**5. Correspondence to L2-ARCTIC's ARPAbet inventory** — L2-ARCTIC annotates in ARPAbet only (the
"phones" tier; IPA appears just in free-text annotator comments). All 39 ARPAbet phones plus the
`AH0`/schwa split map onto tokens that exist in this vocabulary — checked programmatically, zero
missing. Every phoneme on the plan's Spanish-L1 priority list is covered: /v/ /b/ /ʃ/ /θ/ /ð/ /z/
/ɪ/ /iː/ /æ/ /ʌ/ /h/ /dʒ/ /ŋ/. Initial epenthesis ("e-school") is representable as an inserted
`e`/`ə` token before `s`, which the alignment classifies as an addition. So the STOP condition
"annotations cannot be mapped without losing the priority contrasts" does **not** trigger.

**Open risks, not yet measured.** (a) The mapping is many-to-one in both directions (`ɾ`→`T`/`D`,
`ɚ`/`ɜː`→`ER`, `ɑ`/`ɑː`→`AA`); folding rules change the error counts, so they must be fixed and
committed before measuring. (b) The transformers.js ASR pipeline returns a phoneme string;
per-token timestamps need `return_timestamps` on a CTC head, and the confidence the plan asks for
(mean posterior over the span) is not exposed by the high-level pipeline. (c) Published MDD
systems *purpose-trained* on L2-ARCTIC report F1 ≈ 0.60 to 0.72 ([59.52%](https://arxiv.org/html/2606.05569v1),
[69.60%](https://arxiv.org/html/2511.20107), [71.77%](https://arxiv.org/html/2604.22133) — figures
are the authors' own, rephrased for licensing compliance). A generic, untuned model should be
expected below that range, which is exactly why plan 038's gate is per-phoneme and weights
precision over recall.

**Benchmark corpus — blocked on owner action.** L2-ARCTIC is CC BY-NC 4.0, and both distribution
routes require a human to accept terms:

- The PSI Lab page gates the download behind a reCAPTCHA form asking for **name, email and
  affiliation**, then mails a Google Drive link. Submitting a person's contact details and
  accepting a license on their behalf is not an agent's call.
- The `KoelLabs/L2Arctic` mirror on Hugging Face (same CC BY-NC 4.0, parquet with IPA
  annotations) is **gated**: an unauthenticated fetch returns HTTP 401, so it needs an account
  that has accepted the terms plus a token.

The 4 Spanish-L1 speakers are EBVS (M), ERMS (M), MBMPS (F), NJS (F), with 150 manually annotated
utterances each — 600 total, which is what the per-phoneme gate (≥30 annotated human errors per
phoneme) would be measured on.

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

**Interim decision (2026-07-21): "Ship parcial, direction only."** Keep `stt_intelligibility` as
the sole production signal, now honestly labeled everywhere in the UI. The provider-neutral
evaluator interface and contract tests from Step 3 are merged as groundwork, but are not wired
into any production path and score nothing today. No vendor is engaged.

**Final decision (2026-07-25), superseding the above for vowels: NO-SHIP.** Step 4 was re-run as
a real, open-source, formant-based benchmark (Candidate 1 — LPC/root-finding formant extraction,
no vendor) against the speechocean762 corpus (14,374 non-abstained trials across `iː`, `ɪ`, `æ`,
`ʌ`). Overall agreement with labeled targets was **0.309**, far below the pre-registered 0.85
ship threshold; every contrast individually failed the gate (`iː` closest at 0.619, `ɪ` worst at
0.116). Full results, corpus/segmentation caveats, and confusion matrix are in
`lib/pronunciation/acoustic/benchmark/decision.md`.

Per the STOP condition in `plans/067-build-pronunciation-diagnostic.md` and the no-ship-is-a-valid-
outcome framing in the (informally numbered) vowel-benchmark work: **no change to production.**
`lib/pronunciation/acoustic-evaluator.ts` and the formant/vowel-space modules under
`lib/pronunciation/acoustic/` remain merged as groundwork — zero production imports
(`app/`/`components/`) reference them. Vowel scoring in the plan-067 diagnostic stays
`not_measured` for every target. No production score or vendor was enabled by this work.

This closes plan 064's Step 4-6 gate for the vowel-contrast case via the negative branch (no
positive result to design a rollout for). Re-opening acoustic assessment for vowels — or
extending the benchmark to stress/rhythm/intonation, which were never run — requires a new plan:
either fixing the segmentation approach (the corpus has no per-word timestamps; this run used a
proportional phoneme-count window estimate, not forced alignment, so evaluator accuracy and
window-placement error are conflated in these numbers) or sourcing a corpus with true alignment.

Until such a follow-up plan ships a passing benchmark, this app must not claim acoustic
pronunciation assessment anywhere in product copy.

**Plan 038 phase B (2026-09-25): no decision yet — the benchmark could not run.** Candidate 4
above clears every desk check the plan required (permissive license, 196.9 MB quantized, full
ARPAbet coverage of the Spanish-L1 priority contrasts), so there is no STOP condition on the
model. What is missing is the ground truth: L2-ARCTIC is CC BY-NC 4.0 and both distribution
routes require a person to accept the license and hand over contact details or an authenticated
account. Until the owner does that, `decision-phoneme-ctc.md` has nothing to report and phase C
stays closed. The no-ship decision above remains in force: **no production surface shows a
per-sound verdict.** Plan 038 phase A only removed unearned claims; it added no new signal.

## Links

- Plan: `plans/064-validate-acoustic-pronunciation-assessment.md`
- Prior deferral: `docs/architecture/exercises.md` (row "3 — Future acoustic analysis")
- Honest-signal contract: `lib/pronunciation/spoken-attempt.ts`
- Evaluator contract: `lib/pronunciation/acoustic-evaluator.ts`
- Contract tests: `lib/pronunciation/__tests__/acoustic-evaluator.test.ts`
- **Final vowel-benchmark verdict and full results**: `lib/pronunciation/acoustic/benchmark/decision.md`
- STOP condition honored: `plans/067-build-pronunciation-diagnostic.md`
