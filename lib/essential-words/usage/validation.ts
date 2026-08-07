import type { UsagePayload } from "../verification/types";

export type NonAppearanceReason =
  | "not_generated"
  | "generation_failed"
  | "offline"
  | "invalid_content"
  | "daily_capacity_reached";

export type UsageValidation =
  | { ok: true }
  | { ok: false; reason: NonAppearanceReason; detail: string };

/** Minimum words needed for a sentence to assess usage rather than echo it. */
const MIN_SENTENCE_WORDS = 5;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function sentenceContainsAcceptedExpression(payload: UsagePayload): boolean {
  const sentence = normalize(payload.sentence);
  return [payload.expression, ...payload.acceptedVariants]
    .map(normalize)
    .some((expression) => expression.length > 0 && sentence.includes(expression));
}

/**
 * Validates generated content before activation. Non-appearance reasons make
 * it observable whether content is correctly gated or generation is failing.
 */
export function validateUsagePayload(
  payload: UsagePayload,
  existingExpressions: string[],
): UsageValidation {
  if (payload.generationStatus === "pending") {
    return { ok: false, reason: "not_generated", detail: "generation pending" };
  }
  if (payload.generationStatus === "failed") {
    return { ok: false, reason: "generation_failed", detail: "generator reported failure" };
  }
  if (payload.metadata.schemaVersion === undefined) {
    return { ok: false, reason: "invalid_content", detail: "missing schemaVersion" };
  }
  if (!sentenceContainsAcceptedExpression(payload)) {
    return { ok: false, reason: "invalid_content", detail: "sentence lacks the expression" };
  }
  if (payload.sentence.trim().split(/\s+/).length < MIN_SENTENCE_WORDS) {
    return { ok: false, reason: "invalid_content", detail: "sentence too short to test usage" };
  }

  const expression = normalize(payload.expression);
  const duplicate = existingExpressions.some((existing) => normalize(existing) === expression);
  if (duplicate) {
    return { ok: false, reason: "invalid_content", detail: "duplicates an existing item" };
  }

  return { ok: true };
}
