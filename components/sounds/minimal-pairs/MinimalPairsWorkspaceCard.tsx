"use client";

import { useState, type RefObject } from "react";
import PastelCard from "@/components/layout/PastelCard";
import { WordCard } from "./WordCard";
import { ContrastMouthComparison } from "@/components/phoneme-practice/ContrastMouthComparison";
import { Check, Play } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { MinimalPairContrast } from "@/lib/sounds/minimal-pairs";
import type { Side, Verdict } from "./useMinimalPairsRunner";

// Planned structure:
// <MinimalPairsWorkspaceCard>
//   <ButterPastelCard>
//     <HeaderInfoBar />
//     <TipBanner />
//     <ContrastMouthComparison />
//     <PairCardsGrid />
//     <QuizQuestionSection />
//     <BottomControlsBar />
//   </ButterPastelCard>
// </MinimalPairsWorkspaceCard>

interface MinimalPairsWorkspaceCardProps {
  phoneme: string;
  contrast: MinimalPairContrast | null;
  pair: { wordA: string; wordB: string; phonemeA: string; phonemeB: string };
  pairs: { wordA: string; wordB: string }[];
  pairIdx: number;
  playingSide: Side | null;
  quizTarget: Side | null;
  verdict: Verdict;
  highlights: { A: Verdict; B: Verdict };
  isLastPair: boolean;
  isSlow: boolean;
  quizActionsRef: RefObject<HTMLDivElement | null>;
  playSide: (side: Side) => void;
  handleStartQuiz: () => void;
  handleReplayClue: () => void;
  handleGuess: (side: Side) => void;
  handlePlayBoth: () => void;
  goToNextPair: (autoAdvance?: boolean) => void;
  setIsSlow: (slow: boolean) => void;
}

