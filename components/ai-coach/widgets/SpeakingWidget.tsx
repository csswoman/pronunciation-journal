"use client";

import { useState, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import type { SpeakingArgs } from "@/lib/ai-practice/tools/registry";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import type { EvaluationResult } from "@/lib/exercises/design";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { useSharedMicStream } from "@/hooks/useSharedMicStream";
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

interface Props {
  args: SpeakingArgs;
  status: "pending" | "rendered" | "answered" | "error";
  onAnswer: (result: ExerciseResult) => void;
  onNext?: () => void;
  onRetry?: () => void;
}

export default function SpeakingWidget({ args, status, onAnswer, onNext, onRetry }: Props) {
  const { getStream } = useSharedMicStream();
  const { state, start, stop, reset } = useSpeechInput({
    prefer: "gemini",
    getStream,
    onResult: (r) => {
      const text = r.transcript;
      const s = scoreTranscript(text, args.target);
      setTranscript(text);
      setScore(s);
      onAnswer({ correct: s >= 0.6, score: s, topic: args.target, gradedBy: "model" });
    },
  });
  const [transcript, setTranscript] = useState<string | null>(null);
  const [score, setScore]           = useState<number | null>(null);
  const answered    = status === "answered";
  const isRecording = state === "listening";
  const transcribing = state === "processing";

  const speakTarget = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(args.target);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, [args.target]);

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-[var(--text-secondary)] text-center">{args.prompt}</p>

      <div className="flex flex-col items-center gap-2 px-4 py-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
        <p className="text-xl font-semibold text-[var(--text-primary)]">{args.target}</p>
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

      {!answered && (
        <div className="flex justify-center">
          {!isRecording && !transcribing && !transcript && (
            <button
              onClick={() => start()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-[var(--primary)] text-[var(--on-primary)] transition-opacity hover:opacity-90"
            >
              <Mic className="w-4 h-4" /> Record
            </button>
          )}
          {isRecording && (
            <button
              onClick={() => stop()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold animate-pulse bg-[var(--error)] text-[var(--on-primary)]"
            >
              <MicOff className="w-4 h-4" /> Stop
            </button>
          )}
          {transcribing && (
            <span className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing…
            </span>
          )}
        </div>
      )}

      {transcript && score !== null && (
        <ExerciseFeedback
          result={buildSpeakingResult(args.target, transcript, score)}
          onNext={score >= 0.6 ? onNext : undefined}
          onRetry={score < 0.6 ? () => { setTranscript(null); setScore(null); reset(); onRetry?.(); } : undefined}
        />
      )}
    </div>
  );
}
