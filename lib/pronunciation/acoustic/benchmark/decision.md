# Plan 071 — Vowel Acoustic Benchmark Decision

**Date:** 2026-07-25
**Threshold:** agreement ≥ 0.85 to ship a contrast (fixed in `decision-thresholds.ts`,
commit `a108b074`, before this run).
**Corpus:** speechocean762 (OpenSLR SLR101), full train+test split, local checkout at
`D:\proyectos\speechocean762`.

**⚠️ Segmentation caveat (mandatory context for interpreting every number below):**
speechocean762 has no per-word timestamps. Only 6 of 5000 utterances are single-word
recordings (the whole clip *is* the word, no estimation needed) — the remaining 14,368
scored words came from multi-word sentences, where the analysis window is a **proportional
phoneme-count estimate** (`word-window.ts`, Task 6b), not a forced aligner. This is a
heuristic, not measured alignment. The results below cannot cleanly separate "the formant
evaluator is inaccurate" from "the estimated window missed the vowel" — both are plausible
contributors to the low agreement seen here, and this document does not have the evidence to
apportion blame between them (that would require spot-checking individual windowed clips by
ear/spectrogram, which is out of scope for this pass).

## Results

| Vowel | Trials | Agreement | Verdict |
|-------|--------|-----------|---------|
| iː    | 1457   | 0.619     | no_ship |
| ɪ     | 2311   | 0.116     | no_ship |
| æ     | 1652   | 0.179     | no_ship |
| ʌ     | 4361   | 0.357     | no_ship |

(Trial counts are per-vowel non-abstained trials — see confusion matrix below for the raw
counts; total scored+abstained trials = 14,374.)

**Overall abstention rate:** 0.320 (LPC/root-finding declined to produce two valid formants,
or the clip failed the min-duration/min-energy gate, for ~32% of windowed segments — expected
given many windows are very short, ~2-3 phones' worth of a multi-word sentence).

**Overall agreement rate (non-abstained trials only):** 0.309

## Confusion matrix (target vowel → predicted vowel counts)

| Target \ Predicted | iː | ɪ | æ | ʌ |
|---|---|---|---|---|
| **iː** | 902 | 170 | 113 | 272 |
| **ɪ** | 1412 | 267 | 222 | 410 |
| **æ** | 703 | 290 | 296 | 363 |
| **ʌ** | 1724 | 460 | 622 | 1555 |

## Verdict

**NO-SHIP for all four contrasts** (`iː`, `ɪ`, `æ`, `ʌ`). None reaches the 0.85 agreement
threshold — `iː` is closest at 0.619, `ɪ` is worst at 0.116.

Per plan 067's explicit STOP condition and plan 071's spec ("no-ship es un éxito del proceso,
no un fracaso"): **no change to production.** Vowel scoring in the plan-067 diagnostic
remains `not_measured` for every target — Task 11 (gate release) does not run.

### Interpretation

The dominant confusion pattern is every vowel being over-predicted as `iː` (see the `iː`
column: 902+1412+703+1724 = 4741 of 14,374 predictions land on `iː`, far more than its true
frequency). This is consistent with a **systematic bias in the pipeline** rather than random
noise, and there are two credible causes this benchmark cannot distinguish between:

1. **Segmentation noise (the more likely culprit).** The center-third proportional window
   often does not contain the target word's actual vowel nucleus, especially in longer
   sentences with 5+ words where phoneme-count proportionality is a weak proxy for real
   timing (unstressed function words are shorter in real speech than their phoneme count
   suggests; content words are longer). A window that clips onto silence, a neighboring
   consonant, or a different word's vowel would explain both the high abstention rate and a
   biased-toward-one-class confusion pattern if that neighboring content happens to have
   formant characteristics near the `iː` centroid.

2. **Evaluator bias.** The nearest-centroid classifier or the LPC formant extraction itself
   could be systematically biased toward reporting F1/F2 values near the `iː` centroid
   (270Hz/2290Hz) regardless of true input — e.g. if short/noisy windows tend to produce
   low-F1 estimates. `formant-extraction.ts`'s unit tests only validate recovery on clean
   200ms synthetic two-tone signals, not on the short (~100-300ms), real, multi-formant
   speech segments this benchmark actually threw at it.

Per plan 071's honesty rule, this document does not guess which cause dominates. The
appropriate next step, if this benchmark is revisited, is a small spot-check (10-20 windowed
clips, listened to by ear against their predicted window bounds) to determine whether the
segmentation or the evaluator is the primary failure mode before investing further in either.
The v1 vowel-contrast set (/iː/-/ɪ/) is confirmed as the hardest pair for Spanish-L1 learners
per the original spec's motivation, but this benchmark cannot confirm or deny the evaluator's
usefulness for that specific pedagogical claim — it only confirms the current
pipeline-as-built does not meet the ship bar on this corpus.
