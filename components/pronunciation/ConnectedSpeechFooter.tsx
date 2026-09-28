"use client";

// Planned structure:
// <ConnectedSpeechFooter>
//   <PrevButton />
//   <KeyboardHint />
//   <ActionButtons />
// </ConnectedSpeechFooter>

import { ArrowLeft, ArrowRight, Mic } from "@/components/icons";

export function ConnectedSpeechFooter({
  isAnswered,
  trainerMode,
  hasPrev,
  onPrev,
  onNext,
  onCheckAnswer,
  onRevealAnswer,
  onSwitchToVoice,
}: {
  isAnswered: boolean;
  trainerMode: "unpacking" | "production";
  hasPrev: boolean;
  onPrev: () => void;
  onNext: () => void;
  onCheckAnswer: () => void;
  onRevealAnswer?: () => void;
  onSwitchToVoice: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-6">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer focus-ring shadow-2xs"
      >
        <ArrowLeft size={16} />
        <span>Anterior</span>
      </button>

      <div className="flex items-center gap-3 ml-auto">
        {trainerMode === "unpacking" && !isAnswered && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-2 hidden md:inline-block">
            Teclas 1–3 · Espacio para escuchar
          </span>
        )}

        {trainerMode === "unpacking" && !isAnswered && onRevealAnswer && (
          <button
            type="button"
            onClick={onRevealAnswer}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus-ring shadow-2xs"
          >
            No lo sé, ver la respuesta
          </button>
        )}

        {trainerMode === "unpacking" && isAnswered && (
          <button
            type="button"
            onClick={onSwitchToVoice}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus-ring shadow-2xs"
          >
            <Mic size={16} />
            <span>Practicarla en Voz</span>
          </button>
        )}

        {trainerMode === "unpacking" && !isAnswered ? (
          <button
            type="button"
            onClick={onCheckAnswer}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-accent-purple text-white font-heading font-extrabold text-base hover:opacity-90 shadow-md transition-all cursor-pointer focus-ring"
          >
            <span>Comprobar</span>
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-accent-purple text-white font-heading font-extrabold text-base hover:opacity-90 shadow-md transition-all cursor-pointer focus-ring"
          >
            <span>Siguiente frase</span>
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
