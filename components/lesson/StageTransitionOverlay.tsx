"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
import type { LessonStageId } from "./lesson-lobby-types";

const NEXT_LABELS: Record<LessonStageId, string> = {
  guided: "Listen & Repeat",
  pronunciation: "Speak Free",
  speed: "Quick Quiz",
};

const NEXT_CAPTIONS: Record<LessonStageId, string> = {
  guided: "",
  pronunciation: "Same words, no hints this time. You've got this.",
  speed: "Five rapid-fire questions to lock in what you practiced.",
};

interface Props {
  completedStage: LessonStageId;
  nextStage: LessonStageId;
  visible: boolean;
  onDismiss: () => void;
}

export function StageTransitionOverlay({ nextStage, visible, onDismiss }: Props) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, 1800);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <div
      className="overflow-hidden border-b border-border-subtle"
      style={{
        maxHeight: visible ? "80px" : "0px",
        transition: "max-height 250ms ease-out",
        background: "color-mix(in oklch, var(--admonitions-color-tip) 10%, transparent)",
        borderColor: "color-mix(in oklch, var(--admonitions-color-tip) 30%, transparent)",
      }}
    >
      <div className="flex items-center gap-3 px-6 py-4">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in oklch, var(--admonitions-color-tip) 20%, transparent)",
            color: "var(--admonitions-color-tip)",
          }}
        >
          <Check size={14} strokeWidth={2.5} />
        </span>
        <div>
          <p
            className="font-display text-h4 leading-tight"
            style={{ color: "var(--admonitions-color-tip)" }}
          >
            Stage complete — moving to {NEXT_LABELS[nextStage]}
          </p>
          {NEXT_CAPTIONS[nextStage] && (
            <p className="text-caption text-fg-muted mt-0.5">{NEXT_CAPTIONS[nextStage]}</p>
          )}
        </div>
      </div>
    </div>
  );
}
