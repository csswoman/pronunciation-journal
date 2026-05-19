"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, Loader2, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { useSharedMicStream } from "@/hooks/useSharedMicStream";
import { scorePronunciation } from "@/lib/pronunciation/scoring";
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
  const color = accuracy >= 80 ? "var(--score-excellent)" : accuracy >= 55 ? "var(--score-acceptable)" : "var(--score-poor)";

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

function WordChip({ word, status, tip }: { word: string; status: "correct" | "incorrect" | "missing" | "extra"; tip?: string }) {
  const [showTip, setShowTip] = useState(false);
  const bg: Record<typeof status, string> = {
    correct: "bg-success/10 text-success dark:text-success",
    incorrect: "bg-warning-soft text-warning",
    missing: "bg-warning/10 text-warning line-through",
    extra: "bg-surface-sunken text-fg-subtle",
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
  const { getStream } = useSharedMicStream();
  const { state, result: speechResult, error: speechError, start, stop, reset } = useSpeechInput({
    prefer: "gemini",
    getStream,
  });
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isRecording = state === "listening";

  useEffect(() => {
    if (!speechResult || phase !== "transcribing") return;
    const currentResult = speechResult;
    async function run() {
      try {
        const text = currentResult.transcript;
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
  }, [speechResult, phase, targetText, level, difficulty]);

  const handleToggleRecording = async () => {
    if (isRecording) {
      void stop();
      setPhase("transcribing");
    } else {
      setError(null);
      setResult(null);
      setTranscript("");
      reset();
      setPhase("recording");
      await start();
    }
  };

  const handleRetry = () => {
    reset();
    setResult(null);
    setTranscript("");
    setError(null);
    setPhase("idle");
  };

  if (phase === "idle" || phase === "recording") {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        {(error || speechError) && <p className="text-xs text-error">{error ?? speechError}</p>}
        <button
          onClick={handleToggleRecording}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isRecording ? "bg-warning scale-110 animate-pulse" : "hover:scale-105"
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
  const feedbackColor = result.accuracy >= threshold ? "var(--score-excellent)" : result.accuracy >= threshold * 0.75 ? "var(--score-acceptable)" : "var(--score-poor)";
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
        <Button variant="outline" icon={<RotateCcw size={13} />} onClick={handleRetry}>Try again</Button>
        <Button variant="primary" onClick={onDone} className="flex-1 py-2">Next →</Button>
      </div>
    </div>
  );
}




