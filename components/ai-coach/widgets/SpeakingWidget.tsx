"use client";

// Planned structure:
// <SpeakingWidget>
//   <TargetPhrase />       — phrase + IPA + Listen button (with word highlighting after attempt)
//   <RecordingControls />  — animated waveform + record button (shared from pronunciation flow)
//   <ExerciseFeedback />   — score + transcript + Next/Retry
// </SpeakingWidget>

import { useState, useCallback } from "react";
import { Volume2 } from "lucide-react";
import type { SpeakingArgs } from "@/lib/ai-practice/tools/registry";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import type { EvaluationResult } from "@/lib/exercises/design";
import type { ScoringResult, WordResult } from "@/lib/types";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { useSharedMicStream } from "@/hooks/useSharedMicStream";
import { scorePronunciation } from "@/lib/pronunciation/scoring";
import RecordingControls from "@/components/ai-coach/pronunciation/RecordingControls";
import ExerciseFeedback from "./ExerciseFeedback";

function buildResult(target: string, scoring: ScoringResult): EvaluationResult {
  const accuracy = scoring.accuracy;
  const correct  = scoring.isCorrect;
  return {
    correct,
    category: correct ? "correct" : "incorrect_form",
    errorCode: correct ? "correct" : "form_error",
    userAnswer: scoring.transcript,
    expectedAnswer: target,
    feedback: {
      immediate: correct
        ? accuracy >= 90 ? "Excellent pronunciation!" : "Great job!"
        : "Close — keep practicing.",
      explanation: `You said: "${scoring.transcript}"`,
      tip: correct ? undefined : `Target: "${target}"`,
    },
    score: accuracy,
    gradedBy: "model",
  };
}

interface Props {
  args: SpeakingArgs;
  status: "pending" | "rendered" | "answered" | "error";
  onAnswer: (result: ExerciseResult) => void;
  onNext?: () => void;
  onRetry?: () => void;
}

export default function SpeakingWidget({ args, status, onAnswer, onNext, onRetry }: Props) {
  const { getStream } = useSharedMicStream();
  const [scoring, setScoring]   = useState<ScoringResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const { state, start, stop, reset } = useSpeechInput({
    prefer: "gemini",
    getStream,
    onResult: async (r) => {
      setAnalyzing(true);
      try {
        const result = await scorePronunciation(r.transcript, args.target, 60);
        setScoring(result);
        onAnswer({ correct: result.isCorrect, score: result.accuracy / 100, topic: args.target, gradedBy: "model" });
      } finally {
        setAnalyzing(false);
      }
    },
  });

  const answered    = status === "answered";
  const isRecording = state === "listening";
  const hasResult   = scoring !== null;

  const speakTarget = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(args.target);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, [args.target]);

  const handleMicClick = useCallback(() => {
    if (isRecording) {
      void stop();
    } else {
      void start();
    }
  }, [isRecording, start, stop]);

  const handleRetry = useCallback(() => {
    setScoring(null);
    reset();
    onRetry?.();
  }, [reset, onRetry]);

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-[var(--text-secondary)] text-center">{args.prompt}</p>

      <div className="flex flex-col items-center gap-2 px-4 py-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
        <TargetPhrase target={args.target} wordResults={scoring?.wordResults ?? null} />
        {args.ipa && (
          <span className="text-sm font-mono text-[var(--text-tertiary)]">/{args.ipa}/</span>
        )}
        <button
          onClick={speakTarget}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--border-default)] text-[var(--text-secondary)] transition-opacity hover:opacity-70"
        >
          <Volume2 className="w-3.5 h-3.5" />
          Listen
        </button>
      </div>

      {!answered && !hasResult && (
        <RecordingControls
          isRecording={isRecording}
          onMicClick={handleMicClick}
          onSkip={() => onNext?.()}
        />
      )}

      {analyzing && !hasResult && (
        <p className="text-xs text-center text-[var(--text-tertiary)] animate-pulse">Analyzing…</p>
      )}

      {scoring && (
        <ExerciseFeedback
          result={buildResult(args.target, scoring)}
          onNext={scoring.isCorrect ? onNext : undefined}
          onRetry={!scoring.isCorrect ? handleRetry : undefined}
        />
      )}
    </div>
  );
}

function TargetPhrase({ target, wordResults }: { target: string; wordResults: WordResult[] | null }) {
  if (!wordResults) {
    return <p className="text-xl font-semibold text-[var(--text-primary)] text-center">{target}</p>;
  }
  const expectedWords = wordResults.filter(w => w.status !== "extra");
  return (
    <p className="text-xl font-semibold text-center leading-relaxed flex flex-wrap justify-center gap-x-2 gap-y-1">
      {expectedWords.map((w, i) => {
        const color =
          w.status === "correct" ? "var(--success)" :
          w.status === "missing" ? "var(--text-tertiary)" :
          "var(--error)";
        const bg =
          w.status === "correct" ? "transparent" :
          w.status === "missing" ? "transparent" :
          "var(--error-soft)";
        return (
          <span
            key={i}
            className="rounded px-1.5"
            style={{ color, backgroundColor: bg, textDecoration: w.status === "missing" ? "line-through" : "none" }}
          >
            {w.expected}
          </span>
        );
      })}
    </p>
  );
}
