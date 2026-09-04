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

  // Asegurar persistencia inmediata en el dispositivo
  try {
    saveGuestStudyLevel(nextResult.assignedLevel);
  } catch {
    /* localStorage no disponible */
  }

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

    // 1. Guardado local en Dexie (fuente de verdad offline-first)
    await persistAssessmentConceptProfile(
      userId,
      nextResult.conceptSignals,
      nextResult.assignedLevel,
    );

    // 2. Sincronización remota best-effort
    const response = await fetch("/api/assessment/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, evaluatedLevel, result: nextResult }),
    });
    // 401 o 403 indica sesión anónima o no autenticada en Supabase: el progreso local ya está a salvo
    if (!response.ok && response.status !== 401 && response.status !== 403) {
      console.warn("[assessment] remote sync non-ok status:", response.status);
      throw new Error(`Remote sync failed with status ${response.status}`);
    }
  } catch (error) {
    console.error("[assessment] local persistence failed:", error);
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
