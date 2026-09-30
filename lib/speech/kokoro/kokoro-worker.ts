/**
 * Web Worker that loads Kokoro TTS (`kokoro-js`) and synthesizes speech off
 * the main thread. Model weights are fetched from Hugging Face on demand
 * (never on load — see `lib/speech/kokoro/types.ts` for the activation
 * contract); the ONNX Runtime `.wasm` binaries ship from `public/wasm/`
 * (same-origin, `worker-src 'self'` in `proxy.ts`).
 *
 * Message protocol: see `KokoroWorkerRequest` / `KokoroWorkerResponse` in
 * `./types.ts`. The worker never throws to its own global scope — every
 * failure is reported as an `{ type: 'error' }` response so the caller in
 * `lib/speech/tts-provider.ts` can fall back to `speechSynthesis`.
 */
import { env, KokoroTTS } from "kokoro-js";
import type { KokoroWorkerRequest, KokoroWorkerResponse } from "./types";

// ONNX Runtime Web's WASM binaries are vendored into public/wasm/ (see
// scripts/vendor-onnxruntime-wasm.mjs) instead of being fetched from a CDN,
// so the CSP does not need a third-party worker-src / connect-src entry for
// them.
env.wasmPaths = "/wasm/";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
/** Resilient to quantization per the model card; keeps the download <100MB. */
const DTYPE = "q8" as const;

let ttsPromise: ReturnType<typeof KokoroTTS.from_pretrained> | null = null;

function post(message: KokoroWorkerResponse): void {
  postMessage(message);
}

async function loadModel(): Promise<InstanceType<typeof KokoroTTS>> {
  if (!ttsPromise) {
    ttsPromise = KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: DTYPE,
      device: "wasm",
      progress_callback: (progress: unknown) => {
        const p = progress as { status?: string; progress?: number };
        if (typeof p?.progress === "number") {
          post({ type: "progress", progress: p.progress });
        }
      },
    } as never);
  }
  try {
    return await ttsPromise;
  } catch (err) {
    // Do not cache a rejected load — a transient network failure during
    // model download should not permanently disable Kokoro for the tab.
    ttsPromise = null;
    throw err;
  }
}

self.addEventListener("message", (event: MessageEvent<KokoroWorkerRequest>) => {
  const data = event.data;
  void handleMessage(data);
});

async function handleMessage(data: KokoroWorkerRequest): Promise<void> {
  try {
    if (data.type === "load") {
      await loadModel();
      post({ type: "ready" });
      return;
    }

    if (data.type === "generate") {
      const tts = await loadModel();
      const audio = await tts.generate(data.text, { voice: data.voiceId as never });
      // `audio` (RawAudio from @huggingface/transformers) exposes `.audio`
      // (Float32Array) and `.sampling_rate`.
      const samples = (audio as { audio: Float32Array }).audio;
      const sampleRate = (audio as { sampling_rate: number }).sampling_rate;
      post({
        type: "result",
        requestId: data.requestId,
        samples: samples.buffer as ArrayBuffer,
        sampleRate,
      });
      return;
    }
  } catch (err) {
    post({
      type: "error",
      requestId: "requestId" in data ? data.requestId : undefined,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
