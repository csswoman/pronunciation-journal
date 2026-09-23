"use client";

import { useCallback, useState } from "react";
import { useHideMobileNavDuringSession } from "@/hooks/useHideMobileNavDuringSession";
import type { AssessmentResult, ClientAssessmentQuestion } from "@/lib/courses/assessment";
import { ASSESSMENT_LEVEL_ORDER, groupQuestionsByLevel } from "@/lib/courses/assessment-shared";
import type { AssessmentConcept, ConceptSelfRating } from "@/lib/courses/concept-profile";
import type { CefrLevelId } from "@/lib/courses/types";
import {
  AssessmentErrorState,
  AssessmentResultView,
  AssessmentSectionFeedbackView,
} from "./AssessmentViews";
import { AssessmentClientShell } from "./AssessmentClientShell";
import { useAssessmentFlow } from "./useAssessmentFlow";
import { assessmentFooterCopy, reportedLevelIsAbove } from "./assessment-client-helpers";
import { useAssessmentScoring } from "./useAssessmentScoring";

interface AssessmentClientProps {
  mode: "placement" | "checkpoint";
  questions: ClientAssessmentQuestion[];
  concepts?: AssessmentConcept[];
  checkpointLabel?: string;
  userId?: string;
  initialLevel?: CefrLevelId | null;
}

