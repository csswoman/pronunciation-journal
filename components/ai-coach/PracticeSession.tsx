"use client";

// Planned structure:
// <PracticeSession>
//   <SessionHeader />    — dark bar: title + exercise counter pill
//   <SessionProgress />  — progress bar + dots
//   <SlideArea />        — animated exercise content
//   <SessionFooter />    — full-width Check / Skip buttons
// </PracticeSession>

import { useState, useEffect, useRef, useCallback } from "react";
import type { ToolCall, ExerciseResult } from "@/lib/ai-practice/types";
import { fetchExerciseCard, cycleExercisePrompt } from "@/lib/ai-practice/fetch-card";
import ToolWidget from "./chat/ToolWidget";

type ExStatus = "idle" | "correct" | "incorrect" | "reviewing";
interface SessionExercise { id: string; toolCall: ToolCall; status: ExStatus; result: ExerciseResult | null; }

function formatTopic(topic: string) {
  const label = topic.includes(":") ? topic.split(":").pop()! : topic;
  return label.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function exerciseLabel(name: string) {
  switch (name) {
    case "render_multiple_choice": return "Multiple Choice";
    case "render_fill_blank":      return "Fill in the Blank";
    case "render_word_card":       return "Vocabulary";
    case "render_speaking":        return "Speaking";
    default: return "Exercise";
  }
}

function SessionHeader({ title, current, total }: { title: string; current: number; total: number }) {
  return (
    <div className="relative flex items-center justify-center px-4 py-3 bg-[oklch(0.18_0.008_var(--hue))]">
      <span className="text-sm font-semibold text-[oklch(0.96_0.008_var(--hue))]">{title}</span>
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--primary)] text-[var(--on-primary)] tabular-nums">
        EXERCISE {current} OF {total}
      </span>
    </div>
  );
}

function SessionProgress({ current, total, dotCount, hasNextPending }: {
  current: number; total: number; dotCount: number; hasNextPending: boolean;
}) {
  const pct = total > 1 ? Math.round((current / (total - 1)) * 100) : 0;
  return (
    <div className="px-6 pt-4 pb-2 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest text-[var(--text-tertiary)] uppercase">Progress</span>
        <span className="text-[10px] font-semibold tabular-nums text-[var(--text-tertiary)]">{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-[var(--border-subtle)] overflow-hidden">
        <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {Array.from({ length: dotCount }, (_, i) => {
          const exIndex   = i < dotCount - 1 ? i : total - 1;
          const isPast    = exIndex < current;
          const isCurrent = exIndex === current;
          return (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: isCurrent ? 18 : 6,
                height: 6,
                backgroundColor: isCurrent ? "var(--primary)" : isPast ? "var(--primary-300)" : "var(--border-default)",
              }}
            />
          );
        })}
        {hasNextPending && (
          <div className="rounded-full animate-pulse" style={{ width: 6, height: 6, backgroundColor: "var(--border-default)" }} />
        )}
      </div>
    </div>
  );
}

function SessionFooter({ isAnswered, onCheck, onSkip }: { isAnswered: boolean; onCheck: () => void; onSkip: () => void }) {
  return (
    <div className="px-6 pb-6 pt-2 space-y-2">
      <button
        onClick={onCheck}
        disabled={!isAnswered}
        className="w-full py-3.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40"
        style={{
          backgroundColor: isAnswered ? "var(--primary)" : "var(--border-subtle)",
          color: isAnswered ? "var(--on-primary)" : "var(--text-tertiary)",
        }}
      >
        Check
      </button>
      <button
        onClick={onSkip}
        className="w-full py-2 text-xs font-semibold tracking-widest uppercase text-[var(--text-tertiary)] hover:opacity-70 transition-opacity"
      >
        Skip
      </button>
    </div>
  );
}

const AUTO_ADVANCE_MS         = 1500;
const PREFETCH_WHEN_REMAINING = 1;
const PREFETCH_COUNT          = 2;

interface Props { initialExercises: ToolCall[]; onAnswer: (callId: string, result: ExerciseResult) => void; }

export default function PracticeSession({ initialExercises, onAnswer }: Props) {
  const [exercises, setExercises] = useState<SessionExercise[]>(() =>
    initialExercises.map(tc => ({ id: tc.id, toolCall: tc, status: "idle", result: null }))
  );
  const [current, setCurrent]   = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const [slideDir, setSlideDir] = useState<"R" | "L">("R");

  const promptIndexRef = useRef(initialExercises.length);
  const fetchingRef    = useRef(false);
  const autoTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const remaining = exercises.length - 1 - current;
    if (remaining <= PREFETCH_WHEN_REMAINING && !fetchingRef.current) {
      fetchingRef.current = true;
      const fetches = Array.from({ length: PREFETCH_COUNT }, (_, i) =>
        fetchExerciseCard(cycleExercisePrompt(promptIndexRef.current + i))
      );
      promptIndexRef.current += PREFETCH_COUNT;
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
      return prev.map((ex, i) => i < target && ex.status === "idle" ? { ...ex, status: "reviewing" } : ex);
    });
    setSlideDir(target > current ? "R" : "L");
    setSlideKey(k => k + 1);
    setCurrent(target);
  }, [current]);

  const handleAnswer = useCallback((exerciseId: string, callId: string, result: ExerciseResult) => {
    onAnswer(callId, result);
    const status: ExStatus = result.correct ? "correct" : "incorrect";
    setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, status, result } : ex));
    if (result.correct) {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      autoTimerRef.current = setTimeout(() => goTo(current + 1), AUTO_ADVANCE_MS);
    }
  }, [current, goTo, onAnswer]);

  const handleNext = useCallback(() => {
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
    goTo(current + 1);
  }, [current, goTo]);

  useEffect(() => () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current); }, []);

  const ex     = exercises[current];
  const nextEx = exercises[current + 1];

  if (!ex) return null;

  const topic      = (ex.toolCall.args as Record<string, unknown>)?.topic as string | undefined;
  const isAnswered = ex.status !== "idle";
  const dotCount   = Math.min(exercises.length, 7);
  const title      = topic ? formatTopic(topic) : exerciseLabel(ex.toolCall.name);

  return (
    <>
      <style>{`
        @keyframes practiceSlideInR { from { opacity:0; transform:translateX(32px); } to { opacity:1; transform:translateX(0); } }
        @keyframes practiceSlideInL { from { opacity:0; transform:translateX(-32px); } to { opacity:1; transform:translateX(0); } }
      `}</style>
      <div className="rounded-xl overflow-hidden w-full bg-[var(--surface-raised)] shadow-md">
        <SessionHeader title={title} current={current + 1} total={exercises.length} />
        <SessionProgress
          current={current}
          total={exercises.length}
          dotCount={dotCount}
          hasNextPending={!nextEx && current < exercises.length - 1}
        />
        <div
          key={`${ex.id}-${slideKey}`}
          className="px-6 py-2"
          style={{ animation: `practiceSlideIn${slideDir} 300ms ease-in-out` }}
        >
          <ToolWidget
            toolCall={ex.toolCall}
            onAnswer={(callId, result) => handleAnswer(ex.id, callId, result)}
            onNext={handleNext}
          />
        </div>
        <SessionFooter isAnswered={isAnswered} onCheck={handleNext} onSkip={handleNext} />
      </div>
    </>
  );
}
