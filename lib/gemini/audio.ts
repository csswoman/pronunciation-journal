// Planned structure:
// <GeminiAudio>
//   pcmToWav               — writes standard 44-byte WAV header to raw PCM
//   parseSampleRateFromMime— parses sample rate from audio mimeType string
//   generateReaderSpeech   — calls Gemini with speech output and returns a WAV Buffer
// </GeminiAudio>

import { GoogleGenAI } from "@google/genai";
import type { GenerateContentParameters } from "@google/genai";
import { createHash } from "node:crypto";
import {
  buildReaderAudioPrompt,
  buildMissionAudioPrompt,
  buildListeningAudioPrompt,
} from "@/lib/ai-prompts";
import { shouldTryNextModel } from "@/lib/gemini/fallback";
import { withGeminiTimeout } from "@/lib/gemini/client";
import { filterAvailable, markCooldownFromError } from "@/lib/gemini/cooldown";
import { recordModelFailure, reserveModel } from "@/lib/ai-usage/budget";

/** Fallback sample rate for raw PCM responses from Gemini speech synthesis. */
export const DEFAULT_SAMPLE_RATE = 24_000;

export const AUDIO_MODELS = [
  "gemini-3.8-flash-lite-tts",
  "gemini-3.8-flash-tts",
] as const;

export const AUDIO_CACHE_VERSION = "tts-v2";
export const MIN_TTS_MODEL_INTERVAL_MS = 20_000;

const lastModelStartedAt = new Map<string, number>();
let synthesisQueue: Promise<void> = Promise.resolve();

function enqueueSynthesis<T>(task: () => Promise<T>): Promise<T> {
  const result = synthesisQueue.then(task, task);
  synthesisQueue = result.then(() => undefined, () => undefined);
  return result;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForModelSlot(model: string): Promise<void> {
  const lastStartedAt = lastModelStartedAt.get(model);
  if (lastStartedAt !== undefined) {
    const delayMs = lastStartedAt + MIN_TTS_MODEL_INTERVAL_MS - Date.now();
    if (delayMs > 0) await wait(delayMs);
  }
  lastModelStartedAt.set(model, Date.now());
}

/** Cache identity includes the feature, normalized spoken text, voice, model and manual version. */
export function buildSpeechCacheKey(
  feature: string,
  text: string,
  voice: string,
  model: string,
): string {
  const normalizedText = text.normalize("NFKC").trim().replace(/\s+/g, " ");
  return createHash("sha256")
    .update(JSON.stringify([feature, AUDIO_CACHE_VERSION, normalizedText, voice, model]))
    .digest("hex");
}

/** Reset queue timing in unit tests after all queued work has completed. */
export function _resetSpeechQueueStateForTests(): void {
  lastModelStartedAt.clear();
  synthesisQueue = Promise.resolve();
}

/**
 * Prepends a standard 44-byte canonical WAV header to linear PCM 16-bit audio data.
 */
export function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate = DEFAULT_SAMPLE_RATE,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = pcmBuffer.length;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Extracts the sample rate integer from a mimeType string like `audio/pcm;rate=24000`.
 */
export function parseSampleRateFromMime(
  mimeType?: string,
  fallback = DEFAULT_SAMPLE_RATE
): number {
  if (!mimeType) return fallback;
  const match = mimeType.match(/rate=(\d+)/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

export interface GenerateSpeechOptions {
  voice?: string;
  models?: readonly string[];
  timeoutMs?: number;
  feature?: string;
  onModelUsed?: (model: string) => void;
}

async function synthesizeGeminiSpeech(
  apiKey: string,
  prompt: { transcript: string; style: string },
  options: GenerateSpeechOptions = {}
): Promise<Buffer> {
  return enqueueSynthesis(() => synthesizeGeminiSpeechQueued(apiKey, prompt, options));
}

async function synthesizeGeminiSpeechQueued(
  apiKey: string,
  prompt: { transcript: string; style: string },
  options: GenerateSpeechOptions,
): Promise<Buffer> {
  const {
    voice = "Puck",
    models = AUDIO_MODELS,
    timeoutMs = 45_000,
    feature = "tts-unattributed",
  } = options;
  const ai = new GoogleGenAI({ apiKey });

  let lastError: unknown;
  let budgetDenied = false;

  for (const model of filterAvailable(models)) {
    if (!(await reserveModel(model, feature))) {
      budgetDenied = true;
      continue;
    }
    try {
      await waitForModelSlot(model);
      // SDK 2.23 does not type the GenerateContent speechMetadata field yet,
      // but the Gemini API accepts it and keeps style directions out of speech.
      const contents = [{
        role: "user" as const,
        parts: [{ text: prompt.transcript, speechMetadata: { style: prompt.style } }],
      }] as unknown as GenerateContentParameters["contents"];
      const response = await withGeminiTimeout(ai.models.generateContent({
        model,
        contents,
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
          },
        },
      }), timeoutMs);
      const candidate = response.candidates?.[0];
      const audioPart = candidate?.content?.parts?.find(
        (p) => p.inlineData?.data && p.inlineData?.mimeType?.toLowerCase().startsWith("audio/")
      );

      if (!audioPart || !audioPart.inlineData?.data) {
        throw new Error(`Model ${model} did not return audio data in parts`);
      }

      const rawBuffer = Buffer.from(audioPart.inlineData.data, "base64");
      const mime = (audioPart.inlineData.mimeType ?? "").toLowerCase();

      // If already WAV format with RIFF header, return directly
      if (
        (mime.includes("wav") || mime.includes("wave")) &&
        rawBuffer.length > 12 &&
        rawBuffer.toString("ascii", 0, 4) === "RIFF"
      ) {
        options.onModelUsed?.(model);
        return rawBuffer;
      }

      // Convert PCM to standard WAV
      const sampleRate = parseSampleRateFromMime(mime, DEFAULT_SAMPLE_RATE);
      options.onModelUsed?.(model);
      return pcmToWav(rawBuffer, sampleRate);
    } catch (err) {
      lastError = err;
      markCooldownFromError(model, err);
      await recordModelFailure(model, feature);
      const invalidAudio = String((err as { message?: unknown })?.message ?? "")
        .includes("did not return audio data in parts");
      if (!invalidAudio && !shouldTryNextModel(err)) throw err;
    }
  }

  if (budgetDenied && !lastError) {
    throw Object.assign(new Error("Daily TTS model budget exhausted"), { status: 429 });
  }
  throw lastError ?? new Error("All TTS audio models failed to generate speech");
}

/**
 * Generates natural spoken audio for reading stories using Gemini TTS.
 */
export async function generateReaderSpeech(
  apiKey: string,
  passageText: string,
  options: GenerateSpeechOptions = {}
): Promise<Buffer> {
  return synthesizeGeminiSpeech(apiKey, buildReaderAudioPrompt(passageText), options);
}

/**
 * Generates natural spoken audio for conversational mission dialogue lines using Gemini TTS.
 */
export async function generateMissionSpeech(
  apiKey: string,
  lineText: string,
  options: GenerateSpeechOptions = {}
): Promise<Buffer> {
  return synthesizeGeminiSpeech(apiKey, buildMissionAudioPrompt(lineText), options);
}

/**
 * Generates natural spoken audio for a single listening-assessment dialogue line.
 * Returned as a WAV Buffer; callers may strip the 44-byte header to concatenate
 * multiple lines into one clip.
 */
export async function generateListeningSpeech(
  apiKey: string,
  lineText: string,
  options: GenerateSpeechOptions = {}
): Promise<Buffer> {
  return synthesizeGeminiSpeech(apiKey, buildListeningAudioPrompt(lineText), options);
}
