"use client";

import { useState } from "react";
import type { LearningSession } from "@/lib/types";
import StepRenderer from "./StepRenderer";

const STEP_TYPE_LABEL: Record<string, string> = {
  explanation: "Read",
  "exercise:multiple_choice": "Choose",
  "exercise:fill_blank": "Fill in",
  "exercise:speaking": "Say it",
  "exercise:checklist": "Check off",
  checklist: "Check off",
};

export default function InlineSession({ session }: { session: LearningSession }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);

  const total = session.steps.length;
  const progress = total > 0 ? (completedSteps.size / total) * 100 : 0;

  const handleComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < total - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setFinished(true);
    }
  };

  const step = session.steps[currentStep];
  const stepKey = step.type === "exercise" ? `exercise:${(step as { format: string }).format}` : step.type;
  const stepLabel = STEP_TYPE_LABEL[stepKey] ?? "Step";

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--card-bg)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--line-divider)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}
          >
            {finished ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span>{currentStep + 1}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {session.title}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              {finished ? "Done" : `${stepLabel} · ${currentStep + 1} of ${total}`}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full" style={{ backgroundColor: "var(--btn-regular-bg)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: "var(--primary)" }}
        />
      </div>

      {/* Step dots */}
      <div className="flex gap-1 px-4 pt-3">
        {session.steps.map((_, i) => (
          <button
            key={i}
            onClick={() => !finished && setCurrentStep(i)}
            className="flex-1 h-1 rounded-full transition-all"
            style={{
              backgroundColor: completedSteps.has(i)
                ? "var(--primary)"
                : i === currentStep
                ? "var(--btn-regular-bg-active)"
                : "var(--btn-regular-bg)",
            }}
            aria-label={`Step ${i + 1}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {finished ? (
          <div className="flex items-center gap-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--btn-regular-bg-active)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                style={{ color: "var(--primary)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Session complete!
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                {total} step{total !== 1 ? "s" : ""} · {session.title}
              </p>
            </div>
          </div>
        ) : (
          <div key={currentStep}>
            <StepRenderer
              step={session.steps[currentStep]}
              stepIndex={currentStep}
              onComplete={handleComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
