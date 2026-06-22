import type { AssessmentResult } from "@/lib/courses/assessment";
import type { CefrLevelId } from "@/lib/courses/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function saveAssessmentResult(
  userId: string,
  mode: "placement" | "checkpoint",
  result: AssessmentResult,
  evaluatedLevel?: CefrLevelId,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("assessment_results").insert({
    user_id: userId,
    mode,
    evaluated_level: evaluatedLevel?.toUpperCase() ?? null,
    assigned_level: result.assignedLevel,
    score: result.score,
    total: result.total,
    passed: result.passed,
    topic_scores: result.topicScores,
  });

  if (error && error.code !== "PGRST205" && error.code !== "42P01") throw error;
}

export async function persistAssessmentOutcome(
  userId: string,
  mode: "placement" | "checkpoint",
  result: AssessmentResult,
  evaluatedLevel?: CefrLevelId,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await Promise.all([
    supabase.from("user_profiles").upsert({
      id: userId,
      cefr_level: result.assignedLevel,
    }, { onConflict: "id" }),
    saveAssessmentResult(userId, mode, result, evaluatedLevel),
  ]);
}
