import {
  ASSESSMENT_LEVEL_ORDER,
  levelPassed,
  scoreAssessment,
  type AssessmentQuestion,
  type AssessmentResult,
} from "@/lib/courses/assessment";
import type { AssessmentConcept, ConceptSelfRating } from "@/lib/courses/concept-profile";
import type { CefrLevelId } from "@/lib/courses/types";
import { persistAssessmentConceptProfile } from "@/lib/courses/assessment-profile";

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

export async function saveAssessmentLevel(params: {
  mode: "placement" | "checkpoint";
  questions: AssessmentQuestion[];
  userId: string;
  nextResult: AssessmentResult;
  setSaving: (value: boolean) => void;
  setSaveError: (value: boolean) => void;
}) {
  const { mode, questions, userId, nextResult, setSaving, setSaveError } = params;
  setSaving(true);
  setSaveError(false);
  try {
    const evaluatedLevel =
      mode === "checkpoint"
        ? questions[0]?.level ?? null
        : nextResult.evaluatedLevels?.reduce<CefrLevelId | null>((highest, level) => {
            if (!highest) return level;
            return ASSESSMENT_LEVEL_ORDER.indexOf(level) > ASSESSMENT_LEVEL_ORDER.indexOf(highest)
              ? level
              : highest;
          }, null) ?? null;
    const [response] = await Promise.all([
      fetch("/api/assessment/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, evaluatedLevel, result: nextResult }),
      }),
      persistAssessmentConceptProfile(userId, nextResult.conceptSignals, nextResult.assignedLevel),
    ]);
    if (!response.ok) throw new Error("Failed to persist assessment result");
  } catch {
    setSaveError(true);
  } finally {
    setSaving(false);
  }
}

export function buildAssessmentResult(params: {
  mode: "placement" | "checkpoint";
  questions: AssessmentQuestion[];
  attemptedQuestions: AssessmentQuestion[];
  answers: Record<string, number>;
  concepts: AssessmentConcept[];
  selfRatings: Record<string, ConceptSelfRating>;
}): AssessmentResult {
  const { mode, questions, attemptedQuestions, answers, concepts, selfRatings } = params;
  const checkpointLevel = questions[0]?.level;
  const assessedConcepts = concepts.filter(
    (concept) => selfRatings[concept.lessonSlug] !== undefined,
  );
  return scoreAssessment(
    attemptedQuestions,
    answers,
    mode,
    checkpointLevel,
    assessedConcepts,
    selfRatings,
  );
}

export function persistLocalAssessmentCache(params: {
  userId?: string;
  mode: "placement" | "checkpoint";
  checkpointLabel?: string;
  nextResult: AssessmentResult;
}) {
  const { userId, mode, checkpointLabel, nextResult } = params;
  window.localStorage.setItem(
    `assessment:${userId ?? "guest"}:${mode}:${checkpointLabel ?? "placement"}`,
    JSON.stringify({ ...nextResult, completedAt: new Date().toISOString() }),
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
  sectionIndex: number;
  sectionsLength: number;
  sectionLevel: CefrLevelId;
  sectionQuestions: AssessmentQuestion[];
  answers: Record<string, number>;
  nextSectionLevel?: string;
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
    sectionIndex,
    sectionsLength,
    sectionLevel,
    sectionQuestions,
    answers,
    nextSectionLevel,
  } = params;

  const footerStatus = showingLevelPrompt
    ? selfReportedLevel
      ? "Referencia seleccionada."
      : "Elige una opción para continuar."
    : showingInventory && ratedConcepts !== sectionConceptsLength
      ? `Faltan ${sectionConceptsLength - ratedConcepts} temas.`
      : undefined;

  const primaryLabel = showingLevelPrompt
    ? "Empezar prueba"
    : showingInventory
      ? "Comprobar con preguntas"
      : questionIndex < visibleQuestionsLength - 1
        ? "Siguiente pregunta"
        : mode === "placement" &&
            sectionIndex < sectionsLength - 1 &&
            (levelPassed(sectionLevel, sectionQuestions, answers) || selfReportedLevel === "full")
          ? `Seguir con ${nextSectionLevel?.toUpperCase()}`
          : "Ver resultado";

  return { footerStatus, primaryLabel };
}
