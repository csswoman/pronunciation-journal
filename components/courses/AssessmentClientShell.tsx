"use client";

// Planned structure:
// <AssessmentClientShell>
//   <AssessmentHeader />
//   stage body + footer + coverage
// </AssessmentClientShell>

import type { Dispatch, SetStateAction } from "react";
import type { ClientAssessmentQuestion } from "@/lib/courses/assessment";
import type { AssessmentConcept, ConceptSelfRating } from "@/lib/courses/concept-profile";
import type { CefrLevelId } from "@/lib/courses/types";
import type { AssessmentCoverageLevel } from "./AssessmentChrome";
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
    currentQuestion: ClientAssessmentQuestion | undefined;
    questionIndex: number;
    answers: Record<string, number>;
    setAnswers: Dispatch<SetStateAction<Record<string, number>>>;
    audioReadyQuestionId: string | null;
    onAudioReadyChange: (questionId: string, ready: boolean) => void;
  };
  footer: {
    status?: string;
    statusRole?: "status" | "alert";
    primaryLabel: string;
    primaryDisabled: boolean;
    secondaryDisabled: boolean;
    onBack: () => void;
    onPrimary: () => void;
  };
  coverage: {
    levels: AssessmentCoverageLevel[];
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
                total={chrome.progressTotal}
                answer={
                  prompt.currentQuestion ? prompt.answers[prompt.currentQuestion.id] : undefined
                }
                audioReadyQuestionId={prompt.audioReadyQuestionId}
                onAnswer={(optionIndex) =>
                  prompt.currentQuestion &&
                  prompt.setAnswers((current) => ({
                    ...current,
                    [prompt.currentQuestion!.id]: optionIndex,
                  }))
                }
                onAudioReadyChange={prompt.onAudioReadyChange}
              />
            )}

            <AssessmentFooter
              status={footer.status}
              statusRole={footer.statusRole}
              showBack={!showingLevelPrompt && !showingInventory}
              backLabel={prompt.questionIndex > 0 ? "Anterior" : "Volver a temas"}
              primaryLabel={footer.primaryLabel}
              primaryDisabled={footer.primaryDisabled}
              secondaryDisabled={footer.secondaryDisabled}
              onBack={footer.onBack}
              onPrimary={footer.onPrimary}
            />
          </div>
          {mode === "placement" && !showingLevelPrompt && (
            <AssessmentCoverage
              levels={coverage.levels}
              placementStartIndex={coverage.placementStartIndex}
              sectionIndex={coverage.sectionIndex}
              showingInventory={showingInventory}
            />
          )}
        </div>
      </div>
    </div>
  );
}
