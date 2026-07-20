import { notFound } from "next/navigation";
import AssessmentClient from "@/components/courses/AssessmentClient";
import { buildAssessmentQuestions } from "@/lib/courses/assessment";
import type { AssessmentConcept } from "@/lib/courses/concept-profile";
import { buildAssessment } from "@/lib/courses/curriculum";
import { getDeckBySlug } from "@/lib/courses/grammar-deck/decks";
import type { GrammarQuizQuestion } from "@/lib/courses/grammar-deck/types";
import { parseCefrLevelId } from "@/lib/courses/curriculumIndex";
import { getSupabaseServerUser } from "@/lib/supabase/session";
import "@/app/styles/assessment.css";

interface AssessmentPageProps {
  searchParams: Promise<{ mode?: string; level?: string }>;
}

export default async function AssessmentPage({ searchParams }: AssessmentPageProps) {
  const [params, user] = await Promise.all([searchParams, getSupabaseServerUser()]);
  const mode = params.mode === "checkpoint" ? "checkpoint" : "placement";
  const checkpointLevel = parseCefrLevelId(params.level);
  if (mode === "checkpoint" && !checkpointLevel) notFound();

  const sections = buildAssessment(mode, checkpointLevel ?? undefined);
  const quizzes: Record<string, GrammarQuizQuestion[]> = {};
  for (const slug of sections.flatMap((section) => section.items.map((item) => item.lessonSlug))) {
    quizzes[slug] = getDeckBySlug(slug)?.quiz ?? [];
  }
  const questions = buildAssessmentQuestions(mode, quizzes, checkpointLevel ?? undefined);
  const concepts: AssessmentConcept[] = mode === "placement"
    ? sections.flatMap((section) => section.items.slice(0, 6).map((item) => {
        const meta = getDeckBySlug(item.lessonSlug)?.meta;
        return {
          lessonSlug: item.lessonSlug,
          level: section.level,
          title: meta?.title ?? item.lessonSlug.replace(/^[a-z]\d-/, "").replaceAll("-", " "),
          goal: meta?.goal,
        };
      }))
    : [];

  if (questions.length === 0) notFound();

  return (
    <AssessmentClient
      mode={mode}
      questions={questions}
      concepts={concepts}
      checkpointLabel={checkpointLevel?.toUpperCase()}
      userId={user?.id}
    />
  );
}
