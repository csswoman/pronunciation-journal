// Planned structure:
// <GeminiClient>
//   withGeminiTimeout — race-based timeout for any promise
//   callWithFallback  — unified fallback loop with per-attempt timeout
// </GeminiClient>

import { GoogleGenAI } from "@google/genai";
import type { GenerateContentParameters } from "@google/genai";
import { FALLBACK_MODELS, getErrorStatus, getFastThinkingConfig, shouldTryNextModel } from "./fallback";
import { filterAvailable, markCooldownFromError } from "./cooldown";
import { recordModelFailure, recordModelSuccess, reserveModel } from "@/lib/ai-usage/budget";

export { getErrorStatus, shouldTryNextModel } from "./fallback";

/** Default timeout per Gemini model attempt. */
export const DEFAULT_GEMINI_TIMEOUT_MS = 12_000;
export const DEFAULT_GEMINI_TOTAL_TIMEOUT_MS = 25_000;
export const DEFAULT_GEMINI_MAX_ATTEMPTS = 2;

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
  /** Hard deadline per model attempt. Default: 12 s. */
  timeoutMs?: number;
  /** End-to-end deadline shared by reservations and every model attempt. */
  totalTimeoutMs?: number;
  /** Maximum provider calls for an interactive request. */
  maxAttempts?: number;
  /** Model order for this task. Defaults to the high-throughput chain. */
  models?: readonly string[];
  /** Stable route/feature label used for shared daily quota reservations. */
  feature?: string;
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
  const {
    timeoutMs = DEFAULT_GEMINI_TIMEOUT_MS,
    totalTimeoutMs = DEFAULT_GEMINI_TOTAL_TIMEOUT_MS,
    maxAttempts = DEFAULT_GEMINI_MAX_ATTEMPTS,
    shouldRetry = shouldTryNextModel,
    models = FALLBACK_MODELS,
    feature = "gemini-unattributed",
  } = options;
  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown;
  let budgetDenied = false;
  const deadlineAt = Date.now() + totalTimeoutMs;

  for (const model of filterAvailable(models).slice(0, maxAttempts)) {
    const remainingBeforeReservation = deadlineAt - Date.now();
    if (remainingBeforeReservation <= 0) break;
    if (!(await reserveModel(model, feature))) {
      budgetDenied = true;
      continue;
    }
    const startedAt = Date.now();
    try {
      const remainingMs = deadlineAt - Date.now();
      if (remainingMs <= 0) break;
      const attemptTimeoutMs = Math.max(1, Math.min(timeoutMs, remainingMs));
      const abortSignal = AbortSignal.timeout(attemptTimeoutMs);
      const thinkingConfig = getFastThinkingConfig(model);
      const effectiveConfig = thinkingConfig
        ? { ...params.config, thinkingConfig: (params.config as { thinkingConfig?: unknown } | undefined)?.thinkingConfig ?? thinkingConfig }
        : { ...params.config };

      const result = await ai.models.generateContent({
        model,
        ...params,
        config: {
          ...effectiveConfig,
          httpOptions: { ...effectiveConfig?.httpOptions, timeout: attemptTimeoutMs },
          abortSignal,
        },
      });
      if (!result.text) throw new Error("Empty response from AI");
      const parsed = parse(result.text);
      void recordModelSuccess(model, feature, Date.now() - startedAt);
      return parsed;
    } catch (err: unknown) {
      lastError = err;
      markCooldownFromError(model, err);
      void recordModelFailure(model, feature, getErrorStatus(err), String((err as { name?: unknown })?.name ?? "error"), Date.now() - startedAt);
      if (Date.now() >= deadlineAt) break;
      if (!shouldRetry(err)) throw err;
    }
  }

  if (budgetDenied && !lastError) {
    throw Object.assign(new Error("Daily AI model budget exhausted"), { status: 429 });
  }
  if (Date.now() >= deadlineAt) {
    throw Object.assign(new Error(`Gemini request timed out after ${totalTimeoutMs}ms`), { status: 504 });
  }
  throw lastError ?? new Error("All fallback models failed");
}

/** Strips markdown code fences from a Gemini JSON response. */
export function stripJsonFences(raw: string): string {
  return raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}
