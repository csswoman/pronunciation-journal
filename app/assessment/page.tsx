import { notFound } from "next/navigation";
import AssessmentClient from "@/components/courses/AssessmentClient";
import { buildServerAssessment } from "@/lib/courses/server-assessment";
import { parseCefrLevelId } from "@/lib/courses/curriculumIndex";
import { getSupabaseServerUser } from "@/lib/supabase/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

  let profileLevel = null;
  if (mode === "placement" && user) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from("user_profiles")
        .select("cefr_level")
        .eq("id", user.id)
        .maybeSingle();
      profileLevel = parseCefrLevelId(data?.cefr_level?.toLowerCase());
    } catch {
      // The assessment remains available when profile preferences cannot load.
    }
  }

  return (
    <AssessmentClient
      mode={mode}
      questions={questions}
      concepts={concepts}
      checkpointLabel={checkpointLevel?.toUpperCase()}
      userId={user?.id}
      initialLevel={profileLevel}
    />
  );
}
