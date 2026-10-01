"use client";

import { useMemo, useState } from "react";
import { Play, Timer, Volume2, X } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import PastelCard from "@/components/layout/PastelCard";
import type { Lesson } from "@/lib/types";
import type { PhonemeData } from "@/components/ipa/data";
import { IPA_EXTRA } from "@/lib/pronunciation/ipa-data";
import { playIpaSound } from "@/lib/pronunciation/ipa-audio";
import { canonicalizeSoundIpa, SOUND_CLASS_SINGULAR_LABELS } from "@/lib/sounds/inventory";
import { parseSoundDuration } from "@/lib/sounds/duration";
import { useSpeakWord } from "@/hooks/useSpeakWord";
import { cn } from "@/lib/cn";

// Planned structure:
// <SoundHeroCard>
//   <SoundHeroHeader />
//   <SoundHeroMain />
//   <SoundPositionExamples />
// </SoundHeroCard>

interface SoundHeroCardProps {
  phoneme: PhonemeData;
  lesson: Lesson;
  progressPct: number;
  onClose: () => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
};

export function SoundHeroCard({ phoneme, lesson, progressPct, onClose }: SoundHeroCardProps) {
  const [ipaPlaying, setIpaPlaying] = useState(false);
  const [slowPlaying, setSlowPlaying] = useState(false);
  const { speaking, speak, stop } = useSpeakWord();

  const extra = IPA_EXTRA[canonicalizeSoundIpa(phoneme.symbol)];
  const soundTypeLabel = SOUND_CLASS_SINGULAR_LABELS[phoneme.type] ?? "Consonante";
  const difficulty = extra?.difficulty ?? lesson.difficulty ?? "easy";
  const difficultyLabel = DIFFICULTY_LABELS[difficulty] ?? "Fácil";
  const duration = parseSoundDuration(lesson.description);

  const examples = useMemo(() => {
    const canonical = [...new Set(phoneme.examples)].filter(Boolean).slice(0, 3);
    return canonical.length > 0 ? canonical : [...new Set(lesson.words.map((w) => w.word))].filter(Boolean).slice(0, 3);
  }, [lesson.words, phoneme.examples]);

  const anchorWord = examples[0] ?? lesson.words[0]?.word ?? "pen";

  // Description / summary text for top hero
  const heroDescription =
    extra?.hookEs ??
    extra?.spanishTip ??
    phoneme.description ??
    "Una explosión rápida de aire: cierras los labios con fuerza y los abres de golpe.";

  function handlePlayIpa(rate = 1) {
    if (ipaPlaying || slowPlaying) return;
    if (rate === 1) setIpaPlaying(true);
    else setSlowPlaying(true);

    playIpaSound(phoneme.rawSymbol, {
      onStart: () => {
        if (rate === 1) setIpaPlaying(true);
        else setSlowPlaying(true);
      },
      onEnd: () => {
        setIpaPlaying(false);
        setSlowPlaying(false);
      },
      onError: () => {
        setIpaPlaying(false);
        setSlowPlaying(false);
      },
    });
  }

  const progressLabel =
    progressPct >= 80 ? "Dominado" : progressPct > 0 ? `${Math.round(progressPct)}%` : "Sin practicar";

  return (
    <PastelCard tone="sky" className="w-full p-5 sm:p-6 text-slate-900 border-none shadow-sm flex flex-col gap-4">
      {/* Header: Badges & Close */}
      <div className="w-full flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-slate-900 text-white dark:bg-slate-950 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider select-none">
            {soundTypeLabel}
          </span>
          <Badge label={difficultyLabel} variant="neutral" size="sm" className="bg-white/70 text-slate-900 border-slate-900/20" />
          <Badge label={progressLabel} variant="neutral" size="sm" className="bg-white/70 text-slate-900 border-slate-900/20" />
          {duration && <Badge label={duration === "long" ? "Larga" : "Corta"} variant="neutral" size="sm" className="bg-white/70 text-slate-900 border-slate-900/20" />}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      {/* Main Hero: IPA Symbol & Details */}
      <div className="grid grid-cols-[auto_1fr] gap-4 sm:gap-6 items-center">
        {/* IPA Symbol Circle Avatar */}
        <button
          type="button"
          onClick={() => handlePlayIpa(1)}
          className={cn(
            "w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-slate-900 flex items-center justify-center text-3xl sm:text-4xl font-bold font-phoneme text-slate-900 bg-sky-100/60 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
            ipaPlaying && "animate-pulse ring-4 ring-slate-900/30"
          )}
          aria-label={`Reproducir sonido ${phoneme.symbol}`}
          title="Toca para oír el sonido"
        >
          {phoneme.symbol}
        </button>

        {/* Text & Audio Controls */}
        <div className="flex flex-col gap-2">
          {anchorWord && (
            <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 m-0 leading-tight tracking-tight">
              como en <u className="underline underline-offset-4 decoration-2 font-display font-extrabold">{anchorWord}</u>
            </h3>
          )}

          <p className="ts-body text-slate-800 text-sm sm:text-base leading-relaxed m-0 font-normal">
            {heroDescription}
          </p>

          {/* Audio Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => handlePlayIpa(1)}
              className="bg-slate-900 text-white rounded-full px-4 py-2 text-xs sm:text-sm font-semibold flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Volume2 size={14} className={cn("shrink-0", ipaPlaying && "animate-bounce")} aria-hidden />
              <span className="font-display font-bold">Escuchar el sonido</span>
            </button>

            <button
              type="button"
              onClick={() => handlePlayIpa(0.7)}
              className="bg-white/80 hover:bg-white text-slate-900 border border-slate-900/30 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Timer size={14} className={cn("shrink-0 text-slate-700", slowPlaying && "animate-spin")} aria-hidden />
              <span className="font-display font-bold">Lento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Position Examples Row */}
      {examples.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
          {examples.map((word, index) => {
            const positionLabel = index === 0 ? "Al inicio" : index === 1 ? "En medio" : "Al final";
            const isSpeaking = speaking === word;
            return (
              <div key={word} className="bg-white/70 dark:bg-white/80 rounded-2xl p-2.5 sm:p-3 border border-slate-900/10 flex flex-col gap-1 text-left">
                <span className="ts-caption text-slate-600 font-medium text-xs">{positionLabel}</span>
                <button
                  type="button"
                  onClick={() => (isSpeaking ? stop() : speak(word))}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-base font-display font-bold text-slate-900 hover:bg-slate-900 hover:text-white transition-all cursor-pointer w-full shadow-xs border border-slate-900/10",
                    isSpeaking && "bg-slate-900 text-white"
                  )}
                >
                  <Play size={12} className={cn("fill-current shrink-0", isSpeaking && "animate-pulse")} aria-hidden />
                  <span className="truncate font-display font-bold">
                    <HighlightPhonemeWord word={word} rawSymbol={phoneme.rawSymbol} index={index} />
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </PastelCard>
  );
}

function HighlightPhonemeWord({ word, rawSymbol, index }: { word: string; rawSymbol: string; index: number }) {
  // Highlights the target phoneme letters in the word
  const charToFind = rawSymbol.toLowerCase();
  const lowerWord = word.toLowerCase();

  let targetSub = charToFind;
  if (lowerWord.includes(charToFind + charToFind)) {
    targetSub = charToFind + charToFind;
  }

  const matchIdx = lowerWord.indexOf(targetSub);
  if (matchIdx === -1) {
    // Fallback: highlight first letter if initial, middle if medial, last if final
    if (index === 0) {
      return (
        <>
          <span className="text-primary font-extrabold">{word.slice(0, 1)}</span>
          {word.slice(1)}
        </>
      );
    }
    if (index === 2) {
      return (
        <>
          {word.slice(0, -1)}
          <span className="text-primary font-extrabold">{word.slice(-1)}</span>
        </>
      );
    }
    return <span>{word}</span>;
  }

  const before = word.slice(0, matchIdx);
  const matched = word.slice(matchIdx, matchIdx + targetSub.length);
  const after = word.slice(matchIdx + targetSub.length);

  return (
    <>
      {before}
      <span className="text-primary font-extrabold">{matched}</span>
      {after}
    </>
  );
}
