# Phoneme-CTC benchmark — plan 038, phase B

**Verdict: NO-SHIP. Phase C does not open.** One phoneme clears the gate; the gate needs four.
No production surface may show a per-sound verdict on the strength of this run.

Measured 2026-09-25 · Plan: `plans/038-elsa-style-phoneme-feedback-on-device.md` ·
ADR: `docs/architecture/adr-064-acoustic-pronunciation-assessment.md` ("Candidate 4")

## The gate, fixed before measuring

Committed in `decision-thresholds.ts` at `3e00f526`, before the corpus was downloaded and before a
single inference ran. A phoneme passes only with **flagged-error precision ≥ 0.80** *and*
**false-alarm rate ≤ 0.05** *and* **≥ 30 annotated human errors** to measure on. Phase C opens only
if **≥ 4 phonemes pass** and **p95 inference ≤ 3 s**.

Precision outranks recall on purpose. A false correction teaches something wrong; a missed error
merely fails to help.

## Setup

| | |
|---|---|
| Model | `onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX`, Apache 2.0, variant `q4f16` (196.9 MB) |
| Evaluator version | `onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX@q4f16/ctc-argmax-v1` |
| Decoding | CTC argmax per frame, repeats collapsed, blank dropped; 20 ms per frame; confidence = mean posterior over the span |
| Corpus | L2-ARCTIC v5.0 manual subset, 16 kHz — `chikingsley/l2-arctic-manual-v5.0-16k` on Hugging Face, CC BY-NC 4.0 |
| Speakers | EBVS, ERMS, MBMPS, NJS — the 4 with Spanish L1 |
| Utterances | 600 (150 each) |
| Trials | 20,050 expected phonemes · 3,151 annotated human errors |
| Runtime | Node 24, CPU, onnxruntime-node 1.21 |

Ground truth is the annotation's own canonical labels, not CMUdict: the annotators recorded what
the speaker was reading, which CMUdict cannot know.

## Results

**Overall**: flagged-error precision **35.2%** · false alarm **10.0%** · recall **28.7%** ·
abstention **1.1%** · latency **p50 1151 ms, p95 2248 ms**.

Latency is not the problem — p95 sits comfortably under the 3 s budget on sentences averaging nine
words, longer than the five-word phrase the gate specifies. Abstention at 1.1% says the espeak→ARPAbet
folding rules cover the English inventory; the benchmark measured the model, not a mapping gap.

Per phoneme, ordered by how much evidence there was to measure on. `*` marks a Spanish-L1 priority
contrast. Full output: `D:\datasets\l2-arctic\full-spanish-l1.txt` (outside the repo).

| Phoneme | Human errors | Model flagged | Precision | False alarm | Recall | Verdict |
|---|---|---|---|---|---|---|
| \*Z | 502 | 63 | **96.8%** | **1.3%** | 12.2% | **pass** |
| \*IH | 382 | 145 | 35.2% | 11.5% | 13.4% | fail |
| \*DH | 353 | 39 | 79.5% | 3.2% | 8.8% | fail |
| \*AH | 323 | 377 | 27.6% | 18.4% | 32.2% | fail |
| D | 207 | 207 | 47.3% | 14.8% | 47.3% | fail |
| \*AE | 161 | 78 | 56.4% | 9.4% | 27.3% | fail |
| \*V | 126 | 48 | 54.2% | 7.2% | 20.6% | fail |
| T | 125 | 124 | 37.9% | 7.1% | 37.6% | fail |
| N | 109 | 101 | 51.5% | 4.3% | 47.7% | fail |
| \*TH | 84 | 76 | 78.9% | 28.6% | 71.4% | fail |
| \*HH | 71 | 39 | 28.2% | 5.4% | 15.5% | fail |
| OW | 66 | 49 | 30.6% | 14.2% | 22.7% | fail |
| \*JH | 60 | 12 | 66.7% | 5.6% | 13.3% | fail |
| EH | 46 | 90 | 32.2% | 12.0% | 63.0% | fail |
| \*NG | 46 | 37 | 40.5% | 13.3% | 32.6% | fail |
| AA | 41 | 97 | 29.9% | 36.2% | 70.7% | fail |
| P | 41 | 18 | 55.6% | 2.4% | 24.4% | fail |
| ER | 39 | 97 | 13.4% | 16.8% | 33.3% | fail |
| S | 37 | 76 | 31.6% | 6.5% | 64.9% | fail |
| EY | 35 | 26 | 65.4% | 2.3% | 48.6% | fail |
| R | 30 | 129 | 12.4% | 13.9% | 53.3% | fail |

Below 30 annotated errors — **not measurable**, and a phoneme that cannot be measured can never be
shown: \*IY (29), L (25), \*B (24), Y (20), M (18), AY (17), G (17), K (17), AO (16), UH (16),
ZH (16), AW (15), UW (15), CH (6), F (6), \*SH (5), W (3), OY (2).

