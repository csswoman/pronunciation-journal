import { notFound } from "next/navigation";
import AssessmentClient from "@/components/courses/AssessmentClient";
import { buildAssessmentQuestions } from "@/lib/courses/assessment";
import { buildAssessment } from "@/lib/courses/curriculum";
import { getDeckBySlug } from "@/lib/courses/grammar-deck/decks";
import type { GrammarQuizQuestion } from "@/lib/courses/grammar-deck/types";
import { parseCefrLevelId } from "@/lib/courses/curriculumIndex";
import "@/app/styles/assessment.css";

interface AssessmentPageProps {
  searchParams: Promise<{ mode?: string; level?: string }>;
}

export default async function AssessmentPage({ searchParams }: AssessmentPageProps) {
  const params = await searchParams;
  const mode = params.mode === "checkpoint" ? "checkpoint" : "placement";
  const checkpointLevel = parseCefrLevelId(params.level);
  if (mode === "checkpoint" && !checkpointLevel) notFound();

  const sections = buildAssessment(mode, checkpointLevel ?? undefined);
  const quizzes: Record<string, GrammarQuizQuestion[]> = {};
  for (const slug of sections.flatMap((section) => section.items.map((item) => item.lessonSlug))) {
    quizzes[slug] = getDeckBySlug(slug)?.quiz ?? [];
  }
  const questions = buildAssessmentQuestions(
    mode,
    quizzes,
    checkpointLevel ?? undefined,
  );

  if (questions.length === 0) notFound();

  return (
    <AssessmentClient
      mode={mode}
      questions={questions}
      checkpointLabel={checkpointLevel?.toUpperCase()}
    />
  );
}
