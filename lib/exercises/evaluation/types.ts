import type { ExerciseType } from "../taxonomy";
import type { CEFRLevel } from "../cefr";
import type { EvaluationResult } from "../design";
import type { ExerciseDesign } from "../design";

export type { EvaluationResult };

export type ActualAnswer =
  | { kind: 'text'; value: string }
  | { kind: 'speech'; transcript: string; confidence?: number }
  | { kind: 'selection'; chosen: string | string[] };

export interface EvaluationInput {
  exercise: ExerciseType;
  expected: string;
  actual: ActualAnswer;
  userLevel?: CEFRLevel;
  threshold?: number; // para speak: score minimo (0-100), default 70
  design?: ExerciseDesign; // <- nuevo, requerido para modos text-based
}

export interface EvaluationEngine {
  evaluate(input: EvaluationInput): Promise<EvaluationResult>;
}
