"use client";

import { useState } from "react";
import { assessmentAnchorIndex, type AssessmentQuestion } from "@/lib/courses/assessment";
import type { CefrLevelId } from "@/lib/courses/types";

export type AssessmentPlacementStep = "level" | "inventory" | "questions";

export function useAssessmentFlow({
  mode,
  sections,
  initialLevel,
}: {
  mode: "placement" | "checkpoint";
  sections: Array<{ level: CefrLevelId; questions: AssessmentQuestion[] }>;
  initialLevel?: CefrLevelId | null;
}) {
  const initialStartIndex = initialLevel ? assessmentAnchorIndex(initialLevel, sections) : 0;
  const [sectionIndex, setSectionIndex] = useState(initialStartIndex);
  const [placementStartIndex, setPlacementStartIndex] = useState(initialStartIndex);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [placementStep, setPlacementStep] = useState<AssessmentPlacementStep>(
    mode === "placement" ? (initialLevel ? "inventory" : "level") : "questions",
  );
  const [selfReportedLevel, setSelfReportedLevel] = useState<CefrLevelId | "unsure" | "full" | null>(initialLevel ?? null);

  function startPlacement() {
    const nextIndex = selfReportedLevel !== "unsure" && selfReportedLevel !== "full" && selfReportedLevel
      ? assessmentAnchorIndex(selfReportedLevel, sections)
      : 0;
    setSectionIndex(nextIndex);
    setPlacementStartIndex(nextIndex);
    setPlacementStep("inventory");
  }

  function startQuestions() {
    setQuestionIndex(0);
    setPlacementStep("questions");
  }

  function goToNextSection() {
    setSectionIndex((current) => current + 1);
    setQuestionIndex(0);
    setPlacementStep("inventory");
  }

  function goBackToInventory() {
    setPlacementStep("inventory");
  }

  function goToPreviousQuestion() {
    setQuestionIndex((current) => Math.max(0, current - 1));
  }

  function goToNextQuestion() {
    setQuestionIndex((current) => current + 1);
  }

  return {
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
  };
}
