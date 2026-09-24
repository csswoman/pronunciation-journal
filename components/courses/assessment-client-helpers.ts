import type { AssessmentResult, ClientAssessmentQuestion } from "@/lib/courses/assessment";
import { ASSESSMENT_LEVEL_ORDER } from "@/lib/courses/assessment-shared";
import {
  deriveConceptSignal,
  type AssessmentConcept,
  type ConceptSelfRating,
} from "@/lib/courses/concept-profile";
import type { CefrLevelId } from "@/lib/courses/types";
import { persistAssessmentConceptProfile } from "@/lib/courses/assessment-profile";
import { saveGuestStudyLevel } from "@/lib/preferences/guest-study-level";

export function isConcreteCefrLevel(
  value: CefrLevelId | "unsure" | "full" | null,
): value is CefrLevelId {
  return value !== null && value !== "unsure" && value !== "full";
}

export function reportedLevelIsAbove(
  sectionLevel: CefrLevelId,
  reported: CefrLevelId | "unsure" | "full" | null,
): boolean {
  if (!isConcreteCefrLevel(reported)) return false;
  return ASSESSMENT_LEVEL_ORDER.indexOf(reported) > ASSESSMENT_LEVEL_ORDER.indexOf(sectionLevel);
}

export function buildAssessmentCoverageLevels(params: {
  questions: ClientAssessmentQuestion[];
  concepts: AssessmentConcept[];
  answers: Record<string, number>;
  selfRatings: Record<string, ConceptSelfRating>;
}) {
  const { questions, concepts, answers, selfRatings } = params;
  return ASSESSMENT_LEVEL_ORDER.map((level) => {
    const levelQuestions = questions.filter((question) => question.level === level);
    const levelConcepts = concepts.filter((concept) => concept.level === level);
    return {
      level,
      answeredQuestionCount: levelQuestions.filter((question) => answers[question.id] !== undefined).length,
      questionCount: levelQuestions.length,
      ratedTopicCount: levelConcepts.filter((concept) => selfRatings[concept.lessonSlug] !== undefined).length,
      topicCount: levelConcepts.length,
    };
  });
}

export function buildStarterPlanResult(
  concepts: AssessmentConcept[],
  selfRatings: Record<string, ConceptSelfRating>,
): AssessmentResult {
  const assessedAt = new Date().toISOString();
  const conceptSignals = concepts.map((concept) => deriveConceptSignal(
    concept,
    selfRatings[concept.lessonSlug] ?? "unknown",
    { correct: 0, total: 0 },
    assessedAt,
  ));
  return {
    assignedLevel: "A1",
    evaluatedLevels: [],
    confidence: "low",
    passed: false,
    passedLevels: [],
    score: 0,
    total: 0,
    listeningScore: 0,
    listeningTotal: 0,
    topicScores: [],
    strengths: [],
    needsReview: conceptSignals
      .filter((signal) => signal.status === "learn")
      .map(({ lessonSlug, title }) => ({ lessonSlug, title })),
    conceptSignals,
  };
}

export async function persistVerifiedAssessmentLocally(
  userId: string,
  result: AssessmentResult,
): Promise<void> {
  await persistAssessmentConceptProfile(userId, result.conceptSignals, result.assignedLevel);
  try {
    saveGuestStudyLevel(result.assignedLevel);
  } catch {
    /* localStorage may be unavailable */
  }
}

export function persistLocalAssessmentCache(params: {
  userId?: string;
  mode: "placement" | "checkpoint";
  checkpointLabel?: string;
  nextResult: AssessmentResult;
  answers?: Record<string, number>;
  selfRatings?: Record<string, ConceptSelfRating>;
  checkpointLevel?: CefrLevelId | null;
}) {
  const { userId, mode, checkpointLabel, nextResult, answers, selfRatings, checkpointLevel } = params;
  window.localStorage.setItem(
    `assessment:${userId ?? "guest"}:${mode}:${checkpointLabel ?? "placement"}`,
    JSON.stringify({
      ...nextResult,
      answers,
      selfRatings,
      checkpointLevel,
      completedAt: new Date().toISOString(),
    }),
  );
}

export function assessmentFooterCopy(params: {
  showingLevelPrompt: boolean;
  showingInventory: boolean;
  selfReportedLevel: CefrLevelId | "unsure" | "full" | null;
  ratedConcepts: number;
  sectionConceptsLength: number;
  questionIndex: number;
  visibleQuestionsLength: number;
  mode: "placement" | "checkpoint";
}): { footerStatus?: string; primaryLabel: string } {
  const {
    showingLevelPrompt,
    showingInventory,
    selfReportedLevel,
    ratedConcepts,
    sectionConceptsLength,
    questionIndex,
    visibleQuestionsLength,
    mode,
  } = params;

  const remaining = sectionConceptsLength - ratedConcepts;
  const footerStatus = showingLevelPrompt
    ? selfReportedLevel
      ? "Nivel de partida listo."
      : "Elige un nivel aproximado para empezar."
    : showingInventory && remaining > 0
      ? remaining === 1
        ? "Valora 1 tema restante para continuar."
        : `Valora ${remaining} temas restantes para continuar.`
      : undefined;

  const isLastQuestion = questionIndex >= visibleQuestionsLength - 1;
  const primaryLabel = showingLevelPrompt
        ? "Empezar prueba"
        : showingInventory
          ? "Comprobar con preguntas"
          : !isLastQuestion
            ? "Siguiente pregunta"
            : mode === "placement"
              ? "Comprobar nivel"
              : "Ver resultado";

  return { footerStatus, primaryLabel };
}
