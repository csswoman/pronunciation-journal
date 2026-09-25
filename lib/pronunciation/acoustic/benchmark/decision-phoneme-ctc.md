# Phoneme-CTC benchmark — plan 038, phase B

**Status: not measured. No verdict.** The harness is built and tested; the ground truth is not
available to this repo. Nothing in this document may be used to justify showing a per-sound verdict
in the product.

Date: 2026-09-25 · Plan: `plans/038-elsa-style-phoneme-feedback-on-device.md` ·
ADR: `docs/architecture/adr-064-acoustic-pronunciation-assessment.md` ("Candidate 4")

## What was decided before measuring

The gate lives in `decision-thresholds.ts` and was committed before a single inference ran
(`3e00f526`). A phoneme passes only with **flagged-error precision ≥ 0.80** *and* **false-alarm
rate ≤ 0.05** *and* **≥ 30 annotated human errors** to measure on. Phase C opens only if **≥ 4
phonemes pass** and **p95 inference ≤ 3 s** for a five-word phrase.

Precision outranks recall on purpose. A false correction teaches something wrong; a missed error
merely fails to help.

## What the model side looks like

`onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX`, Apache 2.0. Smallest quantized variant
`model_q4f16.onnx` at **196.9 MB**, under the plan's 400 MB STOP condition. Its 392-token espeak
vocabulary covers all 39 ARPAbet phones plus schwa, so L2-ARCTIC's annotations map across without
losing any Spanish-L1 priority contrast. Sizes and vocabulary were read from the Hugging Face API,
not recalled — details and the per-variant table are in the ADR.

No STOP condition fires on the model.

## Why the benchmark did not run

L2-ARCTIC is **CC BY-NC 4.0**, and every route to it requires a person — not an agent — to accept
the license:

| Route | Blocker |
|---|---|
| PSI Lab download form | reCAPTCHA form asking for name, email and affiliation; mails a Google Drive link. Submitting someone's contact details and accepting a license on their behalf is not an agent's call. |
| `KoelLabs/L2Arctic` mirror on Hugging Face | Gated dataset, same CC BY-NC 4.0. An unauthenticated fetch of the parquet returns **HTTP 401**. Needs an account that has accepted the terms, plus a token. |

Also worth deciding before downloading: the license is **non-commercial**. It covers this app while
it stays unmonetized. If the app is ever monetized, L2-ARCTIC must stop being used — this is an
explicit STOP condition in the plan.

## How to unblock it

1. The owner requests L2-ARCTIC from <https://psi.engr.tamu.edu/portfolio/l2-arctic-corpus/>, or
   accepts the terms on the Hugging Face mirror and provides a token.
2. Extract outside the repo, e.g. `D:\datasets\l2-arctic`, and set `L2ARCTIC_DIR`. Never commit
   audio or annotations.
3. Add the inference side: `@huggingface/transformers`, a `PhonemeRecognizer` that resamples the
   44.1 kHz WAVs to 16 kHz and returns per-token spans with mean posterior confidence. This is the
   one piece deliberately left out — a dependency that cannot be exercised is dead weight.
4. Run against the 4 Spanish-L1 speakers only — EBVS, ERMS, MBMPS, NJS, 150 annotated utterances
   each, 600 total:
   `L2ARCTIC_DIR=... pnpm tsx lib/pronunciation/acoustic/benchmark/run-benchmark.ts --evaluator=phoneme_ctc`
5. Replace this document with the per-phoneme table and the verdict.

## What to expect, so the result is read honestly

Published MDD systems *purpose-trained* on L2-ARCTIC report F1 in roughly the 0.60–0.72 range
([59.52%](https://arxiv.org/html/2606.05569v1), [69.60%](https://arxiv.org/html/2511.20107),
[71.77%](https://arxiv.org/html/2604.22133) — figures are the authors' own; rephrased here for
licensing compliance). A generic, untuned phoneme-CTC model should be expected below that. That is
not a reason to soften the gate: it is why the gate is per-phoneme. Shipping four reliable sounds
beats shipping thirty-nine unreliable ones.

Two measurement caveats to report alongside any numbers:

- **Folding rules change the counts.** `phoneme-arpabet-folding.ts` decides when a recognized token
  counts as an expected ARPAbet symbol. It is pinned and test-guarded against merging priority
  contrasts, but it is still a judgment call and must be reported with the results.
- **Alignment error and evaluator error are separable here, unlike the 2026-07-25 formant run.**
  L2-ARCTIC's annotation tier carries real timestamps, so a bad result cannot be blamed on an
  estimated analysis window the way `decision.md` had to.

## Current production state

Unchanged, and unchanged by anything in phase B. `stt_intelligibility` remains the only signal.
Phase A of this plan removed unearned per-sound claims; it added no new signal. Everything under
`lib/pronunciation/acoustic/` still has zero imports from `app/` or `components/`.
