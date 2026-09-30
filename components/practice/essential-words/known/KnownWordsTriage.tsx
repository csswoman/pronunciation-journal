"use client";

// Planned structure:
// <KnownWordsTriage>
//   <TriageHeaderBar />
//   <TriageProgressBar />
//   <TriageLevelPicker />
//   <TriageMainContent />
// </KnownWordsTriage>

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2 } from "@/components/icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { useKnownWordsTriage } from "@/hooks/useKnownWordsTriage";
import type { CefrLevel } from "@/lib/essential-words/types";
import { TriageLevelPicker } from "./TriageLevelPicker";
import { TriageDeck } from "./TriageDeck";
import { TriageSummary } from "./TriageSummary";

const DEFAULT_LEVELS: CefrLevel[] = ["A1", "A2"];

export function KnownWordsTriage() {
  const { user } = useAuth();
  const [selectedLevels, setSelectedLevels] = useState<CefrLevel[]>(DEFAULT_LEVELS);

  const {
    isLoading,
    isSaving,
    isCardLoading,
    loadError,
    error,
    cardError,
    current,
    nextWord,
    currentIndex,
    total,
    remaining,
    counts,
    canUndo,
    markKnown,
    skip,
    undoLast,
    retryLoad,
    retryCard,
  } = useKnownWordsTriage({
    levels: selectedLevels,
    userId: user?.id,
  });

  const handleToggleLevel = (level: CefrLevel) => {
    setSelectedLevels((prev) => {
      if (prev.includes(level)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((l) => l !== level);
      }
      return [...prev, level];
    });
  };

  const progressPercent = total > 0 ? Math.min(100, Math.round((currentIndex / total) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto py-2 sm:py-6 px-4">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/practice/essential-words"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-fg transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Volver a práctica</span>
        </Link>

        {total > 0 && remaining > 0 && (
          <span className="text-xs font-mono font-medium text-fg-muted">
            {currentIndex + 1} de {total}
          </span>
        )}
      </div>

      {/* Title & subtitle */}
      <div className="flex flex-col gap-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <Sparkles size={20} className="text-primary" />
          <h1 className="text-h2 font-extrabold text-fg tracking-tight m-0">
            Triage de vocabulario
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-fg-muted m-0">
          Marca las palabras familiares; una muestra se verificará en una sesión de práctica.
        </p>
      </div>

      {/* Level picker */}
      <TriageLevelPicker
        selectedLevels={selectedLevels}
        onToggleLevel={handleToggleLevel}
        disabled={isLoading || isSaving}
      />

      {/* Progress bar */}
      {total > 0 && remaining > 0 && (
        <div
          className="w-full h-1.5 rounded-full bg-surface-sunken overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-primary transition-all duration-200 motion-reduce:transition-none"
          />
        </div>
      )}

      {/* Main card or summary */}
      {loadError ? (
        <div role="alert" className="flex flex-col items-center gap-4 rounded-xl border border-error/30 bg-error/10 p-6 text-center text-error">
          <p className="text-sm font-semibold m-0">{loadError}</p>
          <button type="button" onClick={retryLoad} className="rounded-lg border border-current px-4 py-2 text-sm font-semibold">
            Reintentar
          </button>
        </div>
      ) : isLoading || isCardLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[360px] gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="text-sm font-medium text-fg-muted">
            {isCardLoading ? "Cargando palabra..." : "Cargando palabras..."}
          </span>
        </div>
      ) : remaining === 0 && total > 0 ? (
        <TriageSummary
          counts={counts}
          onResetOrChangeLevels={() => setSelectedLevels(DEFAULT_LEVELS)}
        />
      ) : total === 0 ? (
        <div className="p-8 rounded-3xl bg-surface-raised border border-border-default text-center flex flex-col items-center gap-3">
          <p className="text-base font-semibold text-fg m-0">
            No hay palabras nuevas para clasificar
          </p>
          <p className="text-xs sm:text-sm text-fg-muted m-0 max-w-sm">
            No encontramos más palabras pendientes de los niveles seleccionados ({selectedLevels.join(", ")}).
          </p>
          <div className="pt-2">
            <Link
              href="/practice/essential-words"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Ir a practicar
            </Link>
          </div>
        </div>
      ) : current ? (
        <>
          {error && <p role="alert" className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">{error}</p>}
          <TriageDeck
            currentWord={current}
            nextWord={nextWord}
            onKnown={markKnown}
            onSkip={skip}
            onUndo={undoLast}
            canUndo={canUndo}
            disabled={isSaving}
          />
        </>
      ) : cardError ? (
        <div role="alert" className="flex flex-col items-center gap-4 rounded-xl border border-error/30 bg-error/10 p-6 text-center text-error">
          <p className="text-sm font-semibold m-0">{cardError}</p>
          <button type="button" onClick={retryCard} className="rounded-lg border border-current px-4 py-2 text-sm font-semibold">
            Reintentar carga
          </button>
        </div>
      ) : null}
    </div>
  );
}
