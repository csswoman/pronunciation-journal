"use client";

// Planned structure:
// <AssessmentClientShell>
//   <AssessmentHeader />
//   stage body + footer + coverage
// </AssessmentClientShell>

import type { Dispatch, SetStateAction } from "react";
import type { AssessmentQuestion } from "@/lib/courses/assessment";
import type { AssessmentConcept, ConceptSelfRating } from "@/lib/courses/concept-profile";
import type { CefrLevelId } from "@/lib/courses/types";
import {
  AssessmentCoverage,
  AssessmentFooter,
  AssessmentHeader,
  AssessmentInventory,
  AssessmentLevelPrompt,
  AssessmentQuestionView,
} from "./AssessmentViews";

interface AssessmentClientShellProps {
  chrome: {
    mode: "placement" | "checkpoint";
    userId?: string;
    checkpointLabel?: string;
    sectionLevel: CefrLevelId;
    showingLevelPrompt: boolean;
    showingInventory: boolean;
    progressValue: number;
    progressTotal: number;
  };
  prompt: {
    selfReportedLevel: CefrLevelId | "unsure" | "full" | null;
    setSelfReportedLevel: (value: CefrLevelId | "unsure" | "full" | null) => void;
    sectionConcepts: AssessmentConcept[];
    selfRatings: Record<string, ConceptSelfRating>;
    setSelfRatings: Dispatch<SetStateAction<Record<string, ConceptSelfRating>>>;
    currentQuestion: AssessmentQuestion | undefined;
    questionIndex: number;
    answers: Record<string, number>;
    setAnswers: Dispatch<SetStateAction<Record<string, number>>>;
  };
  footer: {
    status?: string;
    primaryLabel: string;
    primaryDisabled: boolean;
    onBack: () => void;
    onPrimary: () => void;
  };
  coverage: {
    placementLevels: CefrLevelId[];
    placementStartIndex: number;
    sectionIndex: number;
  };
}

export function AssessmentClientShell({
  chrome,
  prompt,
  footer,
  coverage,
}: AssessmentClientShellProps) {
  const { showingLevelPrompt, showingInventory, mode } = chrome;

  return (
    <div className={showingLevelPrompt ? "assessment-page assessment-page--prompt" : "assessment-page"}>
      <div className="assessment-shell">
        <AssessmentHeader
          mode={chrome.mode}
          userId={chrome.userId}
          checkpointLabel={chrome.checkpointLabel}
          sectionLevel={chrome.sectionLevel}
          showingLevelPrompt={showingLevelPrompt}
          showingInventory={showingInventory}
          progressValue={chrome.progressValue}
          progressTotal={chrome.progressTotal}
        />

        <div
          className={
            mode === "placement" && !showingLevelPrompt
              ? "assessment-stage"
              : "assessment-stage assessment-stage--single"
          }
        >
          <div className="assessment-main">
            {showingLevelPrompt ? (
              <AssessmentLevelPrompt
                value={prompt.selfReportedLevel}
                onChange={prompt.setSelfReportedLevel}
              />
            ) : showingInventory ? (
              <AssessmentInventory
                concepts={prompt.sectionConcepts}
                selfRatings={prompt.selfRatings}
                onRate={(lessonSlug, value) =>
                  prompt.setSelfRatings((current) => ({ ...current, [lessonSlug]: value }))
                }
              />
            ) : (
              <AssessmentQuestionView
                question={prompt.currentQuestion}
                index={prompt.questionIndex}
                answer={
                  prompt.currentQuestion ? prompt.answers[prompt.currentQuestion.id] : undefined
                }
                onAnswer={(optionIndex) =>
                  prompt.currentQuestion &&
                  prompt.setAnswers((current) => ({
                    ...current,
                    [prompt.currentQuestion!.id]: optionIndex,
                  }))
                }
              />
            )}

            <AssessmentFooter
              status={footer.status}
              showBack={!showingLevelPrompt && !showingInventory}
              backLabel={prompt.questionIndex > 0 ? "Anterior" : "Volver a temas"}
              primaryLabel={footer.primaryLabel}
              primaryDisabled={footer.primaryDisabled}
              onBack={footer.onBack}
              onPrimary={footer.onPrimary}
            />
          </div>
          {mode === "placement" && !showingLevelPrompt && (
            <AssessmentCoverage
              levels={coverage.placementLevels}
              placementStartIndex={coverage.placementStartIndex}
              sectionIndex={coverage.sectionIndex}
            />
          )}
        </div>
      </div>
    </div>
  );
}
