"use client";

import type { LearningStep } from "@/lib/types";
import { ExplanationStep } from "./steps/ExplanationStep";
import { ChecklistStep } from "./steps/ChecklistStep";
import { MultipleChoiceStep } from "./steps/MultipleChoiceStep";
import { FillBlankStep } from "./steps/FillBlankStep";
import { SpeakingStep } from "./steps/SpeakingStep";

interface StepRendererProps {
  step: LearningStep;
  stepIndex: number;
  onComplete: () => void;
  onPrev?: () => void;
}

export default function StepRenderer({ step, onComplete, onPrev }: StepRendererProps) {
  if (step.type === "explanation") {
    return <ExplanationStep content={step.content} onComplete={onComplete} onPrev={onPrev} />;
  }

  if (step.type === "checklist") {
    return <ChecklistStep items={step.items} onComplete={onComplete} onPrev={onPrev} />;
  }

  if (step.type === "exercise") {
    switch (step.format) {
      case "multiple_choice":
        return <MultipleChoiceStep data={step.data} onComplete={onComplete} onPrev={onPrev} />;
      case "fill_blank":
        return <FillBlankStep data={step.data} onComplete={onComplete} onPrev={onPrev} />;
      case "speaking":
        return <SpeakingStep data={step.data} onComplete={onComplete} onPrev={onPrev} />;
      case "checklist":
        return <ChecklistStep items={step.data.items} onComplete={onComplete} onPrev={onPrev} />;
    }
  }

  return null;
}
