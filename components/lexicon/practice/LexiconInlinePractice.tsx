"use client";

import { useCallback, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import PracticeSession from "@/components/practice/PracticeSession";
import { LexiconReviewPhase } from "@/components/lexicon/practice/LexiconReviewPhase";
import { LexiconReviewSummary } from "@/components/lexicon/practice/LexiconReviewSummary";
import { useLexiconPracticeSession } from "@/hooks/useLexiconPracticeSession";
import Button from "@/components/ui/Button";

interface LexiconInlinePracticeProps {
  categoryId: string;
  onExit: () => void;
}

export function LexiconInlinePractice({ categoryId, onExit }: LexiconInlinePracticeProps) {
  const { user } = useAuth();
  const {
    lessonName,
    allEntries,
    posMap,
    loadState,
    error,
    flowPhase,
    ratings,
    practiceExercises,
    sessionKey,
    setFlowPhase,
    handleReviewComplete,
    reload,
    clear,
  } = useLexiconPracticeSession(categoryId, user?.id);

  const handleFinish = useCallback(() => {
    clear();
    onExit();
  }, [clear, onExit]);

  // Handle Esc key to return to decks
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handleFinish();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFinish]);

  const handleSessionComplete = useCallback(async () => {
    if (!user) return;
    clear();
    setFlowPhase("done");
    onExit();
  }, [user, clear, setFlowPhase, onExit]);

  if (loadState === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-6 rounded-2xl bg-surface-raised border border-border-subtle">
        <p className="text-error text-body-sm font-medium">{error ?? "No se pudo preparar la sesión de tarjetas"}</p>
        <Button type="button" onClick={reload} variant="primary" size="sm">
          Reintentar
        </Button>
      </div>
    );
  }

  if (loadState !== "ready") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center rounded-2xl bg-surface-raised border border-border-subtle">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-fg-subtle text-body-sm animate-pulse">Cargando mazo de tarjetas Anki…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle/60">
        <button
          type="button"
          onClick={handleFinish}
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-fg-muted hover:text-fg transition-colors focus-ring rounded-lg p-1.5"
          title="Volver a la lista de mazos (Esc)"
        >
          <span aria-hidden>←</span>
          <span>Volver a Mazos Anki</span>
          <span className="font-mono text-tiny text-fg-subtle ml-1">(Esc)</span>
        </button>

        <div className="flex flex-col items-center text-center truncate max-w-xs">
          <span className="font-kicker text-fg-subtle">Mazo Anki</span>
          <span className="text-body-sm font-bold text-fg truncate">{lessonName}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-caption font-mono text-fg-subtle">
            {flowPhase === "review" && `${allEntries.length} tarjetas · Paso 1`}
            {flowPhase === "summary" && "Paso 2: Resumen"}
            {flowPhase === "practice" && "Paso 3: Contexto"}
          </span>
        </div>
      </div>

      {flowPhase === "review" && (
        <LexiconReviewPhase
          entries={allEntries}
          posMap={posMap}
          userId={user?.id ?? ""}
          onComplete={handleReviewComplete}
        />
      )}

      {flowPhase === "summary" && (
        <div className="flex w-full items-center justify-center py-6">
          <LexiconReviewSummary
            ratings={ratings}
            onStartExercises={() => setFlowPhase("practice")}
            onFinish={handleFinish}
          />
        </div>
      )}

      {flowPhase === "practice" && (
        <PracticeSession
          key={sessionKey}
          context="practice"
          exercises={practiceExercises}
          sessionLength={Math.min(10, practiceExercises.length)}
          sessionLabel={lessonName.length > 22 ? `${lessonName.slice(0, 20).trim()}…` : lessonName}
          onSessionComplete={handleSessionComplete}
          onExit={handleFinish}
        />
      )}
    </div>
  );
}
