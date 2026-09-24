import { notFound } from "next/navigation";
import AssessmentClient from "@/components/courses/AssessmentClient";
import { buildServerAssessment } from "@/lib/courses/server-assessment";
import { toClientAssessmentQuestions } from "@/lib/courses/assessment";
import { ASSESSMENT_LEVEL_ORDER } from "@/lib/courses/assessment-shared";
import { getLevelById, parseCefrLevelId } from "@/lib/courses/curriculumIndex";
import { getSupabaseServerUser } from "@/lib/supabase/session";
import { getEffectiveLearnerLevelServer } from "@/lib/learner-level/server-queries";
import "@/app/styles/assessment.css";

interface AssessmentPageProps {
  searchParams: Promise<{ mode?: string; level?: string }>;
}

export default async function AssessmentPage({ searchParams }: AssessmentPageProps) {
  const [params, user] = await Promise.all([searchParams, getSupabaseServerUser()]);
  const mode = params.mode === "checkpoint" ? "checkpoint" : "placement";
  const checkpointLevel = parseCefrLevelId(params.level);
  if (mode === "checkpoint" && !checkpointLevel) notFound();

  const { questions, concepts } = buildServerAssessment(mode, checkpointLevel ?? undefined);

  if (questions.length === 0) notFound();

  const checkpointIndex = checkpointLevel ? ASSESSMENT_LEVEL_ORDER.indexOf(checkpointLevel) : -1;
  const nextLevelId = checkpointIndex >= 0 ? ASSESSMENT_LEVEL_ORDER[checkpointIndex + 1] : undefined;
  const nextLevelTopics = nextLevelId
    ? getLevelById(nextLevelId)?.units
      .flatMap((unit) => unit.lessons)
      .filter((lesson) => !lesson.isOptional)
      .slice(0, 4)
      .map((lesson) => ({
        title: lesson.title,
        ...(lesson.description ? { description: lesson.description } : {}),
      })) ?? []
    : [];

  let initialLevel = null;
  if (mode === "placement" && user) {
    try {
      const resolution = await getEffectiveLearnerLevelServer(user.id);
      // The A1 fallback is safe to display but must not anchor a failed read.
      initialLevel = resolution.source === "unknown"
        ? null
        : parseCefrLevelId(resolution.level.toLowerCase());
    } catch {
      // The assessment remains available when profile preferences cannot load.
    }
  }

  return (
    <AssessmentClient
      mode={mode}
      questions={toClientAssessmentQuestions(questions)}
      concepts={concepts}
      checkpointLabel={checkpointLevel?.toUpperCase()}
      userId={user?.id}
      initialLevel={initialLevel}
      nextLevelTopics={nextLevelTopics}
    />
  );
}
