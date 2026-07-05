import type { EvaluationResult } from "@/lib/exercises/design";
import type { WordResult } from "@/lib/types";

export interface EvaluationResultWithWordResults extends EvaluationResult {
  wordResults: WordResult[];
}

function isWordResult(value: unknown): value is WordResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<WordResult>;
  return typeof candidate.expected === "string"
    && typeof candidate.got === "string"
    && (
      candidate.status === "correct"
      || candidate.status === "incorrect"
      || candidate.status === "missing"
      || candidate.status === "extra"
    );
}

export function getEvaluationWordResults(result: EvaluationResult): WordResult[] {
  if (!("wordResults" in result)) return [];
  const value = result.wordResults;
  return Array.isArray(value) && value.every(isWordResult) ? value : [];
}
