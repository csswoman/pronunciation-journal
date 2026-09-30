import type { AssessmentResult } from "@/lib/courses/assessment";
import type { CefrLevelId } from "@/lib/courses/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/service-role";

export async function getAssessmentProfileLevel(userId: string): Promise<string> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) return "a1";
  const { data, error } = await admin
    .from("user_profiles")
    .select("cefr_level")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.cefr_level ?? "a1").toLowerCase();
}

function assessmentResultRow(
  userId: string,
  mode: "placement" | "checkpoint",
  result: AssessmentResult,
  evaluatedLevel?: CefrLevelId,
) {
  return {
    user_id: userId,
    mode,
    evaluated_level: evaluatedLevel?.toUpperCase() ?? null,
    assigned_level: result.assignedLevel,
    score: result.score,
    total: result.total,
    passed: result.passed,
    topic_scores: {
      version: 4,
      listeningScore: result.listeningScore,
      listeningTotal: result.listeningTotal,
      levelScores: (result.levelScores ?? []).map((score) => ({
        level: score.level,
        correct: score.correct,
        total: score.total,
        minimumCorrect: score.minimumCorrect,
        listeningCorrect: score.listeningCorrect,
        listeningTotal: score.listeningTotal,
        minimumListeningCorrect: score.minimumListeningCorrect,
        writtenListeningMet: score.writtenListeningMet ?? null,
        oralRequired: score.oralRequired ?? null,
        oralPassed: score.oralPassed ?? null,
        thresholdMet: score.thresholdMet,
      })),
      oralEvidence: result.oralEvidence
        ? { level: result.oralEvidence.level, status: result.oralEvidence.status }
        : null,
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
  };
}

export async function saveAssessmentResult(
  userId: string,
  mode: "placement" | "checkpoint",
  result: AssessmentResult,
  evaluatedLevel?: CefrLevelId,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("assessment_results")
    .insert(assessmentResultRow(userId, mode, result, evaluatedLevel));

  if (error) throw error;
}

export async function savePendingOralAssessmentResult(
  userId: string,
  attemptId: string,
  level: "a1" | "a2",
  result: AssessmentResult,
): Promise<void> {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client unavailable for oral assessment result");
  const { error } = await admin.from("assessment_results").upsert({
    id: attemptId,
    ...assessmentResultRow(userId, "checkpoint", result, level),
  }, { onConflict: "id" });

  if (error) throw error;
}

export async function persistAssessmentOutcome(
  userId: string,
  mode: "placement" | "checkpoint",
  result: AssessmentResult,
  evaluatedLevel?: CefrLevelId,
): Promise<void> {
  await saveAssessmentResult(userId, mode, result, evaluatedLevel);

  if (mode === "checkpoint" && !result.passed) {
    return;
  }

  if (mode === "checkpoint") {
    const currentLevel = await getAssessmentProfileLevel(userId);
    const levels = ["a1", "a2", "b1", "b2", "c1", "c2"];
    const currentIndex = levels.indexOf(currentLevel.toLowerCase());
    const assignedIndex = levels.indexOf(result.assignedLevel.toLowerCase());
    if (currentIndex > assignedIndex && assignedIndex >= 0) return;
  }

  const admin = tryGetSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client unavailable for updating user profile");
  }

  const levelUpdatedAt = new Date().toISOString();
  const profileUpdate = {
    id: userId,
    cefr_level: result.assignedLevel,
    cefr_level_source: mode,
    cefr_level_updated_at: levelUpdatedAt,
  };

  const { error } = await admin
    .from("user_profiles")
    .upsert(profileUpdate, { onConflict: "id" });

  if (error) throw error;
}
