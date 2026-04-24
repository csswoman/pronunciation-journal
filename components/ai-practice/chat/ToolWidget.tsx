"use client";

import { useEffect, useRef } from "react";
import type { ToolCall } from "@/lib/ai-practice/types";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import MultipleChoiceWidget from "../widgets/MultipleChoiceWidget";
import FillBlankWidget from "../widgets/FillBlankWidget";
import SpeakingWidget from "../widgets/SpeakingWidget";
import WordCardWidget from "../widgets/WordCardWidget";
import type {
  MultipleChoiceArgs,
  FillBlankArgs,
  SpeakingArgs,
  WordCardArgs,
} from "@/lib/ai-practice/tools/registry";
import { logEvent } from "@/lib/ai-practice/events";

const ABANDON_TIMEOUT_MS = 30_000;
const AUTO_NEXT_DELAY_MS = 800;

interface Props {
  toolCall: ToolCall;
  onAnswer: (callId: string, result: ExerciseResult) => void;
  onNext: () => void;
  onRetry?: () => void;
  /** Called once when the first exercise of a session becomes visible. */
  onFirstExercise?: () => void;
}

export default function ToolWidget({ toolCall, onAnswer, onNext, onRetry, onFirstExercise }: Props) {
  if (toolCall.status === "error") return null;

  const topic = (toolCall.args as { topic?: string }).topic ?? "unknown";

  const shownRef     = useRef(false);
  const shownAtRef   = useRef(0);
  const answeredRef  = useRef(false);
  const attemptsRef  = useRef(0);

  // ── exercise_shown + abandonment timer ───────────────────────────────────
  useEffect(() => {
    if (shownRef.current || toolCall.status === "pending") return;
    shownRef.current = true;
    shownAtRef.current = Date.now();

    logEvent("exercise_shown", { exerciseType: toolCall.name, topic }).catch(() => {});
    onFirstExercise?.();

    const timer = setTimeout(() => {
      if (!answeredRef.current) {
        logEvent("exercise_abandoned", {
          topic,
          timeSpentMs: Date.now() - shownAtRef.current,
        }).catch(() => {});
      }
    }, ABANDON_TIMEOUT_MS);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolCall.status]);

  // ── exercise_answered / exercise_correct ─────────────────────────────────
  useEffect(() => {
    if (toolCall.status !== "answered" || !toolCall.result || answeredRef.current) return;
    answeredRef.current = true;

    const latencyMs = shownAtRef.current ? Date.now() - shownAtRef.current : 0;
    logEvent("exercise_answered", {
      exerciseType: toolCall.name,
      topic: toolCall.result.topic,
      correct: toolCall.result.correct,
      latencyMs,
    }).catch(() => {});

    if (toolCall.result.correct) {
      logEvent("exercise_correct", { exerciseType: toolCall.name, topic: toolCall.result.topic }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolCall.status]);

  // ── auto_next_triggered disabled (user must click Next manually) ───────────
  // Removed auto-advance on correct answer; user must explicitly click Next

  // ── handlers ─────────────────────────────────────────────────────────────

  function handleAnswer(result: ExerciseResult) {
    onAnswer(toolCall.id, result);
  }

  function handleNext() {
    logEvent("next_clicked", { topic }).catch(() => {});
    onNext();
  }

  function handleRetry() {
    attemptsRef.current += 1;
    logEvent("retry_clicked", { topic, attempts: attemptsRef.current }).catch(() => {});
    onRetry?.();
  }

  // ── render ───────────────────────────────────────────────────────────────

  switch (toolCall.name) {
    case "render_multiple_choice":
      return (
        <MultipleChoiceWidget
          args={toolCall.args as MultipleChoiceArgs}
          status={toolCall.status}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onRetry={handleRetry}
        />
      );
    case "render_fill_blank":
      return (
        <FillBlankWidget
          args={toolCall.args as FillBlankArgs}
          status={toolCall.status}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onRetry={handleRetry}
        />
      );
    case "render_speaking":
      return (
        <SpeakingWidget
          args={toolCall.args as SpeakingArgs}
          status={toolCall.status}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onRetry={handleRetry}
        />
      );
    case "render_word_card":
      return <WordCardWidget args={toolCall.args as WordCardArgs} />;
    default:
      return null;
  }
}
