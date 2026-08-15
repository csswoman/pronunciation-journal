"use client";

import { useState } from "react";
import { useHideMobileNavDuringSession } from "@/hooks/useHideMobileNavDuringSession";
import {
  ASSESSMENT_LEVEL_ORDER,
  groupQuestionsByLevel,
  levelPassed,
  type AssessmentQuestion,
  type AssessmentResult,
} from "@/lib/courses/assessment";
import type { AssessmentConcept, ConceptSelfRating } from "@/lib/courses/concept-profile";
import type { CefrLevelId } from "@/lib/courses/types";
import { AssessmentErrorState, AssessmentResultView } from "./AssessmentViews";
import { AssessmentClientShell } from "./AssessmentClientShell";
import { useAssessmentFlow } from "./useAssessmentFlow";
import {
  assessmentFooterCopy,
  buildAssessmentResult,
  persistLocalAssessmentCache,
  reportedLevelIsAbove,
  saveAssessmentLevel,
} from "./assessment-client-helpers";

interface AssessmentClientProps {
  mode: "placement" | "checkpoint";
  questions: AssessmentQuestion[];
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
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const sections = groupQuestionsByLevel(questions);
  const flow = useAssessmentFlow({ mode, sections, initialLevel });
  const section = sections[flow.sectionIndex];
  const sectionConcepts = section
    ? concepts.filter((concept) => concept.level === section.level)
    : [];
  const showingInventory = mode === "placement" && flow.placementStep === "inventory";
  const showingLevelPrompt = mode === "placement" && flow.placementStep === "level";
  const visibleQuestions = mode === "placement" ? section?.questions ?? [] : questions;
  const answered = visibleQuestions.filter((q) => answers[q.id] !== undefined).length;
  const currentQuestion = visibleQuestions[flow.questionIndex];
  const currentQuestionAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : false;
  const ratedConcepts = sectionConcepts.filter(
    (c) => selfRatings[c.lessonSlug] !== undefined,
  ).length;
  const progressValue = showingInventory ? ratedConcepts : showingLevelPrompt ? 0 : answered;
  const progressTotal = showingInventory
    ? sectionConcepts.length
    : showingLevelPrompt
      ? 1
      : visibleQuestions.length;

  function completeAssessment(attemptedQuestions: AssessmentQuestion[]) {
    const nextResult = buildAssessmentResult({
      mode,
      questions,
      attemptedQuestions,
      answers,
      concepts,
      selfRatings,
    });
    setResult(nextResult);
    if (attemptedQuestions.length > 0) {
      persistLocalAssessmentCache({ userId, mode, checkpointLabel, nextResult });
      if (userId) {
        void saveAssessmentLevel({
          mode,
          questions,
          userId,
          nextResult,
          setSaving,
          setSaveError,
        });
      }
    }
  }

  function finishSection() {
    if (mode === "checkpoint") {
      completeAssessment(questions);
      return;
    }
    const passed = levelPassed(section.level, section.questions, answers);
    const isLast = flow.sectionIndex === sections.length - 1;
    if ((passed || flow.selfReportedLevel === "full") && !isLast) {
      flow.goToNextSection();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    completeAssessment(
      sections
        .slice(flow.placementStartIndex, flow.sectionIndex + 1)
        .flatMap((item) => item.questions),
    );
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
      const allUnknown =
        sectionConcepts.length > 0 &&
        sectionConcepts.every((c) => selfRatings[c.lessonSlug] === "unknown");
      if (allUnknown && !reportedLevelIsAbove(section.level, flow.selfReportedLevel)) {
        completeAssessment(
          sections
            .slice(flow.placementStartIndex, flow.sectionIndex)
            .flatMap((item) => item.questions),
        );
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
    finishSection();
  }

  const { footerStatus, primaryLabel } = assessmentFooterCopy({
    showingLevelPrompt,
    showingInventory,
    selfReportedLevel: flow.selfReportedLevel,
    ratedConcepts,
    sectionConceptsLength: sectionConcepts.length,
    questionIndex: flow.questionIndex,
    visibleQuestionsLength: visibleQuestions.length,
    mode,
    sectionIndex: flow.sectionIndex,
    sectionsLength: sections.length,
    sectionLevel: section?.level ?? "a1",
    sectionQuestions: section?.questions ?? [],
    answers,
    nextSectionLevel: sections[flow.sectionIndex + 1]?.level,
  });

  if (result) {
    return (
      <AssessmentResultView
        mode={mode}
        result={result}
        userId={userId}
        saving={saving}
        saveError={saveError}
        onRetry={() => {
          if (!userId) return;
          void saveAssessmentLevel({
            mode,
            questions,
            userId,
            nextResult: result,
            setSaving,
            setSaveError,
          });
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
      }}
      footer={{
        status: footerStatus,
        primaryLabel,
        primaryDisabled: showingLevelPrompt
          ? flow.selfReportedLevel === null
          : showingInventory
            ? ratedConcepts !== sectionConcepts.length
            : !currentQuestionAnswered,
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
