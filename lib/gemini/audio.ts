// Planned structure:
// <GeminiAudio>
//   pcmToWav               — writes standard 44-byte WAV header to raw PCM
//   parseSampleRateFromMime— parses sample rate from audio mimeType string
//   generateReaderSpeech   — calls Gemini with speech output and returns a WAV Buffer
// </GeminiAudio>

import { GoogleGenAI } from "@google/genai";
import { buildReaderAudioPrompt, buildMissionAudioPrompt } from "@/lib/ai-prompts";

/** Default sampling rate for Gemini 2.5/3.1 speech synthesis. */
export const DEFAULT_SAMPLE_RATE = 24_000;

export const AUDIO_MODELS = [
  "gemini-2.5-flash-preview-tts",
  "gemini-2.5-flash",
  "gemini-3.1-flash-tts-preview",
] as const;

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
}

async function synthesizeGeminiSpeech(
  apiKey: string,
  prompt: string,
  options: GenerateSpeechOptions = {}
): Promise<Buffer> {
  const { voice = "Puck", models = AUDIO_MODELS, timeoutMs = 45_000 } = options;
  const ai = new GoogleGenAI({ apiKey });

  let lastError: unknown;

  for (const model of models) {
    try {
      const callPromise = ai.models.generateContent({
        model,
        contents: prompt,
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
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Audio generation timeout (${model})`)), timeoutMs);
      });

      const response = await Promise.race([callPromise, timeoutPromise]);
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
        return rawBuffer;
      }

      // Convert PCM to standard WAV
      const sampleRate = parseSampleRateFromMime(mime, DEFAULT_SAMPLE_RATE);
      return pcmToWav(rawBuffer, sampleRate);
    } catch (err) {
      lastError = err;
      // Try next fallback model
    }
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

