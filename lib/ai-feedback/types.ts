import type { ErrorPatternId } from "@/lib/exercises/error-patterns";

export type AIFeedbackFeature =
  | "coach_correction"
  | "production_grade"
  | "journal_correction";

export interface ReportWrongFeedbackOptions {
  userId: string;
  feature: AIFeedbackFeature;
  promptVersion?: string;
  input: unknown;
  output: unknown;
  errorPattern?: ErrorPatternId | null;
  comment?: string | null;
}

export interface AIFeedbackReport {
  id: string;
  userId: string;
  feature: AIFeedbackFeature;
  promptVersion: string;
  inputSnapshot: unknown;
  outputSnapshot: unknown;
  errorPattern: string | null;
  comment: string | null;
  createdAt: string;
}
