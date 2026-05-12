"use client";

import { useState, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
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

function scoreTranscript(transcript: string, target: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const t = normalize(transcript);
  const g = normalize(target);
  if (t === g) return 1;
  if (t.includes(g) || g.includes(t)) return 0.8;
  const tWords = new Set(t.split(/\s+/));
  const gWords = g.split(/\s+/);
  const matches = gWords.filter(w => tWords.has(w)).length;
  return gWords.length > 0 ? matches / gWords.length : 0;
}

export default function SpeakingWidget({ args, status, onAnswer, onNext, onRetry }: Props) {
  const { startRecording, stopRecording, isRecording, audioUrl, resetRecording } = useRecorder();
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const answered = status === "answered";

  const speakTarget = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(args.target);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, [args.target]);

  async function handleStop() {
    stopRecording();
    await new Promise(r => setTimeout(r, 300));
    if (!audioUrl) return;

    setTranscribing(true);
    try {
      const res = await fetch("/api/gemini/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioDataUrl: audioUrl, targetWord: args.target }),
      });
      const data = await res.json();
      const text: string = data.transcript ?? "";
      const s: number = scoreTranscript(text, args.target);
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
      className="rounded-xl border border-border-subtle p-4 space-y-3 bg-surface-sunken"
    >
      <p className="text-sm text-fg-muted">
        {args.prompt}
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-lg font-semibold text-fg">
          {args.target}
        </p>
        {args.ipa && (
          <span className="text-sm font-mono text-fg-subtle">
            /{args.ipa}/
          </span>
        )}
        <button
          onClick={speakTarget}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-surface-sunken text-fg-muted"
          title="Listen to pronunciation"
        >
          <Volume2 className="w-3.5 h-3.5" />
          Listen
        </button>
      </div>

      {!answered && (
        <div className="flex items-center gap-3">
          {!isRecording && !transcribing && !transcript && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary text-on-primary"
            >
              <Mic className="w-4 h-4" />
              Record
            </button>
          )}
          {isRecording && (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm animate-pulse bg-error text-on-primary"
            >
              <MicOff className="w-4 h-4" />
              Stop
            </button>
          )}
          {transcribing && (
            <span className="flex items-center gap-2 text-sm text-fg-subtle">
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
