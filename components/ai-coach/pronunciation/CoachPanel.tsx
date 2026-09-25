"use client";

import { useState } from "react";
import { Volume2, BookmarkPlus, Check } from "@/components/icons";
import PastelCard from "@/components/layout/PastelCard";
import { RemediationSequence } from "@/components/pronunciation-feedback/RemediationSequence";
import { isActionablePronunciationFeedbackCopyEnabled } from "@/lib/pronunciation/feedback/copy-flag";

// Planned structure:
// <CoachPanel>
//   <PastelCard tone="lilac">
//     <PhoneticIconContainer />
//     <PhoneticTipContent>
//       <TipTitle />
//       <TipDescription />
//       <OptionalRemediationControls />
//     </PhoneticTipContent>
//   </PastelCard>
// </CoachPanel>

interface FocusPhoneme {
  word: string;
  phoneme: string;
  ipa: string;
}

interface FocusProgress {
  correct: number;
  total: number;
}

interface CoachPanelProps {
  focus?: FocusPhoneme | null;
  focusTip?: string | null;
  focusProgress?: FocusProgress | null;
  savedWords?: Set<string>;
  onListen: (word: string) => void;
  onSlow?: (word: string) => void;
  onSave?: (word: string) => void;
  onRetry?: () => void;
  tipTitle?: string;
  tipBody?: string;
}

export default function CoachPanel({
  focus,
  focusTip,
  savedWords = new Set(),
  onListen,
  onSlow,
  onSave,
  onRetry,
  tipTitle,
  tipBody,
}: CoachPanelProps) {
  const isSaved = focus ? savedWords.has(focus.word.toLowerCase()) : false;
  const [justSaved, setJustSaved] = useState(false);
  const feedbackCopyEnabled = isActionablePronunciationFeedbackCopyEnabled();

  const handleSave = () => {
    if (!focus || isSaved || !onSave) return;
    onSave(focus.word);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  const title = tipTitle ?? (feedbackCopyEnabled && focus ? `Ojo con /${focus.ipa}/` : focus ? `“${focus.word}”` : "Consejo de pronunciación");
  const description = tipBody ?? (feedbackCopyEnabled ? focusTip : null);

  return (
    <PastelCard
      tone="lilac"
      className="p-5 sm:p-6 md:p-7 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 shadow-xs"
    >
      {/* Icono de dientes/articulación fonética siempre blanco, amplio y legible */}
      <div
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white border border-[color-mix(in_oklch,var(--ink)_12%,transparent)] flex items-center justify-center shrink-0 shadow-2xs text-[var(--ink)]"
        aria-hidden="true"
      >
        <svg
          className="w-8 h-8"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="5" y="8" width="22" height="16" rx="8" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 16H27" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
          <path d="M10 10V22" stroke="currentColor" strokeWidth="1.2" />
          <path d="M16 9V23" stroke="currentColor" strokeWidth="1.4" />
          <path d="M22 10V22" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>

      {/* Contenido del tip con tipografía nítida y espaciado holgado */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold tracking-tight text-[var(--ink)] mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed font-medium">
                {description}
              </p>
            )}
          </div>

          {/* Acciones de guardar / escuchar si hay foco */}
          {focus && onSave && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                title="Listen to this sound"
                aria-label="Listen to this sound"
                onClick={() => onListen(focus.word)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border-none text-[var(--ink-secondary)] hover:bg-white/80 hover:text-[var(--ink)] cursor-pointer transition-colors shadow-2xs"
              >
                <Volume2 size={16} strokeWidth={2} aria-hidden />
              </button>
              <button
                type="button"
                title={isSaved ? "Saved" : "Save for practice"}
                aria-label={isSaved ? "Saved" : "Save for practice"}
                onClick={handleSave}
                disabled={isSaved}
                className="flex h-8 w-8 items-center justify-center rounded-xl border-none text-[var(--ink-secondary)] hover:bg-white/80 hover:text-[var(--ink)] cursor-pointer transition-colors disabled:opacity-60 shadow-2xs"
              >
                {isSaved ? (
                  <Check size={16} strokeWidth={2.2} className={justSaved ? "animate-bounce" : ""} aria-hidden />
                ) : (
                  <BookmarkPlus size={16} strokeWidth={2} aria-hidden />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Remediación interactiva si hay reintento activo */}
        {focus && onRetry && (
          <div className="mt-3.5 pt-3 border-t border-[color-mix(in_oklch,var(--ink)_14%,transparent)]">
            <RemediationSequence
              cue={feedbackCopyEnabled ? (focusTip ?? undefined) : undefined}
              onListen={() => onListen(focus.word)}
              onSlow={() => (onSlow ?? onListen)(focus.word)}
              onRetry={onRetry}
              compact
            />
          </div>
        )}
      </div>
    </PastelCard>
  );
}
