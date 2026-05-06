"use client";

import { useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import type { SpeakingArgs } from "@/lib/ai-practice/tools/registry";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import type { EvaluationResult } from "@/lib/exercise/design";
import { useRecorder } from "@/hooks/useRecorder";
import ExerciseFeedback from "./ExerciseFeedback";

function buildSpeakingResult(target: string, transcript: string, score: number): EvaluationResult {
  const correct = score >= 0.6;
  return {
    correct,
    category: correct ? "correct" : "incorrect_form",
    userAnswer: transcript,
    expectedAnswer: target,
    feedback: {
      immediate: correct ? "Great pronunciation!" : "Close — keep practicing.",
      explanation: correct
        ? `You said: "${transcript}" (score ${Math.round(score * 100)}%).`
        : `You said: "${transcript}" (score ${Math.round(score * 100)}%). Try to match the target more closely.`,
      tip: correct ? undefined : `Target: "${target}"`,
    },
    score: Math.round(score * 100),
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
  const { startRecording, stopRecording, isRecording, audioUrl, resetRecording } = useRecorder();
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const answered = status === "answered";

  async function handleStop() {
    stopRecording();
    // Short delay for recorder to finalize blob
    await new Promise(r => setTimeout(r, 300));
    if (!audioUrl) return;

    setTranscribing(true);
    try {
      const res = await fetch("/api/gemini/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl, target: args.target }),
      });
      const data = await res.json();
      const text: string = data.transcript ?? "";
      const s: number = data.score ?? 0.5;
      setTranscript(text);
      setScore(s);
      onAnswer({ correct: s >= 0.6, score: s, topic: args.target, gradedBy: "model" });
    } catch {
      onAnswer({ correct: false, topic: args.target, gradedBy: "model" });
    } finally {
      setTranscribing(false);
    }
  }

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)" }}
    >
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {args.prompt}
      </p>
      <div className="flex items-center gap-3">
        <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {args.target}
        </p>
        {args.ipa && (
          <span className="text-sm font-mono" style={{ color: "var(--text-tertiary)" }}>
            /{args.ipa}/
          </span>
        )}
      </div>

      {!answered && (
        <div className="flex items-center gap-3">
          {!isRecording && !transcribing && !transcript && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
            >
              <Mic className="w-4 h-4" />
              Record
            </button>
          )}
          {isRecording && (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm animate-pulse"
              style={{ backgroundColor: "var(--score-poor)", color: "var(--on-primary)" }}
            >
              <MicOff className="w-4 h-4" />
              Stop
            </button>
          )}
          {transcribing && (
            <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing…
            </span>
          )}
        </div>
      )}

      {transcript && score !== null && (
        <ExerciseFeedback
          result={buildSpeakingResult(args.target, transcript, score)}
          onNext={score >= 0.6 ? onNext : undefined}
          onRetry={
            score < 0.6
              ? () => {
                  setTranscript(null);
                  setScore(null);
                  resetRecording();
                  onRetry?.();
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
