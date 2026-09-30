import type { CEFRLevel } from "@/lib/exercises/cefr";

export type ContentBankToolName =
  | "render_multiple_choice"
  | "render_fill_blank"
  | "render_speaking";

export interface ContentBankItem {
  id: string;
  kind: "coach_exercise";
  tool_name: ContentBankToolName;
  level: CEFRLevel;
  topic_id: string;
  payload: Record<string, unknown>;
  prompt_version: string;
  stem_hash: string;
  quality_flags: number;
  created_at: string;
}

export interface GeneratedExerciseCandidate {
  tool_name: ContentBankToolName;
  payload: Record<string, unknown>;
  stem_hash: string;
}
