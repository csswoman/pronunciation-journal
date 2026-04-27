"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, Square, RotateCcw, Volume2,
  Mic, MicOff, Loader2, ChevronRight,
} from "lucide-react";
import { useRecorder } from "@/hooks/useRecorder";
import { scorePronunciation } from "@/lib/scoring";
import type { ScoringResult } from "@/lib/types";
import type { ExerciseDifficulty, Level } from "./CandidateRecorder";

export interface InterviewTurn {
  role: "interviewer" | "candidate";
  text: string;
}

interface Props {
  title: string;
  turns: InterviewTurn[];
  difficulty: ExerciseDifficulty;
  level: Level;
  onReset: () => void;
}

// ─── Thresholds ───────────────────────────────────────────────────────────────
const BASE_THRESHOLD: Record<Level, number> = { beginner: 42, intermediate: 62, advanced: 78 };
const DIFF_MOD: Record<ExerciseDifficulty, number> = { guided: 0, challenge: 12 };
const getThreshold = (l: Level, d: ExerciseDifficulty) => BASE_THRESHOLD[l] + DIFF_MOD[d];

// ─── Speech helpers ───────────────────────────────────────────────────────────
function getEnVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google"))
    ?? voices.find((v) => v.lang.startsWith("en"));
}

function speakPromise(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9; u.lang = "en-US";
    const v = getEnVoice(); if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

// ─── Shared button styles ─────────────────────────────────────────────────────
const primaryBtn: React.CSSProperties = {
  background: "var(--color-accent)",
  color: "var(--color-text-on-accent)",
};
const ghostBtn: React.CSSProperties = {
  background: "var(--muted-bg)",
  color: "var(--muted-text)",
};
const outlineBtn: React.CSSProperties = {
  border: "1px solid var(--line-divider)",
  color: "var(--muted-text)",
};

// ─── Word chip with tooltip ───────────────────────────────────────────────────
function WordChip({ word, status, tip, onPlay }: {
  word: string;
  status: "correct" | "incorrect" | "missing";
  tip?: string;
  onPlay?: () => void;
}) {
  const [show, setShow] = useState(false);
  const colors = { correct: "#16a34a", incorrect: "#dc2626", missing: "#d97706" };
  const bgs    = { correct: "#16a34a18", incorrect: "#dc262618", missing: "#d9770618" };
  const isPlayable = onPlay && (status === "incorrect" || status === "missing");

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.();
  };

  return (
    <span className="relative inline-flex items-center gap-0.5" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span
        onClick={isPlayable ? handlePlay : undefined}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-opacity
          ${tip ? "underline decoration-dotted underline-offset-2" : ""}
          ${isPlayable ? "cursor-pointer hover:opacity-75 active:scale-95" : ""}
        `}
        style={{ color: colors[status], background: bgs[status] }}
        title={isPlayable ? `Listen to "${word}"` : undefined}
      >
        {word}
        {isPlayable && <Volume2 size={10} className="flex-shrink-0 opacity-60" />}
      </span>
      {show && tip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap z-30 shadow-xl pointer-events-none"
          style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)", color: "var(--body-text)" }}>
          {tip}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent" style={{ borderTopColor: "var(--line-divider)" }} />
          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-px border-[4px] border-transparent" style={{ borderTopColor: "var(--card-bg)" }} />
        </span>
      )}
    </span>
  );
}

// ─── Accuracy ring ────────────────────────────────────────────────────────────
function AccuracyRing({ accuracy, size = 56 }: { accuracy: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const color = accuracy >= 80 ? "#22c55e" : accuracy >= 55 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line-divider)" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${(accuracy/100)*circ} ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text x={size/2} y={size/2+4} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
        {Math.round(accuracy)}%
      </text>
    </svg>
  );
}

// ─── Inline recorder ──────────────────────────────────────────────────────────
type RecPhase = "idle" | "recording" | "review" | "transcribing";

function InlineRecorder({ targetText, difficulty, level, onDone, onListen, isListening }: {
  targetText: string;
  difficulty: ExerciseDifficulty;
  level: Level;
  onDone: (result: ScoringResult, transcript: string) => void;
  onListen: () => void;
  isListening: boolean;
}) {
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
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? `${res.status}`); }
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
      setError(null); resetRecording(); processed.current = null; setPhase("recording");
      await startRecording();
    }
  };

  const handleReRecord = async () => {
    setError(null); resetRecording(); processed.current = null; setPhase("recording");
    await startRecording();
  };

  const handleSend = () => setPhase("transcribing");

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
        <button
          onClick={handleSend}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          style={primaryBtn}
        >
          <ChevronRight size={13} /> Send
        </button>
        {/* Re-record: icon-only with tooltip */}
        <span className="relative group ml-auto">
          <button
            onClick={handleReRecord}
            className="flex items-center justify-center w-8 h-8 rounded-xl transition-all"
            style={outlineBtn}
          >
            <RotateCcw size={14} />
          </button>
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
      {(error || recError) && <p className="w-full text-xs text-red-500 mb-1">{error ?? recError}</p>}

      {/* Listen button */}
      <button
        onClick={onListen}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
        style={isListening
          ? { background: "var(--color-accent)", color: "var(--color-text-on-accent)" }
          : ghostBtn}
        title="Hear how this should sound"
      >
        {isListening ? <><Pause size={13} /> Pause</> : <><Volume2 size={13} /> Listen</>}
      </button>

      {/* Record button */}
      <button
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${isRecording ? "animate-pulse" : ""}`}
        style={isRecording ? { background: "#ef4444", color: "white" } : primaryBtn}
      >
        {isRecording ? <><MicOff size={13} /> Stop recording</> : <><Mic size={13} /> Record</>}
      </button>

      {phase === "idle" && !isRecording && (
        <span className="text-xs" style={{ color: "var(--muted-text)" }}>Say the text above</span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function InterviewSession({ title, turns, difficulty, level, onReset }: Props) {
  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const [visibleCount, setVisibleCount] = useState(1);
  const [results, setResults] = useState<Map<number, { score: ScoringResult; transcript: string }>>(new Map());
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const playAllAbort = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentIdx = visibleCount - 1;
  const progress = Math.round((visibleCount / turns.length) * 100);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleCount, results.size]);

  useEffect(() => {
    if (!speechSupported || turns[0]?.role !== "interviewer") return;
    playTurn(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playTurn = useCallback(async (idx: number) => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    setPlayingIdx(idx);
    await speakPromise(turns[idx].text);
    setPlayingIdx(null);
  }, [turns, speechSupported]);

  const stopTurn = () => {
    if (speechSupported) window.speechSynthesis.cancel();
    setPlayingIdx(null);
  };

  const handlePlayAll = async () => {
    if (isPlayingAll) {
      playAllAbort.current = true;
      window.speechSynthesis.cancel();
      setIsPlayingAll(false); setPlayingIdx(null);
      return;
    }
    playAllAbort.current = false;
    setIsPlayingAll(true);
    for (let i = 0; i < turns.length; i++) {
      if (playAllAbort.current) break;
      setPlayingIdx(i);
      await speakPromise(turns[i].text);
      setPlayingIdx(null);
      if (playAllAbort.current) break;
      await new Promise<void>((r) => setTimeout(r, 500));
    }
    setIsPlayingAll(false);
  };

  const revealNext = () => {
    if (visibleCount >= turns.length) return;
    const nextIdx = visibleCount;
    setVisibleCount(visibleCount + 1);
    if (turns[nextIdx]?.role === "interviewer") {
      setTimeout(() => playTurn(nextIdx), 300);
    }
  };

  const handleRecordDone = (idx: number, score: ScoringResult, transcript: string) => {
    setResults((prev) => new Map(prev).set(idx, { score, transcript }));
  };

  const visibleTurns = turns.slice(0, visibleCount);
  const isDone = visibleCount >= turns.length && results.has(turns.length - 1);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">

      {/* Top bar */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 flex items-center justify-between gap-3 border-b"
        style={{ borderColor: "var(--line-divider)", background: "var(--card-bg)" }}>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--deep-text)" }}>{title}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--line-divider)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: "var(--color-accent)" }} />
            </div>
            <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: "var(--muted-text)" }}>
              {Math.ceil(visibleCount / 2)}/{Math.ceil(turns.length / 2)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {speechSupported && (
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
              style={isPlayingAll
                ? { borderColor: "var(--color-accent)", color: "var(--color-accent)", background: "color-mix(in oklch, var(--color-accent) 10%, transparent)" }
                : outlineBtn}
            >
              {isPlayingAll ? <><Square size={11} /> Stop</> : <><Volume2 size={11} /> Preview</>}
            </button>
          )}
          <button
            onClick={() => { window.speechSynthesis?.cancel(); onReset(); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={outlineBtn}
          >
            <RotateCcw size={11} /> New
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4"
        style={{ background: "var(--muted-bg)" }}>

        {visibleTurns.map((turn, idx) => {
          const isActive = idx === currentIdx;
          const turnResult = results.get(idx);
          const isCurrentlyPlaying = playingIdx === idx;
          const threshold = getThreshold(level, difficulty);

          /* ── Interviewer bubble ─────────────────────────────── */
          if (turn.role === "interviewer") {
            return (
              <div key={idx} className="flex items-start gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm mt-1"
                  style={{ background: "var(--line-divider)" }}>
                  🎙️
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <span className="text-xs font-medium ml-1" style={{ color: "var(--muted-text)" }}>Interviewer</span>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3"
                    style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)" }}>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--body-text)" }}>{turn.text}</p>
                    <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--line-divider)" }}>
                      <button
                        onClick={() => isCurrentlyPlaying ? stopTurn() : playTurn(idx)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={isCurrentlyPlaying
                          ? { background: "var(--color-accent)", color: "var(--color-text-on-accent)" }
                          : ghostBtn}
                      >
                        {isCurrentlyPlaying ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Listen</>}
                      </button>
                      {isCurrentlyPlaying && (
                        <span className="flex gap-0.5 items-end h-3.5">
                          {[1,2,3].map((i) => (
                            <span key={i} className="w-0.5 rounded-full animate-bounce"
                              style={{ height: `${4+i*3}px`, background: "var(--color-accent)", animationDelay: `${i*0.12}s` }} />
                          ))}
                        </span>
                      )}
                      {isActive && idx + 1 < turns.length && turns[idx+1].role === "candidate" && (
                        <button
                          onClick={revealNext}
                          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={primaryBtn}
                        >
                          Answer <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          /* ── Candidate bubble ───────────────────────────────── */
          return (
            <div key={idx} className="flex items-start gap-3 max-w-[85%] self-end flex-row-reverse">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm mt-1"
                style={{ background: "color-mix(in oklch, var(--color-accent) 15%, transparent)" }}>
                🗣️
              </div>
              <div className="flex flex-col gap-1.5 flex-1 items-end">
                <div className="flex items-center gap-2 mr-1">
                  <span className="text-xs font-medium" style={{ color: "var(--muted-text)" }}>You</span>
                  {isActive && !turnResult && (
                    <span className="relative group">
                      <button
                        onClick={() => isDone ? onReset() : revealNext()}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs transition-all"
                        style={outlineBtn}
                      >
                        Skip
                      </button>
                      <span className="absolute bottom-full right-0 mb-1.5 px-2 py-1 rounded-lg text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg"
                        style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)", color: "var(--body-text)" }}>
                        Skip this line
                      </span>
                    </span>
                  )}
                </div>
                <div className="w-full rounded-2xl rounded-tr-sm px-4 py-3"
                  style={{
                    background: "var(--card-bg)",
                    border: `1.5px solid ${isActive && !turnResult ? "var(--color-accent)" : "var(--line-divider)"}`,
                  }}>

                  {/* Teleprompter text */}
                  <p className="text-sm leading-relaxed font-medium" style={{ color: "var(--deep-text)" }}>
                    {turn.text}
                  </p>

                  {/* Feedback after recording */}
                  {turnResult && (
                    <div className="mt-3 pt-3 flex flex-col gap-3" style={{ borderTop: "1px solid var(--line-divider)" }}>
                      <div className="flex items-center gap-3">
                        <AccuracyRing accuracy={turnResult.score.accuracy} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold" style={{
                            color: turnResult.score.accuracy >= threshold ? "#22c55e"
                              : turnResult.score.accuracy >= threshold * 0.75 ? "#f59e0b" : "#ef4444",
                          }}>
                            {turnResult.score.accuracy >= 90 ? "Excellent!" :
                              turnResult.score.accuracy >= threshold ? "Meets the bar." :
                              turnResult.score.accuracy >= threshold * 0.75 ? "Almost there." :
                              "Keep practicing."}
                          </p>
                        </div>
                      </div>
                      {turnResult.score.wordResults?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {turnResult.score.wordResults.map((w, i) => (
                            <WordChip key={i} word={w.expected} status={w.status} tip={w.phonemes?.tip ?? undefined}
                              onPlay={() => speakPromise(w.expected)} />
                          ))}
                        </div>
                      )}
                      {turnResult.score.wordResults?.some((w) => w.phonemes?.tip) && (
                        <p className="text-xs" style={{ color: "var(--muted-text)" }}>Hover underlined words for tips.</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setResults((prev) => { const m = new Map(prev); m.delete(idx); return m; })}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={outlineBtn}
                        >
                          <RotateCcw size={11} /> Retry
                        </button>
                        {isActive && (
                          <button
                            onClick={() => isDone ? onReset() : revealNext()}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold"
                            style={primaryBtn}
                          >
                            {isDone ? "Finish" : <>Next <ChevronRight size={12} /></>}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recorder (active, not yet recorded) */}
                  {isActive && !turnResult && (
                    <InlineRecorder
                      key={idx}
                      targetText={turn.text}
                      difficulty={difficulty}
                      level={level}
                      onDone={(score, transcript) => handleRecordDone(idx, score, transcript)}
                      onListen={() => isCurrentlyPlaying ? stopTurn() : playTurn(idx)}
                      isListening={isCurrentlyPlaying}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isPlayingAll && (
          <div className="flex justify-center py-2">
            <span className="flex gap-1 items-end h-5">
              {[1,2,3].map((i) => (
                <span key={i} className="w-1 rounded-full animate-bounce"
                  style={{ height: `${6+i*4}px`, background: "var(--color-accent)", animationDelay: `${i*0.15}s` }} />
              ))}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!speechSupported && (
        <div className="flex-shrink-0 px-4 py-2 text-center text-xs"
          style={{ color: "var(--muted-text)", background: "var(--card-bg)", borderTop: "1px solid var(--line-divider)" }}>
          Speech synthesis not supported — audio playback is disabled.
        </div>
      )}
    </div>
  );
}
