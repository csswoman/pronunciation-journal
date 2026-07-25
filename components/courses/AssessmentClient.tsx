"use client";

import { useState } from "react";
import {
  ASSESSMENT_LEVEL_ORDER,
  groupQuestionsByLevel,
  levelPassed,
  scoreAssessment,
  type AssessmentQuestion,
  type AssessmentResult,
} from "@/lib/courses/assessment";
import type { AssessmentConcept, ConceptSelfRating } from "@/lib/courses/concept-profile";
import type { CefrLevelId } from "@/lib/courses/types";
import { persistAssessmentConceptProfile } from "@/lib/courses/assessment-profile";
import {
  AssessmentCoverage,
  AssessmentErrorState,
  AssessmentFooter,
  AssessmentHeader,
  AssessmentInventory,
  AssessmentLevelPrompt,
  AssessmentQuestionView,
  AssessmentResultView,
} from "./AssessmentViews";
import { useAssessmentFlow } from "./useAssessmentFlow";

function isConcreteCefrLevel(value: CefrLevelId | "unsure" | "full" | null): value is CefrLevelId {
  return value !== null && value !== "unsure" && value !== "full";
}

function reportedLevelIsAbove(sectionLevel: CefrLevelId, reported: CefrLevelId | "unsure" | "full" | null): boolean {
  if (!isConcreteCefrLevel(reported)) return false;
  return ASSESSMENT_LEVEL_ORDER.indexOf(reported) > ASSESSMENT_LEVEL_ORDER.indexOf(sectionLevel);
}

interface AssessmentClientProps {
  mode: "placement" | "checkpoint";
  questions: AssessmentQuestion[];
  concepts?: AssessmentConcept[];
  checkpointLabel?: string;
  userId?: string;
  initialLevel?: CefrLevelId | null;
}

