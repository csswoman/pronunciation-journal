"use client";

import { useState } from "react";
import type { LearningSession } from "@/lib/types";
import StepRenderer from "./StepRenderer";

interface WorkspacePanelProps {
  session: LearningSession;
  onClose: () => void;
}

export default function WorkspacePanel({ session, onClose }: WorkspacePanelProps) {
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

  return (
    <div
      className="flex flex-col rounded-2xl border overflow-hidden"
      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--card-bg)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "var(--line-divider)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}
          >
            {finished ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span>{currentStep + 1}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {session.title}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              {finished ? "Session complete" : `Step ${currentStep + 1} of ${total}`}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          aria-label="Close workspace"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full" style={{ backgroundColor: "var(--btn-regular-bg)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: "var(--primary)" }}
        />
      </div>

      {/* Step nav pills */}
      <div className="flex gap-1.5 px-5 pt-4">
        {session.steps.map((_, i) => (
          <button
            key={i}
            onClick={() => !finished && setCurrentStep(i)}
            className="flex-1 h-1 rounded-full transition-all"
            style={{
              backgroundColor:
                completedSteps.has(i)
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
      <div className="flex-1 px-5 py-5">
        {finished ? (
          <FinishedState title={session.title} total={total} onClose={onClose} />
        ) : (
          <div key={currentStep}>
            <StepLabel step={currentStep} type={session.steps[currentStep].type} format={
              session.steps[currentStep].type === "exercise"
                ? (session.steps[currentStep] as { format: string }).format
                : undefined
            } />
            <div className="mt-3">
              <StepRenderer
                step={session.steps[currentStep]}
                stepIndex={currentStep}
                onComplete={handleComplete}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step label ───────────────────────────────────────────────────────────────

function StepLabel({ step, type, format }: { step: number; type: string; format?: string }) {
  const labels: Record<string, string> = {
    explanation: "Read",
    "exercise:multiple_choice": "Choose",
    "exercise:fill_blank": "Fill in",
    "exercise:speaking": "Say it",
    "exercise:checklist": "Check off",
    checklist: "Check off",
  };
  const key = format ? `exercise:${format}` : type;
  const label = labels[key] ?? "Step";

  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
      {label}
    </p>
  );
}

// ── Finished state ───────────────────────────────────────────────────────────

function FinishedState({
  title,
  total,
  onClose,
}: {
  title: string;
  total: number;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "var(--btn-regular-bg-active)" }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          style={{ color: "var(--primary)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Session done!
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          {total} step{total !== 1 ? "s" : ""} completed · {title}
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-xs px-4 py-2 rounded-xl transition-colors"
        style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-secondary)" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
      >
        Back to chat
      </button>
    </div>
  );
}