export function MinimalPairsWorkspaceCard({
  phoneme,
  contrast,
  pair,
  pairs,
  pairIdx,
  playingSide,
  quizTarget,
  verdict,
  highlights,
  isLastPair,
  isSlow,
  quizActionsRef,
  playSide,
  handleStartQuiz,
  handleReplayClue,
  handleGuess,
  handlePlayBoth,
  goToNextPair,
  setIsSlow,
}: MinimalPairsWorkspaceCardProps) {
  const [showMouthGuide, setShowMouthGuide] = useState(false);
  const [activeSide, setActiveSide] = useState<Side>("A");

  const effectiveActiveSide = playingSide ?? activeSide;

  const contrastLabel = contrast
    ? `${contrast.phonemeA} vs ${contrast.phonemeB}`
    : phoneme;

  const isVowelCategory = contrast
    ? ["/iː/", "/ɪ/", "/uː/", "/ʊ/", "/æ/", "/ʌ/", "/ɛ/", "/ɑ/", "/ɔ/", "/oʊ/"].includes(contrast.phonemeA)
    : true;

  return (
    <PastelCard tone="butter" className="p-6 md:p-7 space-y-5 rounded-3xl shadow-xs">
      {/* 1. Header con indicador PAR X DE Y, fonemas y categoría */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="bg-ink text-paper px-3 py-1 rounded-full text-[11px] font-bold tracking-wider font-kicker uppercase shadow-2xs">
            PAR {pairIdx + 1} DE {pairs.length}
          </span>
          <h2 className="font-display font-extrabold text-xl md:text-2xl text-ink tracking-tight">
            {contrastLabel}
          </h2>
        </div>
        <span className="bg-ink/8 text-ink px-3 py-1 rounded-full ts-badge lowercase">
          {isVowelCategory ? "vocales" : "consonantes"}
        </span>
      </div>

      {/* 2. Banner de consejo / boca con botón "Ver la boca" */}
      {contrast ? (
        <div className="space-y-3">
          <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 md:p-3.5 border border-black/10 flex items-center justify-between gap-3 shadow-2xs">
            <p className="ts-body text-ink flex items-center gap-1.5">
              <span aria-hidden>✨</span>
              <span>{contrast.hint}</span>
            </p>
            <button
              type="button"
              onClick={() => setShowMouthGuide((prev) => !prev)}
              className="rounded-full border border-ink px-4 py-1.5 ts-pill text-ink hover:bg-black/5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {showMouthGuide ? "Ocultar boca" : "Ver la boca"}
            </button>
          </div>

          {showMouthGuide ? (
            <ContrastMouthComparison
              phonemeA={contrast.phonemeA}
              phonemeB={contrast.phonemeB}
            />
          ) : null}
        </div>
      ) : null}

      {/* 3. Tarjetas A y B */}
      <div
        key={`${phoneme}-${pairIdx}`}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn"
      >
        <WordCard
          word={pair.wordA}
          symbol={pair.phonemeA}
          side="A"
          isPlaying={playingSide === "A"}
          highlight={null}
          selectable={false}
          compact={false}
          workspace={true}
          selected={effectiveActiveSide === "A"}
          onPlay={() => {
            setActiveSide("A");
            playSide("A");
          }}
          onPick={() => {
            setActiveSide("A");
            playSide("A");
          }}
        />
        <WordCard
          word={pair.wordB}
          symbol={pair.phonemeB}
          side="B"
          isPlaying={playingSide === "B"}
          highlight={null}
          selectable={false}
          compact={false}
          workspace={true}
          selected={effectiveActiveSide === "B"}
          onPlay={() => {
            setActiveSide("B");
            playSide("B");
          }}
          onPick={() => {
            setActiveSide("B");
            playSide("B");
          }}
        />
      </div>

      {/* 4. Sección ¿CUÁL ESCUCHASTE? */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-kicker font-bold text-xs tracking-wider text-ink/70 uppercase">
            ¿CUÁL ESCUCHASTE?
          </span>
          <button
            type="button"
            onClick={quizTarget ? handleReplayClue : handleStartQuiz}
            className="bg-ink text-paper hover:opacity-90 px-4 py-1.5 rounded-full ts-pill inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Play size={12} fill="currentColor" aria-hidden />
            <span>{quizTarget ? "Repetir" : "Reproducir"}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            disabled={!quizTarget && verdict === null}
            onClick={() => handleGuess("A")}
            className={cn(
              "relative flex items-center justify-center gap-2 p-3.5 md:p-4 rounded-2xl ts-body-lg-strong transition-all duration-150 border cursor-pointer select-none",
              highlights.A === "correct"
                ? "bg-mint border-black/15 text-ink shadow-2xs font-extrabold"
                : highlights.A === "wrong"
                  ? "bg-coral border-black/15 text-ink"
                  : "bg-white/60 border-black/15 text-ink hover:bg-white/80",
              (!quizTarget && verdict === null) && "opacity-75 cursor-not-allowed"
            )}
          >
            <span>{pair.wordA}</span>
            {highlights.A === "correct" && <Check size={16} strokeWidth={3} />}
          </button>

          <button
            type="button"
            disabled={!quizTarget && verdict === null}
            onClick={() => handleGuess("B")}
            className={cn(
              "relative flex items-center justify-center gap-2 p-3.5 md:p-4 rounded-2xl ts-body-lg-strong transition-all duration-150 border cursor-pointer select-none",
              highlights.B === "correct"
                ? "bg-mint border-black/15 text-ink shadow-2xs font-extrabold"
                : highlights.B === "wrong"
                  ? "bg-coral border-black/15 text-ink"
                  : "bg-white/60 border-black/15 text-ink hover:bg-white/80",
              (!quizTarget && verdict === null) && "opacity-75 cursor-not-allowed"
            )}
          >
            <span>{pair.wordB}</span>
            {highlights.B === "correct" && <Check size={16} strokeWidth={3} />}
          </button>
        </div>
      </div>

      {/* 5. Barra de controles inferior */}
      <div ref={quizActionsRef} className="flex items-center justify-between gap-3 pt-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlayBoth}
            className="border border-ink/30 hover:bg-black/5 text-ink px-3.5 py-1.5 rounded-full ts-pill inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play size={12} fill="currentColor" aria-hidden />
            <span>Escuchar las dos</span>
          </button>

          <div className="inline-flex p-0.5 rounded-full bg-black/10 text-ink ts-badge">
            <button
              type="button"
              onClick={() => setIsSlow(false)}
              className={cn(
                "px-2.5 py-0.5 rounded-full transition-all cursor-pointer",
                !isSlow ? "bg-white text-ink font-bold shadow-2xs" : "opacity-70 hover:opacity-100"
              )}
            >
              1.0x
            </button>
            <button
              type="button"
              onClick={() => setIsSlow(true)}
              className={cn(
                "px-2.5 py-0.5 rounded-full transition-all cursor-pointer",
                isSlow ? "bg-white text-ink font-bold shadow-2xs" : "opacity-70 hover:opacity-100"
              )}
            >
              0.7x
            </button>
          </div>
        </div>

        <span className="ts-stat text-ink/70">
          {pairIdx + (verdict === "correct" ? 1 : 0)} de {pairs.length} acertados
        </span>

        <button
          type="button"
          onClick={() => goToNextPair(true)}
          className="bg-primary hover:opacity-95 text-on-primary px-5 py-2 rounded-full ts-button inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 ml-auto sm:ml-0"
        >
          <span>{isLastPair ? "Ver resultado" : "Siguiente par"}</span>
          <span className="bg-white/20 text-on-primary px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold">
            Enter
          </span>
        </button>
      </div>
    </PastelCard>
  );
}
