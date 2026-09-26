/** Message protocol for `lib/speech/kokoro/kokoro-worker.ts`. */

export type KokoroWorkerRequest =
  | { type: "load" }
  | { type: "generate"; requestId: string; text: string; voiceId: string };

export type KokoroWorkerResponse =
  | { type: "ready" }
  | { type: "progress"; progress: number }
  | { type: "result"; requestId: string; samples: ArrayBuffer; sampleRate: number }
  | { type: "error"; requestId?: string; error: string };

/** The 28 English voice ids exposed by `onnx-community/Kokoro-82M-v1.0-ONNX`. */
export const KOKORO_ENGLISH_VOICES = [
  "af_heart",
  "af_alloy",
  "af_aoede",
  "af_bella",
  "af_jessica",
  "af_kore",
  "af_nicole",
  "af_nova",
  "af_river",
  "af_sarah",
  "af_sky",
  "am_adam",
  "am_echo",
  "am_eric",
  "am_fenrir",
  "am_liam",
  "am_michael",
  "am_onyx",
  "am_puck",
  "am_santa",
  "bf_alice",
  "bf_emma",
  "bf_isabella",
  "bf_lily",
  "bm_daniel",
  "bm_fable",
  "bm_george",
  "bm_lewis",
] as const;

export type KokoroVoiceId = (typeof KOKORO_ENGLISH_VOICES)[number];
