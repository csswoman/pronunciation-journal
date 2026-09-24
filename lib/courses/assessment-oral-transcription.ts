import "server-only";
import { ASSESSMENT_ORAL_TRANSCRIPTION_PROMPT } from "@/lib/ai-prompts";
import { callWithFallback } from "@/lib/gemini/client";

export async function transcribeAssessmentOralAudio(
  audio: Buffer,
  mimeType: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Oral assessment transcription is unavailable");
  const transcript = await callWithFallback(
    apiKey,
    {
      contents: [
        { text: ASSESSMENT_ORAL_TRANSCRIPTION_PROMPT },
        { inlineData: { mimeType, data: audio.toString("base64") } },
      ],
      config: { temperature: 0, maxOutputTokens: 180 },
    },
    (text) => text.trim(),
    { timeoutMs: 15_000 },
  );
  return transcript.trim();
}
