import type { CefrLevelId } from "@/lib/courses/types";
import type { GrammarQuizQuestion } from "@/lib/courses/grammar-deck/types";
import { buildAssessment } from "@/lib/courses/curriculum";
import { getDeckBySlug } from "@/lib/courses/grammar-deck/decks";
import { getLessonBySlug } from "@/lib/courses/curriculumIndex";
import type { AssessmentConcept } from "@/lib/courses/concept-profile";
import {
  buildAssessmentQuestions,
  type AssessmentQuestion,
} from "./assessment";

export function buildServerAssessment(
  mode: "placement" | "checkpoint",
  checkpointLevel?: CefrLevelId,
  evaluatedLevels?: CefrLevelId[],
): { questions: AssessmentQuestion[]; concepts: AssessmentConcept[] } {
  const sections = buildAssessment(mode, checkpointLevel);
  const quizzes: Record<string, GrammarQuizQuestion[]> = {};
  for (const slug of sections.flatMap((section) => section.items.map((item) => item.lessonSlug))) {
    quizzes[slug] = getDeckBySlug(slug)?.quiz ?? [];
  }
  const includedLevels = mode === "checkpoint"
    ? [checkpointLevel ?? "a1"]
    : evaluatedLevels ?? sections.map((section) => section.level);
  const questions = buildAssessmentQuestions(mode, quizzes, checkpointLevel)
    .filter((question) => includedLevels.includes(question.level))
    .map((question) => ({
      ...question,
      topicTitle: getLessonBySlug(question.lessonSlug)?.title
        ?? question.lessonSlug.replace(/^[a-z]\d-/, "").replaceAll("-", " "),
    }));
  const concepts: AssessmentConcept[] = mode === "placement"
    ? sections.flatMap((section) => section.items.slice(0, 6).map((item) => {
        const meta = getDeckBySlug(item.lessonSlug)?.meta;
        const lesson = getLessonBySlug(item.lessonSlug);
        return {
          lessonSlug: item.lessonSlug,
          level: section.level,
          title: lesson?.title
            ?? meta?.title
            ?? item.lessonSlug.replace(/^[a-z]\d-/, "").replaceAll("-", " "),
          goal: meta?.goal,
        };
      })).filter((concept) => includedLevels.includes(concept.level))
    : [];
  return { questions, concepts };
}
