"use client";

import { Loader2, Play, PartyPopper, RotateCcw } from "@/components/icons";
import PastelCard from "@/components/layout/PastelCard";
import { getPhraseMetadata } from "@/lib/ai-coach/phrase-metadata";
import type { WordIPA } from "./types";
import { cn } from "@/lib/cn";

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

  // Adapta la escala tipográfica si la frase es muy larga (más de 38 caracteres o 6 palabras)
  const isLongPhrase = phrase.length > 38 || words.length > 6;

  return (
    <PastelCard
      tone="butter"
      className="relative p-4 @[24rem]:p-5 @[28rem]:p-6 flex flex-col items-center text-center overflow-hidden rounded-3xl gap-2.5 @[28rem]:gap-3.5 shadow-xs max-w-full"
    >
      {/* Comillas decorativas superiores */}
      <svg
        className="absolute top-3 left-3 @[28rem]:top-4 @[28rem]:left-5 size-8 @[28rem]:size-10 text-[var(--ink)] opacity-15 pointer-events-none select-none"
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
      <p className="font-mono text-xs @[28rem]:text-[13px] font-semibold tracking-[0.2em] uppercase text-[var(--ink-secondary)] opacity-85">
        FRASE PARA PRACTICAR
      </p>

      {/* Contenedor de palabras en Bricolage Grotesque / DM Sans Display */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 @[24rem]:gap-2 @[28rem]:gap-3 my-1 max-w-2xl">
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
              className="group flex flex-col items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 border-none bg-transparent px-1.5 py-0.5 rounded-lg hover:bg-white/25"
              aria-label={`Escuchar ${cleanWord}`}
            >
              {/* Palabra principal con subrayado estilo hero landing si es de enfoque */}
              <span
                className={cn(
                  "font-display font-extrabold tracking-[-0.03em] leading-tight text-[var(--ink)] group-hover:text-[var(--ink-secondary)] transition-colors px-1 rounded-xs",
                  isFocus && "bg-[linear-gradient(180deg,transparent_45%,rgba(255,255,255,0.85)_45%)]",
                  isLongPhrase
                    ? "text-lg @[24rem]:text-xl @[28rem]:text-2xl md:text-3xl"
                    : "text-xl @[24rem]:text-2xl @[28rem]:text-3xl md:text-4xl"
                )}
              >
                {rawWord}
              </span>

              {/* Notación fonética IPA límpida en Andika (font-ipa) */}
              {ipaLoading ? (
                <span className="h-4 flex items-center justify-center mt-0.5">
                  <Loader2 size={12} className="animate-spin text-[var(--ink-muted)]" />
                </span>
              ) : ipaText ? (
                <span
                  lang="en-fonipa"
                  className={cn(
                    "font-ipa text-xs @[24rem]:text-sm @[28rem]:text-[15px] font-medium tracking-wide mt-0.5 transition-colors",
                    hasAnalysis && hasError
                      ? "text-rose-700 font-semibold"
                      : allCorrect
                      ? "text-emerald-800 font-semibold"
                      : "text-[var(--ink-secondary)] opacity-90"
                  )}
                >
                  {ipaText}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Subtítulo de traducción estilizado en DM Sans como chip sutil */}
      <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/50 border border-[color-mix(in_oklch,var(--ink)_12%,transparent)] shadow-2xs max-w-full">
        <span className="text-xs @[24rem]:text-sm @[28rem]:text-base font-sans font-medium text-[var(--ink)] tracking-tight">
          {meta.spanish}
        </span>
      </div>

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

