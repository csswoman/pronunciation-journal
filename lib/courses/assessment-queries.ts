import type { AssessmentResult } from "@/lib/courses/assessment";
import type { CefrLevelId } from "@/lib/courses/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/service-role";

function isMissingAssessmentTable(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

export async function saveAssessmentResult(
  userId: string,
  mode: "placement" | "checkpoint",
  result: AssessmentResult,
  evaluatedLevel?: CefrLevelId,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("assessment_results").insert({
    user_id: userId,
    mode,
    evaluated_level: evaluatedLevel?.toUpperCase() ?? null,
    assigned_level: result.assignedLevel,
    score: result.score,
    total: result.total,
    passed: result.passed,
    topic_scores: {
      version: 2,
      topics: result.topicScores,
      concepts: result.conceptSignals.map((signal) => ({
        lessonSlug: signal.lessonSlug,
        level: signal.level,
        title: signal.title,
        selfRating: signal.selfRating,
        status: signal.status,
        correct: signal.correct,
        total: signal.total,
        assessedAt: signal.assessedAt,
      })),
    },
  });

  if (error && !isMissingAssessmentTable(error)) throw error;
}

export async function persistAssessmentOutcome(
  userId: string,
  mode: "placement" | "checkpoint",
  result: AssessmentResult,
  evaluatedLevel?: CefrLevelId,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const [profileResult] = await Promise.all([
    supabase.from("user_profiles").upsert({
      id: userId,
      cefr_level: result.assignedLevel,
    }, { onConflict: "id" }),
    saveAssessmentResult(userId, mode, result, evaluatedLevel),
  ]);

  if (profileResult.error) {
    const admin = tryGetSupabaseAdminClient();
    if (admin) {
      const { error: adminError } = await admin
        .from("user_profiles")
        .upsert({ id: userId, cefr_level: result.assignedLevel }, { onConflict: "id" });
      if (adminError) throw profileResult.error;
    } else {
      throw profileResult.error;
    }
  }
}
