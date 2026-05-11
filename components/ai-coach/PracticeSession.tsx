"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ToolCall, ExerciseResult } from "@/lib/ai-practice/types";
import { fetchExerciseCard, cycleExercisePrompt } from "@/lib/ai-practice/fetch-card";
import ToolWidget from "./chat/ToolWidget";

// ── helpers ──────────────────────────────────────────────────────────────────

type ExStatus = "idle" | "correct" | "incorrect" | "reviewing";

interface SessionExercise {
  id: string;
  toolCall: ToolCall;
  status: ExStatus;
  result: ExerciseResult | null;
}

function formatTopic(topic: string): string {
  const label = topic.includes(":") ? topic.split(":").pop()! : topic;
  return label
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function exerciseLabel(name: string) {
  switch (name) {
    case "render_multiple_choice": return "Multiple choice";
    case "render_fill_blank":      return "Fill in the blank";
    case "render_word_card":       return "Vocabulary";
    case "render_speaking":        return "Speaking";
    default: return "Exercise";
  }
}

// ── ProgressRing ─────────────────────────────────────────────────────────────

function ProgressRing({ durationMs }: { durationMs: number }) {
  const r = 8;
  const circ = 2 * Math.PI * r;
  return (
    <svg
      width={20} height={20}
      style={{ position: "absolute", inset: 0, margin: "auto", pointerEvents: "none" }}
    >
      <circle cx={10} cy={10} r={r} fill="none" stroke="white" strokeOpacity={0.3} strokeWidth={2} />
      <circle
        cx={10} cy={10} r={r} fill="none" stroke="white" strokeWidth={2}
        strokeDasharray={circ}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform="rotate(-90 10 10)"
        style={{
          animation: `practiceRingDrain ${durationMs}ms linear forwards`,
          strokeDashoffset: circ,
        }}
      />
    </svg>
  );
}

// ── SkeletonExercise ──────────────────────────────────────────────────────────

function SkeletonExercise() {
  return (
    <div className="space-y-3 animate-pulse p-4">
      <div className="h-4 rounded w-3/4" style={{ backgroundColor: "var(--line-divider)" }} />
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-9 rounded-lg" style={{ backgroundColor: "var(--line-divider)" }} />
        ))}
      </div>
    </div>
  );
}

// ── PracticeSession ───────────────────────────────────────────────────────────

const AUTO_ADVANCE_MS = 1500;
const PREFETCH_WHEN_REMAINING = 1;
const PREFETCH_COUNT = 2;

interface Props {
  initialExercises: ToolCall[];
  onAnswer: (callId: string, result: ExerciseResult) => void;
}

