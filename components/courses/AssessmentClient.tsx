"use client";

import { useCallback, useState } from "react";
import { useHideMobileNavDuringSession } from "@/hooks/useHideMobileNavDuringSession";
import type { ClientAssessmentQuestion } from "@/lib/courses/assessment";
import { groupQuestionsByLevel } from "@/lib/courses/assessment-shared";
import type { AssessmentConcept, ConceptSelfRating } from "@/lib/courses/concept-profile";
import type { CefrLevelId } from "@/lib/courses/types";
import {
  AssessmentErrorState,
  AssessmentResultView,
  AssessmentSectionFeedbackView,
} from "./AssessmentViews";
import { AssessmentClientShell } from "./AssessmentClientShell";
import type { AssessmentTopicPreview } from "./AssessmentCheckpointResultView";
import { useAssessmentFlow } from "./useAssessmentFlow";
import {
  assessmentFooterCopy, buildAssessmentCoverageLevels, clearSavedAssessmentResult, reportedLevelIsAbove,
} from "./assessment-client-helpers";
import { useAssessmentScoring } from "./useAssessmentScoring";
import { AssessmentOralCheckpoint } from "./AssessmentOralCheckpoint";
import { type AssessmentOralPilotLevel } from "@/lib/courses/assessment-oral-shared";
import { useAssessmentOralFlow } from "./useAssessmentOralFlow";
import { useAssessmentCompletion, type AssessmentSectionFeedbackState } from "./useAssessmentCompletion";
interface AssessmentClientProps {
  mode: "placement" | "checkpoint";
  questions: ClientAssessmentQuestion[];
  concepts?: AssessmentConcept[];
  checkpointLabel?: string;
  userId?: string;
  initialLevel?: CefrLevelId | null;
  nextLevelTopics?: AssessmentTopicPreview[];
}

export default function AssessmentClient({
  mode,
  questions,
  concepts = [],
  checkpointLabel,
  userId,
  initialLevel,
  nextLevelTopics = [],
}: AssessmentClientProps) {
  useHideMobileNavDuringSession();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selfRatings, setSelfRatings] = useState<Record<string, ConceptSelfRating>>({});
  const [sectionFeedback, setSectionFeedback] = useState<AssessmentSectionFeedbackState | null>(null);
  const [audioReadyQuestionId, setAudioReadyQuestionId] = useState<string | null>(null);
  const checkpointLevel = mode === "checkpoint" ? (questions[0]?.level ?? null) : null;
  const sections = groupQuestionsByLevel(questions);
  const flow = useAssessmentFlow({ mode, sections, initialLevel });
  const section = sections[flow.sectionIndex];
  const sectionConcepts = section
    ? concepts.filter((concept) => concept.level === section.level)
    : [];
  const showingInventory = mode === "placement" && flow.placementStep === "inventory";
  const showingLevelPrompt = mode === "placement" && flow.placementStep === "level";
  const visibleQuestions = mode === "placement" ? section?.questions ?? [] : questions;
  const coverageLevels = buildAssessmentCoverageLevels({ questions, concepts, answers, selfRatings });
  const answered = visibleQuestions.filter((question) => answers[question.id] !== undefined).length;
  const currentQuestion = visibleQuestions[flow.questionIndex];
  const currentQuestionAnswered = Boolean(currentQuestion)
    && answers[currentQuestion.id] !== undefined
    && (!currentQuestion.audioSrc || audioReadyQuestionId === currentQuestion.id);
  const ratedConcepts = sectionConcepts.filter((concept) => selfRatings[concept.lessonSlug] !== undefined).length;
  const scoring = useAssessmentScoring({
    mode,
    concepts,
    checkpointLabel,
    userId,
    checkpointLevel,
    answers,
    selfRatings,
  });
  const oralFlow = useAssessmentOralFlow({ mode, userId, checkpointLevel, answers, questions, scoring });
  const includesOralTask = Boolean(userId && oralFlow.needsOralEvidence);
  const progressValue = showingInventory ? ratedConcepts : showingLevelPrompt ? 0 : answered;
  const progressTotal = showingInventory
    ? sectionConcepts.length
    : showingLevelPrompt
      ? 1
      : visibleQuestions.length + (includesOralTask ? 1 : 0);
  const { finishSection } = useAssessmentCompletion({
    mode,
    userId,
    questions,
    sections,
    sectionIndex: flow.sectionIndex,
    placementStartIndex: flow.placementStartIndex,
    selfReportedLevel: flow.selfReportedLevel,
    oralFlow,
    scoring,
    setSectionFeedback,
  });

  const handleAudioReadyChange = useCallback((questionId: string, ready: boolean) => {
    setAudioReadyQuestionId(ready ? questionId : null);
  }, []);

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

  const oralContent = oralFlow.attemptId && checkpointLevel && oralFlow.needsOralEvidence
    ? (
      <AssessmentOralCheckpoint
        key={oralFlow.attemptId}
        level={checkpointLevel as AssessmentOralPilotLevel}
        attemptId={oralFlow.attemptId}
        initialChallenge={oralFlow.initialChallenge}
        onComplete={oralFlow.completeAttempt}
        onDefer={oralFlow.deferAttempt}
      />
    )
    : undefined;

  const handleRedo = useCallback(() => {
    clearSavedAssessmentResult({ userId, mode, checkpointLabel });
    scoring.reset();
    setAnswers({});
    setSelfRatings({});
    setSectionFeedback(null);
    setAudioReadyQuestionId(null);
    flow.resetFlow();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [userId, mode, checkpointLabel, scoring, flow]);

  if (scoring.result) {
    return (
      <AssessmentResultView
        mode={mode}
        result={scoring.result}
        userId={userId}
        saving={scoring.saving}
        saveError={scoring.saveError}
        onRetry={scoring.retryPersistence}
        onRedo={handleRedo}
        nextLevelTopics={nextLevelTopics}
      />
    );
  }
  if (sectionFeedback) {
    return (
      <AssessmentSectionFeedbackView
        result={sectionFeedback.result}
        level={sectionFeedback.level}
        nextLevel={sectionFeedback.nextLevel}
        nextLevelTopics={concepts
          .filter((concept) => concept.level === sectionFeedback.nextLevel)
          .slice(0, 4)
          .map((concept) => ({
            title: concept.title,
            ...(concept.goal ? { description: concept.goal } : {}),
          }))}
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
        questionTotal: visibleQuestions.length,
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
        audioReadyQuestionId,
        onAudioReadyChange: handleAudioReadyChange,
      }}
      oralContent={oralContent}
      footer={{
        status: oralFlow.startError
          ?? (scoring.evaluationError
            ? "No se pudo comprobar el resultado. Tus respuestas siguen aquí; puedes reintentar."
            : footer.footerStatus),
        statusRole: oralFlow.startError || scoring.evaluationError ? "alert" : "status",
        primaryLabel: scoring.evaluationError ? "Reintentar corrección" : scoring.saving ? "Comprobando…" : footer.primaryLabel,
        primaryDisabled: scoring.saving || (showingLevelPrompt
          ? flow.selfReportedLevel === null
          : showingInventory
            ? ratedConcepts !== sectionConcepts.length
            : !currentQuestionAnswered || !oralFlow.pendingLookupDone),
        secondaryDisabled: scoring.saving,
        onBack: handleBack,
        onPrimary: handlePrimary,
      }}
      coverage={{
        levels: coverageLevels,
        placementStartIndex: flow.placementStartIndex,
        sectionIndex: flow.sectionIndex,
      }}
    />
  );
}
