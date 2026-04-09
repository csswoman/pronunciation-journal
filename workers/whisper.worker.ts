/**
 * Web Worker for running Whisper STT inference.
 *
 * Uses @xenova/transformers (Transformers.js) to run
 * Whisper tiny model entirely in the browser.
 */

type PipelineFn = (typeof import("@xenova/transformers"))["pipeline"];
let pipelineFn: PipelineFn | null = null;
let transcriber: Awaited<ReturnType<PipelineFn>> | null = null;

interface WhisperResult {
  text: string;
}

async function getPipelineFn(): Promise<PipelineFn> {
  if (pipelineFn) return pipelineFn;

  // Turbopack/worker dev environments may miss process/env at module-eval time.
  // Define a minimal shim before importing transformers.
  const g = globalThis as { process?: { env?: Record<string, string> } };
  if (!g.process) g.process = { env: {} };
  if (!g.process.env) g.process.env = {};

  const mod = await import("@xenova/transformers");
  pipelineFn = mod.pipeline;
  return pipelineFn;
}

self.onmessage = async (event: MessageEvent) => {
  const { type, audio } = event.data;

  if (type === "load") {
    try {
      self.postMessage({ type: "progress", progress: 0 });
      const pipeline = await getPipelineFn();

      const pipelineOptions: Record<string, unknown> = {
        dtype: "q8", // quantized int8 — ~40% faster inference
        progress_callback: (progress: { progress: number }) => {
          if (progress.progress) {
            self.postMessage({
              type: "progress",
              progress: Math.round(progress.progress),
            });
          }
        },
      };
      transcriber = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-base.en",
        pipelineOptions
      );

      self.postMessage({ type: "ready" });
    } catch (error) {
      self.postMessage({
        type: "error",
        error: `Failed to load model: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  if (type === "transcribe") {
    if (!transcriber) {
      self.postMessage({
        type: "error",
        error: "Model not loaded. Send 'load' first.",
      });
      return;
    }

    try {
      let wMax = 0;
      let wMin = 0;
      for (let i = 0; i < audio.length; i++) {
        if (audio[i] > wMax) wMax = audio[i];
        if (audio[i] < wMin) wMin = audio[i];
      }
      console.log(`[Worker] Starting transcription for ${audio.length} samples. Min: ${wMin.toFixed(4)}, Max: ${wMax.toFixed(4)}`);

      // Prevent infinite hanging in WebWorker WASM backend by enforcing a timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Whisper timeout after 10 seconds")), 10000)
      );

      const transcribePromise = (transcriber as unknown as (samples: Float32Array, opts: Record<string, unknown>) => Promise<unknown>)(audio, {
        language: "english",
        task: "transcribe",
        no_speech_threshold: 0.0,
        logprob_threshold: -2.0,
      });

      const result = (await Promise.race([transcribePromise, timeoutPromise])) as unknown;

      console.log(`[Worker] Pipeline result raw:`, result);

      const text = Array.isArray(result)
        ? (result as WhisperResult[]).map((r) => r.text).join(" ")
        : (result as WhisperResult).text;

      self.postMessage({
        type: "result",
        text: (text || "").trim(),
      });
    } catch (error) {
      self.postMessage({
        type: "error",
        error: `Transcription failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
};
