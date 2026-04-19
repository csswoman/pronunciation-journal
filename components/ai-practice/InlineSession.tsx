"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { LearningSession } from "@/lib/types";
import StepRenderer from "./StepRenderer";

interface InlineSessionProps {
  session: LearningSession;
  onExit?: () => void;
}

const STEP_TYPE_LABEL: Record<string, string> = {
  explanation: "Read",
  "exercise:multiple_choice": "Choose",
  "exercise:fill_blank": "Fill in the blank",
  "exercise:speaking": "Say it",
  "exercise:checklist": "Check off",
  checklist: "Check off",
};

export default function InlineSession({ session, onExit }: InlineSessionProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);

  const total = session.steps.length;

  const handleComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < total - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const step = session.steps[currentStep];
  const stepKey =
    step.type === "exercise"
      ? `exercise:${(step as { format: string }).format}`
      : step.type;
  const stepLabel = STEP_TYPE_LABEL[stepKey] ?? "Step";

  return (
    <div
      className="absolute inset-0 flex flex-col z-10"
      style={{ backgroundColor: "var(--card-bg)" }}
    >
      {/* Quiz header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--line-divider)" }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-tertiary)" }}
        >
          {finished ? "Completed" : `${stepLabel} · ${currentStep + 1} / ${total}`}
        </p>

        {onExit && (
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all hover:opacity-70"
            style={{ borderColor: "#ef4444", color: "#ef4444" }}
          >
            <X size={11} />
            Exit quiz
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-6 py-8">
        {finished ? (
          <FinishedState total={total} title={session.title} onExit={onExit} />
        ) : (
          <div key={currentStep} className="w-full max-w-lg flex flex-col items-center gap-6">
            <StepRenderer
              step={session.steps[currentStep]}
              stepIndex={currentStep}
              onComplete={handleComplete}
              onPrev={currentStep > 0 ? handlePrev : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function FinishedState({
  total,
  title,
  onExit,
}: {
  total: number;
  title: string;
  onExit?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "var(--btn-regular-bg-active)" }}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          style={{ color: "var(--primary)" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Session completed!
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          {total} step{total !== 1 ? "s" : ""} · {title}
        </p>
      </div>
      {onExit && (
        <button
          onClick={onExit}
          className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          Back to chat
        </button>
      )}
    </div>
  );
}
