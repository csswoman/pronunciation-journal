"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, RotateCcw, Volume2, ChevronRight, Loader2, Pause } from "lucide-react";
import { useRecorder } from "@/hooks/useRecorder";
import { scorePronunciation } from "@/lib/pronunciation/scoring";
import type { ScoringResult } from "@/lib/types";
import type { ExerciseDifficulty, Level } from "./CandidateRecorder";
import { getThreshold } from "./interview-utils";
import Button from "@/components/ui/Button";

type RecPhase = "idle" | "recording" | "review" | "transcribing";

interface Props {
  targetText: string;
  difficulty: ExerciseDifficulty;
  level: Level;
  onDone: (result: ScoringResult, transcript: string) => void;
  onListen: () => void;
  isListening: boolean;
}

export function InlineRecorder({ targetText, difficulty, level, onDone, onListen, isListening }: Props) {
  const { startRecording, stopRecording, audioUrl, isRecording, error: recError, resetRecording } = useRecorder();
  const [phase, setPhase] = useState<RecPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const processed = useRef<string | null>(null);

  useEffect(() => {
    if (!audioUrl || audioUrl === processed.current || phase !== "transcribing") return;
    processed.current = audioUrl;
    (async () => {
      try {
        const res = await fetch("/api/gemini/transcribe-sentence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioDataUrl: audioUrl }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? `${res.status}`);
        }
        const { transcript } = await res.json();
        const scored = await scorePronunciation(transcript, targetText, getThreshold(level, difficulty));
        onDone(scored, transcript);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setPhase("idle");
      }
    })();
  }, [audioUrl, phase, targetText, difficulty, level, onDone]);

  const handleToggle = async () => {
    if (isRecording) {
      stopRecording();
      setPhase("review");
    } else {
      setError(null);
      resetRecording();
      processed.current = null;
      setPhase("recording");
      await startRecording();
    }
  };

  const handleReRecord = async () => {
    setError(null);
    resetRecording();
    processed.current = null;
    setPhase("recording");
    await startRecording();
  };

  if (phase === "transcribing") {
    return (
      <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--line-divider)" }}>
        <Loader2 size={15} className="animate-spin" style={{ color: "var(--color-accent)" }} />
        <span className="text-xs" style={{ color: "var(--muted-text)" }}>Analyzing your pronunciation…</span>
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--line-divider)" }}>
        <span className="text-xs" style={{ color: "var(--muted-text)" }}>Recording ready</span>
        <Button variant="primary" size="sm" icon={<ChevronRight size={13} />} onClick={() => setPhase("transcribing")}>Send</Button>
        <span className="relative group ml-auto">
          <Button variant="outline" size="icon" onClick={handleReRecord} className="!rounded-xl w-8 h-8">
            <RotateCcw size={14} />
          </Button>
          <span className="absolute bottom-full right-0 mb-1.5 px-2 py-1 rounded-lg text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg"
            style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)", color: "var(--body-text)" }}>
            Re-record
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 flex-wrap" style={{ borderTop: "1px solid var(--line-divider)" }}>
      {(error || recError) && <p className="w-full text-xs text-error mb-1">{error ?? recError}</p>}

      <Button
        variant={isListening ? "primary" : "ghost"}
        size="sm"
        icon={isListening ? <Pause size={13} /> : <Volume2 size={13} />}
        onClick={onListen}
        title="Hear how this should sound"
      >
        {isListening ? "Pause" : "Listen"}
      </Button>

      <Button
        variant={isRecording ? "danger" : "primary"}
        size="sm"
        icon={isRecording ? <MicOff size={13} /> : <Mic size={13} />}
        onClick={handleToggle}
        className={isRecording ? "animate-pulse" : ""}
      >
        {isRecording ? "Stop recording" : "Record"}
      </Button>

      {phase === "idle" && !isRecording && (
        <span className="text-xs" style={{ color: "var(--muted-text)" }}>Say the text above</span>
      )}
    </div>
  );
}


