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

  // Adapta la escala tipográfica si la frase es larga o tiene muchas palabras
  const isLongPhrase = phrase.length > 32 || words.length > 5;

  return (
    <PastelCard
      tone="butter"
      className="relative p-4 sm:p-5 md:p-6 flex flex-col items-center text-center overflow-hidden rounded-3xl gap-2.5 sm:gap-3.5 shadow-xs max-w-full"
    >
      {/* Comillas decorativas superiores */}
      <svg
        className="absolute top-3 left-3 sm:top-4 sm:left-5 w-8 h-8 sm:w-10 sm:h-10 text-[var(--ink)] opacity-15 pointer-events-none select-none"
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

      {/* Kicker superior en DM Mono con tracking tipográfico técnico */}
      <p className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ink-secondary)] opacity-75">
        FRASE PARA PRACTICAR
      </p>

      {/* Contenedor de palabras en Bricolage Grotesque / DM Sans Display */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 my-0.5 max-w-2xl">
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
                  ? "bg-white/95 text-[var(--ink)] shadow-xs rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 border border-[color-mix(in_oklch,var(--ink)_10%,transparent)] hover:bg-white"
                  : "bg-transparent text-[var(--ink)] px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-xl hover:bg-white/30"
              }`}
              aria-label={`Escuchar ${cleanWord}`}
            >
              {/* Palabra principal en font-display */}
              <span
                className={`font-display font-extrabold tracking-[-0.03em] leading-tight text-[var(--ink)] group-hover:text-[var(--ink-secondary)] transition-colors ${
                  isLongPhrase
                    ? "text-xl sm:text-2xl md:text-3xl"
                    : "text-2xl sm:text-3xl md:text-4xl"
                }`}
              >
                {rawWord}
              </span>

              {/* Notación fonética IPA límpida en Andika (font-ipa) */}
              {ipaLoading ? (
                <span className="h-4 flex items-center justify-center mt-0.5 sm:mt-1">
                  <Loader2 size={11} className="animate-spin text-[var(--ink-muted)]" />
                </span>
              ) : ipaText ? (
                <span
                  lang="en-fonipa"
                  className={`font-ipa text-[11px] sm:text-xs font-normal tracking-wide mt-0.5 sm:mt-1 transition-colors ${
                    hasAnalysis && hasError
                      ? "text-rose-700 font-semibold"
                      : allCorrect
                      ? "text-emerald-800 font-semibold"
                      : "text-[var(--ink-secondary)] opacity-80"
                  }`}
                >
                  {ipaText}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Subtítulo de traducción nítido en DM Sans */}
      <p className="text-xs sm:text-sm md:text-base font-sans font-medium text-[var(--ink-secondary)] max-w-xl leading-snug">
        {meta.spanish}
      </p>

      {/* Feedback de análisis si es perfecto */}
      {hasAnalysis && !hasMistakes && !analyzing && (
        <div className="flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/95 border border-emerald-600/30 shadow-2xs">
          <PartyPopper size={14} className="text-emerald-700 shrink-0" />
          <p className="text-xs sm:text-sm font-bold text-emerald-800">¡Excelente pronunciación!</p>
        </div>
      )}

      {/* Botones de acción de audio en DM Sans / DM Mono */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mt-0.5 sm:mt-1">
        <button
          type="button"
          onClick={onListen}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] text-white px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold hover:opacity-90 transition active:scale-95 cursor-pointer shadow-sm border-none min-h-[38px] sm:min-h-[42px]"
        >
          <Play size={13} fill="currentColor" />
          <span>Escuchar</span>
        </button>

        <button
          type="button"
          onClick={onSlow}
          className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklch,var(--ink)_16%,transparent)] bg-white/85 text-[var(--ink)] px-3.5 py-2 sm:px-4 sm:py-2.5 font-mono text-xs sm:text-sm font-semibold hover:bg-white transition active:scale-95 cursor-pointer shadow-2xs min-h-[38px] sm:min-h-[42px]"
        >
          <span>0.5×</span>
        </button>

        <button
          type="button"
          onClick={onRepeat ?? onListen}
          className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--ink)_16%,transparent)] bg-white/85 text-[var(--ink)] px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold hover:bg-white transition active:scale-95 cursor-pointer shadow-2xs min-h-[38px] sm:min-h-[42px]"
        >
          <RotateCcw size={13} strokeWidth={2.2} />
          <span>Repetir</span>
        </button>
      </div>
    </PastelCard>
  );
}

