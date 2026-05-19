"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, RotateCcw, Volume2, ChevronRight, Loader2, Pause } from "lucide-react";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { useSharedMicStream } from "@/hooks/useSharedMicStream";
import { GeminiAdapter } from "@/lib/speech/adapters/geminiAdapter";
import type { SpeechInputAdapter } from "@/lib/speech/types";
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
  const { getStream } = useSharedMicStream();
  const adapterRef = useRef<SpeechInputAdapter>(
    new GeminiAdapter(getStream, "/api/gemini/transcribe-sentence")
  );
  const { state, result, error: speechError, start, stop, reset } = useSpeechInput({
    adapter: adapterRef.current,
  });
  const isRecording = state === "listening";
  const [phase, setPhase] = useState<RecPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!result || phase !== "transcribing") return;
    (async () => {
      try {
        const scored = await scorePronunciation(
          result.transcript, targetText, getThreshold(level, difficulty)
        );
        onDone(scored, result.transcript);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setPhase("idle");
      }
    })();
  }, [result, phase, targetText, difficulty, level, onDone]);

  const handleToggle = async () => {
    if (isRecording) {
      void stop();
      setPhase("review");
    } else {
      setError(null);
      reset();
      setPhase("recording");
      await start();
    }
  };

  const handleReRecord = async () => {
    setError(null);
    reset();
    setPhase("recording");
    await start();
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
      {(error || speechError) && <p className="w-full text-xs text-error mb-1">{error ?? speechError}</p>}

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


