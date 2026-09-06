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
import { Check, Sparkles } from "@/components/icons";
import Button from "@/components/ui/Button";
import ToolWidget from "./chat/ToolWidget";

type ExStatus = "idle" | "correct" | "incorrect" | "reviewing";
interface SessionExercise { id: string; toolCall: ToolCall; status: ExStatus; result: ExerciseResult | null; }

function formatTopic(topic: string) {
  const label = topic.includes(":") ? topic.split(":").pop()! : topic;
  return label.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function exerciseLabel(name: string) {
  switch (name) {
    case "render_multiple_choice": return "Opción múltiple";
    case "render_fill_blank":      return "Completar el espacio";
    case "render_word_card":       return "Vocabulario";
    case "render_speaking":        return "Expresión oral";
    default: return "Ejercicio";
  }
}

function SessionHeader({ title, current, total }: { title: string; current: number; total: number }) {
  return (
    <div className="relative flex items-center justify-center px-4 py-3 bg-[oklch(0.18_0.008_var(--hue))]">
      <span className="text-body-sm font-semibold text-[oklch(0.96_0.008_var(--hue))]">{title}</span>
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xxs font-bold px-2.5 py-1 rounded-full bg-[var(--primary)] text-[var(--on-primary)] tabular-nums">
        EJERCICIO {current} DE {total}
      </span>
    </div>
  );
}

function SessionProgress({ current, total, dotCount, hasNextPending }: {
  current: number; total: number; dotCount: number; hasNextPending: boolean;
}) {
  const pct = total > 1 ? Math.round((current / (total - 1)) * 100) : 0;
  return (
    <div className="px-[var(--layout-card-pad)] pt-4 pb-2 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-kicker font-semibold text-[var(--text-tertiary)]">Progreso</span>
        <span className="text-xxs font-semibold tabular-nums text-[var(--text-tertiary)]">{pct}%</span>
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
              className={`rounded-full transition-all duration-300 ${isCurrent ? "w-5" : "w-2"}`}
              style={{
                height: 6,
                backgroundColor: isCurrent ? "var(--primary)" : isPast ? "var(--primary-300)" : "var(--border-default)",
              }}
            />
          );
        })}
        {hasNextPending && (
          <div className="w-2 h-2 rounded-full animate-pulse bg-[var(--border-default)]" />
        )}
      </div>
    </div>
  );
}

const AUTO_ADVANCE_MS = 1500;

export interface ExerciseSessionSummary {
  total: number;
  correct: number;
}

interface Props {
  initialExercises: ToolCall[];
  onAnswer: (callId: string, result: ExerciseResult) => void;
  onComplete?: (summary: ExerciseSessionSummary) => void;
}

export default function PracticeSession({ initialExercises, onAnswer, onComplete }: Props) {
  const [exercises, setExercises] = useState<SessionExercise[]>(() =>
    initialExercises.map(tc => ({ id: tc.id, toolCall: tc, status: "idle", result: null }))
  );
  const [current, setCurrent]   = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const [slideDir, setSlideDir] = useState<"R" | "L">("R");
  const [completedSent, setCompletedSent] = useState(false);

  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    let toolName: string | undefined;
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      toolName = ex.toolCall.name;
      return { ...ex, status, result };
    }));
    if (result.correct && toolName !== "render_speaking") {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      autoTimerRef.current = setTimeout(() => goTo(current + 1), AUTO_ADVANCE_MS);
    }
  }, [current, goTo, onAnswer]);

  const handleNext = useCallback(() => {
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
    goTo(current + 1);
  }, [current, goTo]);

  useEffect(() => () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current); }, []);

  const ex = exercises[current];
  const nextEx = exercises[current + 1];
  const isFinished = current >= exercises.length;

  if (isFinished) {
    const total = exercises.length;
    const correctCount = exercises.filter(e => e.status === "correct" || e.result?.correct).length;
    const isAllCorrect = correctCount === total;

    const handleContinue = () => {
      setCompletedSent(true);
      onComplete?.({ total, correct: correctCount });
    };

    return (
      <div className="layout-stack w-full rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary shadow-xs">
            <Sparkles size={16} strokeWidth={2.2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-caption font-semibold text-fg">¡Práctica finalizada!</p>
            <p className="m-0 text-tiny font-medium text-fg-muted">
              {correctCount} de {total} ejercicio{total > 1 ? "s" : ""} correcto{total > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <p className="m-0 text-body-sm text-fg-secondary">
          {isAllCorrect
            ? "¡Excelente trabajo! Has completado la práctica con éxito."
            : "¡Buen intento! Continúa practicando para afianzar estos conceptos."}
        </p>

        <Button
          variant={completedSent ? "secondary" : "primary"}
          size="sm"
          disabled={completedSent}
          onClick={handleContinue}
          className="mt-1 w-full justify-center"
        >
          {completedSent ? (
            <>
              <Check size={14} strokeWidth={2.25} aria-hidden />
              Conversación continuada
            </>
          ) : (
            "Continuar con el Coach"
          )}
        </Button>
      </div>
    );
  }

  const topic    = (ex.toolCall.args as Record<string, unknown>)?.topic as string | undefined;
  const dotCount = Math.min(exercises.length, 7);
  const title    = topic ? formatTopic(topic) : exerciseLabel(ex.toolCall.name);

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
          className="px-[var(--layout-card-pad)] py-4"
          style={{ animation: `practiceSlideIn${slideDir} 300ms ease-in-out` }}
        >
          <ToolWidget
            toolCall={ex.toolCall}
            onAnswer={(callId, result) => handleAnswer(ex.id, callId, result)}
            onNext={handleNext}
          />
        </div>
      </div>
    </>
  );
}