export default function PracticeSession({ initialExercises, onAnswer }: Props) {
  const [exercises, setExercises] = useState<SessionExercise[]>(() =>
    initialExercises.map(tc => ({ id: tc.id, toolCall: tc, status: "idle", result: null }))
  );
  const [current, setCurrent] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const [slideDir, setSlideDir] = useState<"R" | "L">("R");

  const promptIndexRef = useRef(initialExercises.length);
  const fetchingRef = useRef(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fetch when buffer runs low
  useEffect(() => {
    const remaining = exercises.length - 1 - current;
    if (remaining <= PREFETCH_WHEN_REMAINING && !fetchingRef.current) {
      fetchingRef.current = true;
      const count = PREFETCH_COUNT;
      const fetches = Array.from({ length: count }, (_, i) =>
        fetchExerciseCard(cycleExercisePrompt(promptIndexRef.current + i))
      );
      promptIndexRef.current += count;
      Promise.all(fetches).then(results => {
        const valid = results.filter((tc): tc is ToolCall => tc !== null);
        setExercises(prev => [
          ...prev,
          ...valid.map(tc => ({ id: tc.id, toolCall: tc, status: "idle" as ExStatus, result: null })),
        ]);
      }).finally(() => { fetchingRef.current = false; });
    }
  }, [current, exercises.length]);

  const goTo = useCallback((target: number) => {
    if (target < 0) return;
    setExercises(prev => {
      if (target >= prev.length) return prev;
      return prev.map((ex, i) =>
        i < target && ex.status === "idle" ? { ...ex, status: "reviewing" } : ex
      );
    });
    setSlideDir(target > current ? "R" : "L");
    setSlideKey(k => k + 1);
    setCurrent(target);
  }, [current]);

  const handleAnswer = useCallback((exerciseId: string, callId: string, result: ExerciseResult) => {
    onAnswer(callId, result);
    const status: ExStatus = result.correct ? "correct" : "incorrect";
    setExercises(prev =>
      prev.map(ex => ex.id === exerciseId ? { ...ex, status, result } : ex)
    );
    if (result.correct) {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      autoTimerRef.current = setTimeout(() => goTo(current + 1), AUTO_ADVANCE_MS);
    }
  }, [current, goTo, onAnswer]);

  const handleNext = useCallback(() => {
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
    goTo(current + 1);
  }, [current, goTo]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current); }, []);

  const ex = exercises[current];
  const nextEx = exercises[current + 1];

  if (!ex) return null;

  const topic = (ex.toolCall.args as Record<string, unknown>)?.topic as string | undefined;
  const isFirst = current === 0;
  const isAnswered = ex.status !== "idle";
  const showRing = ex.status === "correct";
  // Cap visible dots at 7
  const dotCount = Math.min(exercises.length, 7);

  return (
    <>
      <style>{`
        @keyframes practiceSlideInR {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes practiceSlideInL {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes practiceRingDrain {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: 50.27; }
        }
      `}</style>

      <div className="rounded-xl bg-surface-raised shadow-md overflow-hidden w-full">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-100">
          <span className="text-xs font-semibold flex-1 text-primary">
            {exerciseLabel(ex.toolCall.name)}
          </span>
          <span className="text-xs text-fg-subtle tabular-nums">{current + 1} / {exercises.length}</span>
          {topic && (
            <span className="text-xs px-3 py-0.5 rounded-full font-medium bg-primary-soft text-primary">
              {formatTopic(topic)}
            </span>
          )}
        </div>

        {/* Slide area */}
        <div
          key={`${ex.id}-${slideKey}`}
          className="px-4 py-3"
          style={{ animation: `practiceSlideIn${slideDir} 300ms ease-in-out` }}
        >
          <ToolWidget
            toolCall={ex.toolCall}
            onAnswer={(callId, result) => handleAnswer(ex.id, callId, result)}
            onNext={handleNext}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-sunken">
          {/* Back */}
          <button
            onClick={() => goTo(current - 1)}
            disabled={isFirst}
            className="text-sm px-2.5 py-1 rounded-lg bg-surface-raised transition-opacity disabled:opacity-25 text-fg-muted"
          >
            ←
          </button>

          {/* Dots */}
          <div className="flex-1 flex items-center justify-center gap-1.5">
            {Array.from({ length: dotCount }, (_, i) => {
              const exIndex = i < 6 ? i : exercises.length - 1;
              const isPast = exIndex < current;
              const isCurrent = exIndex === current;
              return (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: isCurrent ? 18 : 6,
                    height: 6,
                    backgroundColor: isCurrent
                      ? "var(--primary)"
                      : isPast
                      ? "var(--primary-300)"
                      : "var(--border-default)",
                  }}
                />
              );
            })}
            {!nextEx && current < exercises.length - 1 && (
              <div
                className="rounded-full animate-pulse"
                style={{ width: 6, height: 6, backgroundColor: "var(--border-default)" }}
              />
            )}
          </div>

          {/* Check / Next */}
          <button
            onClick={isAnswered ? handleNext : undefined}
            disabled={!isAnswered}
            className="relative text-xs font-medium px-3 py-1.5 rounded-lg transition-all overflow-hidden disabled:opacity-35"
            style={{
              backgroundColor: isAnswered ? "var(--primary)" : "var(--surface-raised)",
              color: isAnswered ? "var(--on-primary)" : "var(--text-secondary)",
              minWidth: 76,
            }}
          >
            {isAnswered ? "Next →" : "Check →"}
            {showRing && <ProgressRing durationMs={AUTO_ADVANCE_MS} />}
          </button>
        </div>
      </div>
    </>
  );
}
