"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2, RotateCcw } from "lucide-react";
import { useRecorder } from "@/hooks/useRecorder";
import { scorePronunciation } from "@/lib/scoring";
import type { ScoringResult } from "@/lib/types";

export type ExerciseDifficulty = "guided" | "challenge";
export type Level = "beginner" | "intermediate" | "advanced";

const BASE_THRESHOLD: Record<Level, number> = { beginner: 42, intermediate: 62, advanced: 78 };
const DIFFICULTY_MODIFIER: Record<ExerciseDifficulty, number> = { guided: 0, challenge: 12 };

function getThreshold(level: Level, difficulty: ExerciseDifficulty) {
  return BASE_THRESHOLD[level] + DIFFICULTY_MODIFIER[difficulty];
}

interface Props {
  targetText: string;
  difficulty: ExerciseDifficulty;
  level: Level;
  onDone: () => void;
}

type Phase = "idle" | "recording" | "transcribing" | "result";

function AccuracyRing({ accuracy }: { accuracy: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (accuracy / 100) * circ;
  const color = accuracy >= 80 ? "var(--accent)" : accuracy >= 55 ? "#f59e0b" : "#ef4444";

  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--line-divider)" strokeWidth="6" />
      <circle
        cx="40" cy="40" r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text x="40" y="45" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>
        {Math.round(accuracy)}%
      </text>
    </svg>
  );
}

function WordChip({ word, status, tip }: { word: string; status: "correct" | "incorrect" | "missing"; tip?: string }) {
  const [showTip, setShowTip] = useState(false);
  const bg: Record<typeof status, string> = {
    correct: "bg-green-500/10 text-green-700 dark:text-green-400",
    incorrect: "bg-red-500/10 text-red-600",
    missing: "bg-amber-500/10 text-amber-600 line-through",
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => tip && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <span
        className={`inline-block px-2 py-0.5 rounded text-sm font-medium select-none ${bg[status]} ${tip ? "cursor-help underline decoration-dotted underline-offset-2" : ""}`}
      >
        {word}
      </span>
      {showTip && tip && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap z-20 shadow-lg pointer-events-none"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--line-divider)",
            color: "var(--body-text)",
          }}
        >
          {tip}
          {/* Arrow */}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2"
            style={{
              borderWidth: "5px",
              borderStyle: "solid",
              borderColor: "var(--line-divider) transparent transparent transparent",
            }}
          />
          <span
            className="absolute top-full left-1/2 -translate-x-1/2"
            style={{
              marginTop: "-1px",
              borderWidth: "4px",
              borderStyle: "solid",
              borderColor: "var(--card-bg) transparent transparent transparent",
            }}
          />
        </span>
      )}
    </span>
  );
}

export default function CandidateRecorder({ targetText, difficulty, level, onDone }: Props) {
  const { startRecording, stopRecording, audioUrl, isRecording, error: recError, resetRecording } = useRecorder();
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const processedUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!audioUrl || audioUrl === processedUrl.current || phase !== "transcribing") return;
    processedUrl.current = audioUrl;

    async function run() {
      try {
        const res = await fetch("/api/gemini/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioDataUrl: audioUrl }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? `Transcription failed (${res.status})`);
        }
        const { transcript: text } = await res.json();
        setTranscript(text);
        const scored = await scorePronunciation(text, targetText, getThreshold(level, difficulty));
        setResult(scored);
        setPhase("result");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setPhase("idle");
      }
    }

    run();
  }, [audioUrl, phase, targetText]);

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      setPhase("transcribing");
    } else {
      setError(null);
      setResult(null);
      setTranscript("");
      resetRecording();
      processedUrl.current = null;
      setPhase("recording");
      await startRecording();
    }
  };

  const handleRetry = () => {
    resetRecording();
    processedUrl.current = null;
    setResult(null);
    setTranscript("");
    setError(null);
    setPhase("idle");
  };

  if (phase === "idle" || phase === "recording") {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        {(error || recError) && <p className="text-xs text-red-500">{error ?? recError}</p>}
        <button
          onClick={handleToggleRecording}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isRecording ? "bg-red-500 scale-110 animate-pulse" : "hover:scale-105"
          }`}
          style={!isRecording ? { background: "var(--accent)" } : {}}
        >
          {isRecording ? <MicOff size={24} color="white" /> : <Mic size={24} color="white" />}
        </button>
        <p className="text-xs" style={{ color: "var(--muted-text)" }}>
          {isRecording ? "Recording… tap to stop" : "Tap to record yourself"}
        </p>
      </div>
    );
  }

  if (phase === "transcribing") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} />
        <p className="text-sm" style={{ color: "var(--muted-text)" }}>Analyzing your pronunciation…</p>
      </div>
    );
  }

  if (!result) return null;

  const threshold = getThreshold(level, difficulty);
  const feedbackColor = result.accuracy >= threshold ? "#22c55e" : result.accuracy >= threshold * 0.75 ? "#f59e0b" : "#ef4444";
  const feedbackMsg =
    result.accuracy >= 90 ? "Excellent! Nearly perfect." :
    result.accuracy >= threshold ? "Good — meets the bar for this level." :
    result.accuracy >= threshold * 0.75 ? "Almost there — a bit more precision needed." :
    "Keep practicing — focus on the highlighted words.";

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center gap-5">
        <AccuracyRing accuracy={result.accuracy} />
        <div>
          <p className="text-sm font-medium" style={{ color: feedbackColor }}>{feedbackMsg}</p>
          {transcript && (
            <p className="text-xs mt-1" style={{ color: "var(--muted-text)" }}>
              You said: &ldquo;{transcript}&rdquo;
            </p>
          )}
        </div>
      </div>

      {result.wordResults && result.wordResults.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.wordResults.map((w, i) => (
            <WordChip
              key={i}
              word={w.expected}
              status={w.status}
              tip={w.phonemes?.tip ?? undefined}
            />
          ))}
        </div>
      )}

      {result.wordResults?.some((w) => w.phonemes?.tip) && (
        <p className="text-xs" style={{ color: "var(--muted-text)" }}>
          Hover the underlined words for pronunciation tips.
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleRetry}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm"
          style={{ borderColor: "var(--line-divider)", color: "var(--muted-text)" }}
        >
          <RotateCcw size={13} />
          Try again
        </button>
        <button
          onClick={onDone}
          className="flex-1 py-2 rounded-xl text-sm font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
