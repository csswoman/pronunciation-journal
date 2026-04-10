/**
 * Web Worker for running Whisper STT inference.
 *
 * Uses @xenova/transformers (Transformers.js) to run
 * Whisper tiny model entirely in the browser.
 *
 * Message protocol:
 *   IN  { type: "load" }
 *   IN  { type: "transcribe", buffer: ArrayBuffer }  ← raw encoded audio (any format)
 *   OUT { type: "progress", progress: number }
 *   OUT { type: "ready" }
 *   OUT { type: "result", text: string }
 *   OUT { type: "error", error: string }
 *
 * All heavy computation (decode, resample, normalize, inference) runs here —
 * the main thread only does blob.arrayBuffer() before posting.
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
  const g = globalThis as { process?: { env?: Record<string, string> } };
  if (!g.process) g.process = { env: {} };
  if (!g.process.env) g.process.env = {};

  const mod = await import("@xenova/transformers");
  pipelineFn = mod.pipeline;
  return pipelineFn;
}

/**
 * Decode an encoded audio ArrayBuffer and resample/normalize to 16kHz mono Float32Array.
 * Uses OfflineAudioContext which is available inside Web Workers in modern browsers.
 */
async function decodeAndResample(buffer: ArrayBuffer): Promise<Float32Array> {
  // Decode the encoded audio (webm, ogg, mp4, etc.) to PCM
  const audioContext = new AudioContext();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioContext.decodeAudioData(buffer);
  } finally {
    await audioContext.close();
  }

  console.log(
    `[Worker] Decoded: ${audioBuffer.duration.toFixed(2)}s, ` +
    `${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels}ch`
  );

  // Resample to 16kHz mono via OfflineAudioContext (browser-native, fast)
  const targetSamples = Math.ceil(audioBuffer.duration * 16000);
  const offlineCtx = new OfflineAudioContext(1, targetSamples, 16000);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start();
  const resampled = await offlineCtx.startRendering();
  const channelData = new Float32Array(resampled.getChannelData(0));

  console.log(`[Worker] Resampled to 16000Hz: ${channelData.length} samples`);

  // RMS normalization (target ~0.1 for clear speech)
  let sum = 0;
  let max = 0;
  for (let i = 0; i < channelData.length; i++) {
    const abs = Math.abs(channelData[i]);
    if (abs > max) max = abs;
    sum += channelData[i] * channelData[i];
  }
  const rms = Math.sqrt(sum / channelData.length);

  console.log(`[Worker] RMS: ${rms.toFixed(4)}, Max: ${max.toFixed(4)}`);

  if (rms < 0.005) {
    console.warn("[Worker] Very low RMS — likely silence or bad capture.");
  }

  const targetRMS = 0.1;
  let gain = targetRMS / (rms + 1e-6);
  gain = Math.min(Math.max(gain, 1.2), 5.0);

  for (let i = 0; i < channelData.length; i++) {
    channelData[i] = Math.max(-1, Math.min(1, channelData[i] * gain));
  }

  console.log(`[Worker] Normalized (gain: ${gain.toFixed(2)}x)`);

  // Pad with 0.4s silence on both ends; ensure minimum 1.5s total
  const paddingSamples = Math.floor(0.4 * 16000);
  const paddedLength = paddingSamples + channelData.length + paddingSamples;
  const targetLength = Math.max(paddedLength, Math.floor(1.5 * 16000));

  const paddedAudio = new Float32Array(targetLength);
  for (let i = 0; i < paddingSamples; i++) {
    paddedAudio[i] = (Math.random() - 0.5) * 0.001;
    paddedAudio[targetLength - 1 - i] = (Math.random() - 0.5) * 0.001;
  }

  const extraStart = Math.floor((targetLength - paddedLength) / 2);
  paddedAudio.set(channelData, paddingSamples + extraStart);

  console.log(
    `[Worker] Final audio: ${paddedAudio.length} samples ` +
    `(${(paddedAudio.length / 16000).toFixed(2)}s)`
  );

  return paddedAudio;
}

self.onmessage = async (event: MessageEvent) => {
  const { type, buffer } = event.data;

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

    let audio: Float32Array;
    try {
      audio = await decodeAndResample(buffer as ArrayBuffer);
    } catch (error) {
      self.postMessage({
        type: "error",
        error: `Audio decode failed: ${error instanceof Error ? error.message : String(error)}`,
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
      console.log(
        `[Worker] Starting transcription for ${audio.length} samples. ` +
        `Min: ${wMin.toFixed(4)}, Max: ${wMax.toFixed(4)}`
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Whisper timeout after 10 seconds")), 10000)
      );

      const transcribePromise = (
        transcriber as unknown as (
          samples: Float32Array,
          opts: Record<string, unknown>
        ) => Promise<unknown>
      )(audio, {
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