**Passing: Z. Phase C: closed.**

## How to read this

**The model is not measuring sounds well enough to correct anyone.** At 35.2% overall precision,
roughly two out of three corrections it offers would be wrong. That is worse than saying nothing,
which is why the gate exists.

**/z/ is the one real finding, and it is a narrow one.** 96.8% precision at 1.3% false alarm on 502
annotated errors is a genuinely trustworthy signal — Spanish speakers devoicing final /z/ to /s/ is
one of the most common and most acoustically obvious errors in the set. But recall is 12.2%: it
catches about one in eight. It would be honest, just mostly quiet.

**DH is the reason pre-registration matters.** On the first two speakers it passed at 85.7%
precision. With all four it came in at **79.5%** — under the 0.80 line by half a point. Had the
threshold been chosen after looking, the temptation to round it down would have been real. It was
fixed beforehand, so DH fails, and that is the correct answer.

**TH shows why precision alone is not enough.** 78.9% precision looks close, but its false-alarm
rate is 28.6%: it would flag more than a quarter of correctly produced /θ/ as wrong. Nearly-right
precision with a loud false-alarm rate is the worst combination for a learner.

**The priority contrasts fail hardest.** /ɪ/ at 35.2% precision, /iː/ at 14.6%, /v/ at 54.2%,
/h/ at 28.2%. These are exactly the sounds a Spanish speaker needs feedback on, and exactly where a
generic model is weakest. That result is consistent with the published context: systems
*purpose-trained* on L2-ARCTIC report F1 around 0.60–0.72
([59.52%](https://arxiv.org/html/2606.05569v1), [69.60%](https://arxiv.org/html/2511.20107),
[71.77%](https://arxiv.org/html/2604.22133) — figures are the authors' own, rephrased for licensing
compliance). An untuned off-the-shelf model landing far below that is the expected outcome, not a
surprise or a bug.

## Caveats a future run must carry

- **The folding rules are a judgment call.** `phoneme-arpabet-folding.ts` decides when a recognized
  espeak token counts as an expected ARPAbet symbol, including splitting composites (`ɔːɹ` → AO R)
  and treating the flap as either /t/ or /d/. A test fails the build if any rule would merge two
  priority contrasts. The 1.1% abstention rate says the coverage is not the bottleneck, but the
  rules still shape the counts.
- **Decoding is plain argmax.** No language model, no beam search, no confidence thresholding. A
  future attempt should try abstaining below a posterior threshold before concluding the model
  cannot do this — trading recall for precision is exactly the axis this gate rewards.
- **Corpus provenance.** This is a third-party derivative on Hugging Face, not the official PSI Lab
  distribution, chosen because the official route requires a human to submit personal details and
  the other mirror is access-gated. Evidence it is faithful: per-speaker annotation counts match the
  PSI Lab table exactly, **including YBAA's irregular 149** where every other speaker has 150.
- **Alignment error is not confounded here**, unlike the 2026-07-25 formant run. The annotation
  carries real timestamps and the CTC frames carry their own, so a bad result cannot be blamed on an
  estimated analysis window the way `decision.md` had to be.

## What this changes in the product

Nothing. `stt_intelligibility` remains the only signal. Phase A of plan 038 removed unearned
per-sound claims; it added no new one. Everything under `lib/pronunciation/acoustic/` still has zero
imports from `app/` or `components/`.

If per-sound feedback is wanted later, the two paths worth a new plan are: **fine-tune** a phoneme
model on L2-ARCTIC (which is what the 0.60–0.72 systems do), or **Azure AI Speech Pronunciation
Assessment**, which sends audio to Microsoft and needs explicit owner approval under ADR 064.

## Attribution

L2-ARCTIC is distributed under CC BY-NC 4.0 — **non-commercial use only**. If this app is ever
monetized, it must stop being used.

> Guanlong Zhao, Sinem Sonsaat, Alif Silpachai, Ivana Lucic, Evgeny Chukharev-Hudilainen,
> John Levis, Ricardo Gutierrez-Osuna. "L2-ARCTIC: A Non-native English Speech Corpus."
> *Proc. Interspeech 2018*, pp. 2783–2787. <https://doi.org/10.21437/Interspeech.2018-1110>

## Reproducing

```bash
# The corpus never enters the repo.
mkdir -p D:/datasets/l2-arctic/parquet
for split in train validation test; do
  curl -L -o "D:/datasets/l2-arctic/parquet/$split.parquet" \
    "https://huggingface.co/datasets/chikingsley/l2-arctic-manual-v5.0-16k/resolve/main/data/$split-00000-of-00001.parquet"
done

node --import tsx scripts/run-phoneme-ctc-benchmark.mjs --corpus=D:/datasets/l2-arctic/parquet
```

Needs `ffmpeg` on PATH. First run downloads ~197 MB of model to the transformers.js cache; 600
utterances take about 12 minutes on CPU. `--limit=N` caps utterances per speaker.