export default function AssessmentClient({ mode, questions, concepts = [], checkpointLabel, userId, initialLevel }: AssessmentClientProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selfRatings, setSelfRatings] = useState<Record<string, ConceptSelfRating>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const sections = groupQuestionsByLevel(questions);
  const {
    sectionIndex,
    placementStartIndex,
    questionIndex,
    placementStep,
    selfReportedLevel,
    setSelfReportedLevel,
    startPlacement,
    startQuestions,
    goToNextSection,
    goBackToInventory,
    goToPreviousQuestion,
    goToNextQuestion,
  } = useAssessmentFlow({ mode, sections, initialLevel });
  const section = sections[sectionIndex];
  const sectionConcepts = section
    ? concepts.filter((concept) => concept.level === section.level)
    : [];
  const showingInventory = mode === "placement" && placementStep === "inventory";
  const showingLevelPrompt = mode === "placement" && placementStep === "level";
  const visibleQuestions = mode === "placement" ? section?.questions ?? [] : questions;
  const answered = visibleQuestions.filter((question) => answers[question.id] !== undefined).length;
  const currentQuestion = visibleQuestions[questionIndex];
  const currentQuestionAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : false;
  const ratedConcepts = sectionConcepts.filter((concept) => selfRatings[concept.lessonSlug] !== undefined).length;
  const progressValue = showingInventory ? ratedConcepts : showingLevelPrompt ? 0 : answered;
  const progressTotal = showingInventory ? sectionConcepts.length : showingLevelPrompt ? 1 : visibleQuestions.length;
  const placementLevels = ASSESSMENT_LEVEL_ORDER;

  async function saveLevel(nextResult: AssessmentResult) {
    setSaving(true);
    setSaveError(false);
    try {
      const evaluatedLevel = mode === "checkpoint"
        ? questions[0]?.level ?? null
        : nextResult.evaluatedLevels?.reduce<CefrLevelId | null>((highest, level) => {
          if (!highest) return level;
          return ASSESSMENT_LEVEL_ORDER.indexOf(level) > ASSESSMENT_LEVEL_ORDER.indexOf(highest) ? level : highest;
        }, null) ?? null;
      const [response] = await Promise.all([
        fetch("/api/assessment/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, evaluatedLevel, result: nextResult }),
        }),
        persistAssessmentConceptProfile(userId!, nextResult.conceptSignals, nextResult.assignedLevel),
      ]);
      if (!response.ok) throw new Error("Failed to persist assessment result");
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  function completeAssessment(attemptedQuestions: AssessmentQuestion[]) {
    const checkpointLevel = questions[0]?.level;
    const assessedConcepts = concepts.filter((concept) => selfRatings[concept.lessonSlug] !== undefined);
    const nextResult = scoreAssessment(
      attemptedQuestions, answers, mode, checkpointLevel, assessedConcepts, selfRatings,
    );
    setResult(nextResult);
    if (attemptedQuestions.length > 0) {
      window.localStorage.setItem(
        `assessment:${userId ?? "guest"}:${mode}:${checkpointLabel ?? "placement"}`,
        JSON.stringify({ ...nextResult, completedAt: new Date().toISOString() }),
      );
      if (userId) {
        void saveLevel(nextResult);
      }
    }
  }

  function finishSection() {
    if (mode === "checkpoint") {
      completeAssessment(questions);
      return;
    }

    const passed = levelPassed(section.level, section.questions, answers);
    const isLast = sectionIndex === sections.length - 1;
    if ((passed || selfReportedLevel === "full") && !isLast) {
      goToNextSection();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    completeAssessment(sections.slice(placementStartIndex, sectionIndex + 1).flatMap((item) => item.questions));
  }

  function handleBack() {
    if (questionIndex > 0) {
      goToPreviousQuestion();
    } else if (mode === "placement") {
      goBackToInventory();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePrimary() {
    if (showingLevelPrompt) {
      startPlacement();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (showingInventory) {
      const allCurrentConceptsUnknown = sectionConcepts.length > 0
        && sectionConcepts.every((concept) => selfRatings[concept.lessonSlug] === "unknown");
      // Claimed a higher level than this anchor section: verify with questions
      // instead of ending as a beginner plan-only result.
      if (allCurrentConceptsUnknown && !reportedLevelIsAbove(section.level, selfReportedLevel)) {
        completeAssessment(sections.slice(placementStartIndex, sectionIndex).flatMap((item) => item.questions));
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      startQuestions();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (questionIndex < visibleQuestions.length - 1) {
      goToNextQuestion();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    finishSection();
  }

  const footerStatus = showingLevelPrompt
    ? selfReportedLevel ? "Referencia seleccionada." : "Elige una opción para continuar."
    : showingInventory && ratedConcepts !== sectionConcepts.length
    ? `Faltan ${sectionConcepts.length - ratedConcepts} temas.`
    : undefined;
  const primaryLabel = showingLevelPrompt
    ? "Empezar prueba"
    : showingInventory
    ? "Comprobar con preguntas"
    : questionIndex < visibleQuestions.length - 1
    ? "Siguiente pregunta"
    : mode === "placement" && sectionIndex < sections.length - 1 && (levelPassed(section.level, section.questions, answers) || selfReportedLevel === "full")
    ? `Seguir con ${sections[sectionIndex + 1]?.level.toUpperCase()}`
    : "Ver resultado";

  if (result) {
    return <AssessmentResultView mode={mode} result={result} userId={userId} saving={saving} saveError={saveError} onRetry={() => void saveLevel(result)} />;
  }

  if (!section) {
    return <AssessmentErrorState />;
  }

  return (
    <div className={showingLevelPrompt ? "assessment-page assessment-page--prompt" : "assessment-page"}>
      <div className="assessment-shell">
        <AssessmentHeader
          mode={mode}
          userId={userId}
          checkpointLabel={checkpointLabel}
          sectionLevel={section.level}
          showingLevelPrompt={showingLevelPrompt}
          showingInventory={showingInventory}
          progressValue={progressValue}
          progressTotal={progressTotal}
        />

        <div className={mode === "placement" && !showingLevelPrompt ? "assessment-stage" : "assessment-stage assessment-stage--single"}>
          <div className="assessment-main">
        {showingLevelPrompt ? (
          <AssessmentLevelPrompt value={selfReportedLevel} onChange={setSelfReportedLevel} />
        ) : showingInventory ? (
          <AssessmentInventory
            concepts={sectionConcepts}
            selfRatings={selfRatings}
            onRate={(lessonSlug, value) => setSelfRatings((current) => ({ ...current, [lessonSlug]: value }))}
          />
        ) : (
          <AssessmentQuestionView
            question={currentQuestion}
            index={questionIndex}
            answer={currentQuestion ? answers[currentQuestion.id] : undefined}
            onAnswer={(optionIndex) => currentQuestion && setAnswers((current) => ({ ...current, [currentQuestion.id]: optionIndex }))}
          />
        )}

        <AssessmentFooter
          status={footerStatus}
          showBack={!showingLevelPrompt && !showingInventory}
          backLabel={questionIndex > 0 ? "Anterior" : "Volver a temas"}
          primaryLabel={primaryLabel}
          primaryDisabled={showingLevelPrompt ? selfReportedLevel === null : showingInventory ? ratedConcepts !== sectionConcepts.length : !currentQuestionAnswered}
          onBack={handleBack}
          onPrimary={handlePrimary}
        />
          </div>
          {mode === "placement" && !showingLevelPrompt && (
            <AssessmentCoverage levels={placementLevels} placementStartIndex={placementStartIndex} sectionIndex={sectionIndex} />
          )}
        </div>
      </div>
    </div>
  );
}
