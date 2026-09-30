"use client";

import type { Dispatch, SetStateAction } from "react";
import type { AssessmentResult, ClientAssessmentQuestion } from "@/lib/courses/assessment";
import type { CefrLevelId } from "@/lib/courses/types";
import type { useAssessmentOralFlow } from "./useAssessmentOralFlow";
import type { useAssessmentScoring } from "./useAssessmentScoring";

export interface AssessmentSectionFeedbackState {
  result: AssessmentResult;
  level: CefrLevelId;
  nextLevel: CefrLevelId;
  canContinueAfterFailure: boolean;
}

interface UseAssessmentCompletionOptions {
  mode: "placement" | "checkpoint";
  userId?: string;
  questions: ClientAssessmentQuestion[];
  sections: Array<{ level: CefrLevelId; questions: ClientAssessmentQuestion[] }>;
  sectionIndex: number;
  placementStartIndex: number;
  selfReportedLevel: CefrLevelId | "unsure" | "full" | null;
  oralFlow: ReturnType<typeof useAssessmentOralFlow>;
  scoring: ReturnType<typeof useAssessmentScoring>;
  setSectionFeedback: Dispatch<SetStateAction<AssessmentSectionFeedbackState | null>>;
}

export function useAssessmentCompletion({
  mode,
  userId,
  questions,
  sections,
  sectionIndex,
  placementStartIndex,
  selfReportedLevel,
  oralFlow,
  scoring,
  setSectionFeedback,
}: UseAssessmentCompletionOptions) {
  async function finishSection() {
    const section = sections[sectionIndex];
    if (!section) return;
    if (mode === "checkpoint") {
      if (oralFlow.needsOralEvidence && userId) {
        await oralFlow.beginAttempt();
        return;
      }
      await scoring.completeAssessment(questions);
      return;
    }

    const attemptedQuestions = sections
      .slice(placementStartIndex, sectionIndex + 1)
      .flatMap((item) => item.questions);
    const isLast = sectionIndex === sections.length - 1;
    scoring.setSaving(true);
    scoring.setEvaluationError(false);
    try {
      const sectionResult = await scoring.requestServerResult("/api/assessment/score", section.questions);
      const sectionPassed = sectionResult.passedLevels.includes(section.level);
      if (!isLast && (sectionPassed || selfReportedLevel === "full")) {
        setSectionFeedback({
          result: sectionResult,
          level: section.level,
          nextLevel: sections[sectionIndex + 1].level,
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

  return { finishSection };
}
