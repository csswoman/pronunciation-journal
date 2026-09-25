"use client";

import { Loader2, Play, PartyPopper, RotateCcw } from "@/components/icons";
import PastelCard from "@/components/layout/PastelCard";
import { getPhraseMetadata } from "@/lib/ai-coach/phrase-metadata";
import type { WordIPA } from "./types";

// Planned structure:
// <PhraseCard>
//   <PastelCard tone="butter">
//     <DecorativeQuote />
//     <Kicker />
//     <WordCluster>
//       <WordItem />
//     </WordCluster>
//     <PhraseTranslationSubtitle />
//     <AudioControlsRow />
//   </PastelCard>
// </PhraseCard>

interface Props {
  phrase: string;
  wordIPAs: WordIPA[];
  ipaLoading: boolean;
  analyzing: boolean;
  hasAnalysis: boolean;
  hasMistakes: boolean;
  onListen: () => void;
  onSlow: () => void;
  onListenWord: (word: string) => void;
  onRepeat?: () => void;
}

export default function PhraseCard({
  phrase,
  wordIPAs,
  ipaLoading,
  analyzing,
  hasAnalysis,
  hasMistakes,
  onListen,
  onSlow,
  onListenWord,
  onRepeat,
}: Props) {
  const meta = getPhraseMetadata(phrase);
  const words = phrase.split(/\s+/).filter(Boolean);
  const focusWordsSet = new Set((meta.focusWords ?? []).map((w) => w.toLowerCase()));

  return (
    <PastelCard
      tone="butter"
      className="relative p-6 sm:p-8 md:p-9 flex flex-col items-center text-center overflow-hidden rounded-3xl gap-4 sm:gap-5 shadow-xs"
    >
      {/* Comillas decorativas gigantes superiores con aire holgado */}
      <svg
        className="absolute top-5 left-5 sm:top-6 sm:left-7 w-11 h-11 sm:w-14 sm:h-14 text-[var(--ink)] opacity-15 pointer-events-none select-none"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M8 26C8 17.1634 14.1634 11 23 11V16C17.4772 16 13 20.4772 13 26H23V39H8V26Z"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d="M27 26C27 17.1634 33.1634 11 42 11V16C36.4772 16 32 20.4772 32 26H42V39H27V26Z"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      </svg>

      {/* Kicker superior con tracking tipográfico abierto */}
      <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--ink-secondary)] opacity-80 mb-1 sm:mb-2">
        FRASE PARA PRACTICAR
      </p>

      {/* Contenedor de palabras en Bricolage Grotesque con amplio espacio */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 my-2 max-w-2xl">
        {words.map((rawWord, index) => {
          const cleanWord = rawWord.replace(/[^a-zA-Z']/g, "");
          const cleanLower = cleanWord.toLowerCase();
          const ipaEntry = wordIPAs.find(
            (item) => item.word.replace(/[^a-zA-Z']/g, "").toLowerCase() === cleanLower
          ) ?? wordIPAs[index];

          const isFocus = focusWordsSet.has(cleanLower);
          const hasError = ipaEntry?.alignment?.some((a) => a.status !== "correct");
          const allCorrect = hasAnalysis && ipaEntry?.alignment?.every((a) => a.status === "correct");

          const ipaText = ipaEntry?.ipa ? `/${ipaEntry.ipa}/` : "";

          return (
            <button
              key={`${rawWord}-${index}`}
              type="button"
              onClick={() => onListenWord(cleanWord)}
              className={`group flex flex-col items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 border-none ${
                isFocus
                  ? "bg-white/95 text-[var(--ink)] shadow-xs rounded-2xl px-4 py-2 sm:px-5 sm:py-2.5 border border-[color-mix(in_oklch,var(--ink)_10%,transparent)] hover:bg-white"
                  : "bg-transparent text-[var(--ink)] px-2 py-1.5 rounded-xl hover:bg-white/40"
              }`}
              aria-label={`Escuchar ${cleanWord}`}
            >
              <span className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] leading-tight text-[var(--ink)] group-hover:text-[var(--ink-secondary)] transition-colors">
                {rawWord}
              </span>
              {ipaLoading ? (
                <span className="h-4 flex items-center justify-center mt-1">
                  <Loader2 size={11} className="animate-spin text-[var(--ink-muted)]" />
                </span>
              ) : ipaText ? (
                <span
                  className={`text-xs sm:text-sm font-ipa font-normal tracking-wide mt-1 transition-colors ${
                    hasAnalysis && hasError
                      ? "text-rose-700 font-semibold"
                      : allCorrect
                      ? "text-emerald-800 font-semibold"
                      : "text-[var(--ink-secondary)]"
                  }`}
                >
                  {ipaText}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Subtítulo de traducción con respiración y claridad */}
      <p className="text-sm sm:text-base text-[var(--ink-secondary)] max-w-xl leading-relaxed font-medium mt-1 mb-1">
        {meta.spanish} · Toca una palabra para escucharla.
      </p>

      {/* Feedback de análisis si es perfecto */}
      {hasAnalysis && !hasMistakes && !analyzing && (
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-emerald-600/30 shadow-2xs">
          <PartyPopper size={15} className="text-emerald-700" />
          <p className="text-xs sm:text-sm font-bold text-emerald-800">¡Excelente pronunciación!</p>
        </div>
      )}

      {/* Botones de acción de audio con proporciones cómodas */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap mt-2">
        <button
          type="button"
          onClick={onListen}
          className="inline-flex items-center gap-2.5 rounded-full bg-[var(--ink)] text-white px-6 py-3 text-sm sm:text-base font-semibold hover:opacity-90 transition active:scale-95 cursor-pointer shadow-sm border-none"
        >
          <Play size={13} fill="currentColor" />
          <span>Escuchar</span>
        </button>

        <button
          type="button"
          onClick={onSlow}
          className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklch,var(--ink)_16%,transparent)] bg-white/85 text-[var(--ink)] px-5 py-3 text-sm sm:text-base font-semibold hover:bg-white transition active:scale-95 cursor-pointer shadow-2xs"
        >
          <span>0.5×</span>
        </button>

        <button
          type="button"
          onClick={onRepeat ?? onListen}
          className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklch,var(--ink)_16%,transparent)] bg-white/85 text-[var(--ink)] px-5 py-3 text-sm sm:text-base font-semibold hover:bg-white transition active:scale-95 cursor-pointer shadow-2xs"
        >
          <RotateCcw size={14} strokeWidth={2.2} />
          <span>Repetir</span>
        </button>
      </div>
    </PastelCard>
  );
}
