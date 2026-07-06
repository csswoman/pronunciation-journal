// Planned structure:
// <GeminiClient>
//   withGeminiTimeout — race-based timeout for any promise
//   callWithFallback  — unified fallback loop with per-attempt timeout
// </GeminiClient>

import { GoogleGenAI } from "@google/genai";
import type { GenerateContentParameters } from "@google/genai";
import { FALLBACK_MODELS, shouldTryNextModel } from "./fallback";

export { getErrorStatus, shouldTryNextModel } from "./fallback";

/** Default timeout per Gemini model attempt. */
export const DEFAULT_GEMINI_TIMEOUT_MS = 30_000;

/**
 * Wraps a promise with a hard deadline.
 * Rejects with an Error containing "Gemini timeout" in the message if the
 * deadline is exceeded so `shouldTryNextModel` can classify it correctly.
 */
export function withGeminiTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  }) as Promise<T>;
}

export type GeminiCallParams = Omit<GenerateContentParameters, "model">;

export interface CallWithFallbackOptions {
  /** Hard deadline per model attempt. Default: 30 s. */
  timeoutMs?: number;
  /**
   * Return true to try the next fallback model after this error.
   * Defaults to `shouldTryNextModel` from `./fallback`.
   */
  shouldRetry?: (err: unknown) => boolean;
}

/**
 * Calls Gemini using the configured fallback model chain.
 *
 * Each attempt is guarded by `timeoutMs`. If a model fails and `shouldRetry`
 * returns true, the next model in the chain is tried. Throws if every model
 * fails or a non-retryable error occurs.
 *
 * @param apiKey  GEMINI_API_KEY value.
 * @param params  Request params — everything except `model`.
 * @param parse   Converts the raw response text into the desired return type.
 *                Throw here to trigger a model retry (if shouldRetry returns true).
 * @param options Optional timeout and retry overrides.
 */
export async function callWithFallback<T>(
  apiKey: string,
  params: GeminiCallParams,
  parse: (text: string) => T,
  options: CallWithFallbackOptions = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_GEMINI_TIMEOUT_MS, shouldRetry = shouldTryNextModel } = options;
  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown;

  for (const model of FALLBACK_MODELS) {
    try {
      const result = await withGeminiTimeout(
        ai.models.generateContent({ model, ...params }),
        timeoutMs
      );
      if (!result.text) throw new Error("Empty response from AI");
      return parse(result.text);
    } catch (err: unknown) {
      lastError = err;
      if (!shouldRetry(err)) throw err;
    }
  }

  throw lastError ?? new Error("All fallback models failed");
}

/** Strips markdown code fences from a Gemini JSON response. */
export function stripJsonFences(raw: string): string {
  return raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}