export default function AssessmentClient({
  mode,
  questions,
  concepts = [],
  checkpointLabel,
  userId,
  initialLevel,
}: AssessmentClientProps) {
  useHideMobileNavDuringSession();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selfRatings, setSelfRatings] = useState<Record<string, ConceptSelfRating>>({});
  const [sectionFeedback, setSectionFeedback] = useState<{
    result: AssessmentResult;
    level: CefrLevelId;
    nextLevel: CefrLevelId;
    canContinueAfterFailure: boolean;
  } | null>(null);
  const [audioReadyQuestionId, setAudioReadyQuestionId] = useState<string | null>(null);
  const sections = groupQuestionsByLevel(questions);
  const flow = useAssessmentFlow({ mode, sections, initialLevel });
  const section = sections[flow.sectionIndex];
  const sectionConcepts = section
    ? concepts.filter((concept) => concept.level === section.level)
    : [];
  const showingInventory = mode === "placement" && flow.placementStep === "inventory";
  const showingLevelPrompt = mode === "placement" && flow.placementStep === "level";
  const visibleQuestions = mode === "placement" ? section?.questions ?? [] : questions;
  const answered = visibleQuestions.filter((question) => answers[question.id] !== undefined).length;
  const currentQuestion = visibleQuestions[flow.questionIndex];
  const currentQuestionAnswered = Boolean(currentQuestion)
    && answers[currentQuestion.id] !== undefined
    && (!currentQuestion.audioSrc || audioReadyQuestionId === currentQuestion.id);
  const ratedConcepts = sectionConcepts.filter((concept) => selfRatings[concept.lessonSlug] !== undefined).length;
  const progressValue = showingInventory ? ratedConcepts : showingLevelPrompt ? 0 : answered;
  const progressTotal = showingInventory ? sectionConcepts.length : showingLevelPrompt ? 1 : visibleQuestions.length;
  const checkpointLevel = mode === "checkpoint" ? (questions[0]?.level ?? null) : null;
  const scoring = useAssessmentScoring({
    mode,
    concepts,
    checkpointLabel,
    userId,
    checkpointLevel,
    answers,
    selfRatings,
  });

  const handleAudioReadyChange = useCallback((questionId: string, ready: boolean) => {
    setAudioReadyQuestionId(ready ? questionId : null);
  }, []);

  async function finishSection() {
    if (!section) return;
    if (mode === "checkpoint") {
      await scoring.completeAssessment(questions);
      return;
    }

    const attemptedQuestions = sections
      .slice(flow.placementStartIndex, flow.sectionIndex + 1)
      .flatMap((item) => item.questions);
    const isLast = flow.sectionIndex === sections.length - 1;
    scoring.setSaving(true);
    scoring.setEvaluationError(false);
    try {
      const sectionResult = await scoring.requestServerResult("/api/assessment/score", section.questions);
      const sectionPassed = sectionResult.passedLevels.includes(section.level);
      if (!isLast && (sectionPassed || flow.selfReportedLevel === "full")) {
        setSectionFeedback({
          result: sectionResult,
          level: section.level,
          nextLevel: sections[flow.sectionIndex + 1].level,
          canContinueAfterFailure: !sectionPassed,
        });
        return;
      }

      const sameQuestions = attemptedQuestions.length === section.questions.length;
      const finalResult = userId
        ? await scoring.requestServerResult("/api/assessment/results", attemptedQuestions)
        : sameQuestions
          ? sectionResult
          : await scoring.requestServerResult("/api/assessment/score", attemptedQuestions);
      scoring.displayVerifiedResult(finalResult, attemptedQuestions);
    } catch {
      scoring.setEvaluationError(true);
    } finally {
      scoring.setSaving(false);
    }
  }

  function handleBack() {
    if (flow.questionIndex > 0) flow.goToPreviousQuestion();
    else if (mode === "placement") flow.goBackToInventory();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePrimary() {
    if (showingLevelPrompt) {
      flow.startPlacement();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (showingInventory) {
      const allUnknown = sectionConcepts.length > 0
        && sectionConcepts.every((concept) => selfRatings[concept.lessonSlug] === "unknown");
      if (allUnknown && !reportedLevelIsAbove(section.level, flow.selfReportedLevel)) {
        void scoring.completeAssessment([]);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      flow.startQuestions();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (flow.questionIndex < visibleQuestions.length - 1) {
      flow.goToNextQuestion();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    void finishSection();
  }

  const footer = assessmentFooterCopy({
    showingLevelPrompt,
    showingInventory,
    selfReportedLevel: flow.selfReportedLevel,
    ratedConcepts,
    sectionConceptsLength: sectionConcepts.length,
    questionIndex: flow.questionIndex,
    visibleQuestionsLength: visibleQuestions.length,
    mode,
  });

  if (scoring.result) {
    return (
      <AssessmentResultView
        mode={mode}
        result={scoring.result}
        userId={userId}
        saving={scoring.saving}
        saveError={scoring.saveError}
        onRetry={scoring.retryPersistence}
      />
    );
  }
  if (sectionFeedback) {
    return (
      <AssessmentSectionFeedbackView
        result={sectionFeedback.result}
        level={sectionFeedback.level}
        nextLevel={sectionFeedback.nextLevel}
        canContinueAfterFailure={sectionFeedback.canContinueAfterFailure}
        onContinue={() => {
          setSectionFeedback(null);
          flow.goToNextSection();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }
  if (!section) return <AssessmentErrorState />;

  return (
    <AssessmentClientShell
      chrome={{
        mode,
        userId,
        checkpointLabel,
        sectionLevel: section.level,
        showingLevelPrompt,
        showingInventory,
        progressValue,
        progressTotal,
      }}
      prompt={{
        selfReportedLevel: flow.selfReportedLevel,
        setSelfReportedLevel: flow.setSelfReportedLevel,
        sectionConcepts,
        selfRatings,
        setSelfRatings,
        currentQuestion,
        questionIndex: flow.questionIndex,
        answers,
        setAnswers,
        onAudioReadyChange: handleAudioReadyChange,
      }}
      footer={{
        status: scoring.evaluationError
          ? "No se pudo comprobar el resultado. Tus respuestas siguen aquí; puedes reintentar."
          : footer.footerStatus,
        statusRole: scoring.evaluationError ? "alert" : "status",
        primaryLabel: scoring.evaluationError ? "Reintentar corrección" : scoring.saving ? "Comprobando…" : footer.primaryLabel,
        primaryDisabled: scoring.saving || (showingLevelPrompt
          ? flow.selfReportedLevel === null
          : showingInventory
            ? ratedConcepts !== sectionConcepts.length
            : !currentQuestionAnswered),
        secondaryDisabled: scoring.saving,
        onBack: handleBack,
        onPrimary: handlePrimary,
      }}
      coverage={{
        placementLevels: [...ASSESSMENT_LEVEL_ORDER],
        placementStartIndex: flow.placementStartIndex,
        sectionIndex: flow.sectionIndex,
      }}
    />
  );
}
