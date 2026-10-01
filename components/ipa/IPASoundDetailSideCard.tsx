"use client";

// Planned structure:
// <IPASoundDetailSideCard>
//   <PastelCardWrapper>
//     <BadgesRow />            — type + difficulty for Spanish speakers
//     <PhonemeHeaderAndAudio /> — symbol, one-line hook, play (restarts the motion)
//     <ArticulationCarousel /> — 3-slide carousel (Lengua, Labios, Cómo ponerte)
//     <ExamplesSection />
//     <SpanishTipBox />
//     <ActionButtons />
//   </PastelCardWrapper>
// </IPASoundDetailSideCard>

import { useState } from "react";
import Link from "next/link";
import { Play, Volume2 } from "@/components/icons";
import type { PhonemeData } from "./data";
import { IPA_EXTRA } from "@/lib/pronunciation/ipa-data";
import { getArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";
import { getDifficultyLabel } from "@/lib/pronunciation/articulation-copy";
import { canonicalizeSoundIpa } from "@/lib/sounds/inventory";
import { ArticulationCarousel } from "./ArticulationCarousel";
import { useSpeakWord } from "@/hooks/useSpeakWord";
import PastelCard, { type PastelTone } from "@/components/layout/PastelCard";

interface IPASoundDetailSideCardProps {
  phoneme: PhonemeData;
  isPlaying: boolean;
  onPlay: () => void;
}

const TYPE_LABEL: Record<PhonemeData["type"], string> = {
  vowel: "VOCAL",
  consonant: "CONSONANTE",
  diphthong: "DIPTONGO",
};

function getToneForType(type: PhonemeData["type"]): PastelTone {
  if (type === "vowel") return "lilac";
  if (type === "consonant") return "sky";
  return "butter";
}

export function IPASoundDetailSideCard({
  phoneme,
  isPlaying,
  onPlay,
}: IPASoundDetailSideCardProps) {
  const extra = IPA_EXTRA[canonicalizeSoundIpa(phoneme.symbol)];
  const { speak } = useSpeakWord();
  const [replayKey, setReplayKey] = useState(0);

  // One short line each: the hook names the sound, the tip says how to get it.
  // The how-to steps live in the carousel, so neither repeats them.
  const hook = extra?.hookEs ?? getArticulationGuide(phoneme.symbol)?.nameEs ?? phoneme.description;
  const difficulty = getDifficultyLabel(extra?.difficulty);
  const spanishTip = extra?.spanishTip ?? phoneme.tips?.[0];
  const soundId = phoneme.rawSymbol;
  const tone = getToneForType(phoneme.type);
  const formattedSymbol = `/${phoneme.symbol.replace(/^\/+|\/+$/g, "")}/`;

  const handlePlay = () => {
    if (!isPlaying) setReplayKey((key) => key + 1);
    onPlay();
  };

  return (
    <PastelCard
      tone={tone}
      className="p-5 md:p-6 flex flex-col gap-5 sticky top-5 shadow-xs transition-all"
    >
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="bg-black text-white px-3 py-1 rounded-full ts-badge uppercase tracking-wider">
          {TYPE_LABEL[phoneme.type]}
        </span>
        {difficulty && (
          <span className="bg-black/10 dark:bg-black/20 text-black px-3 py-1 rounded-full ts-badge font-semibold">
            {difficulty}
          </span>
        )}
      </div>

      {/* Symbol & Audio button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="ts-display font-bold font-ipa text-black leading-none">
            {formattedSymbol}
          </h2>
          <p className="ts-body-lg-strong text-black/90 mt-2">{hook}</p>
        </div>
        <button
          type="button"
          onClick={handlePlay}
          className="press-feedback flex shrink-0 items-center justify-center size-12 rounded-full bg-black text-white hover:bg-black/90 transition-all shadow-xs"
          aria-label={isPlaying ? "Pausar sonido" : "Reproducir sonido"}
        >
          <Volume2 size={20} />
        </button>
      </div>

      {/* Articulation Carousel (Lengua | Labios | Cómo ponerte) */}
      <ArticulationCarousel key={phoneme.symbol} phoneme={phoneme} replayKey={replayKey} />

      {/* Examples */}
      <div className="flex flex-col gap-2">
        <span className="ts-kicker text-black/80">
          EJEMPLOS
        </span>
        <div className="flex flex-wrap gap-2">
          {phoneme.examples.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => speak(word)}
              className="press-feedback inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/20 bg-white/90 dark:bg-white/80 ts-pill text-black hover:bg-white transition-all shadow-2xs"
            >
              <span className="flex items-center justify-center size-4 rounded-full bg-black text-white shrink-0">
                <Play size={8} className="fill-current" />
              </span>
              <span>{word}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Spanish Tip */}
      {spanishTip && (
        <div className="rounded-2xl bg-white/80 dark:bg-white/70 border border-black/10 p-4 ts-body text-black/90 shadow-xs">
          <span className="ts-kicker text-black font-bold block mb-1">
            EL TRUCO
          </span>
          <span>{spanishTip}</span>
        </div>
      )}

      {/* Action CTAs */}
      <div className="flex items-center gap-2.5 pt-2">
        <Link
          href={`/practice/sounds/sound/${encodeURIComponent(soundId)}`}
          className="flex-1 text-center py-3.5 px-4 rounded-full bg-black text-white ts-button hover:bg-black/90 transition-all shadow-xs"
        >
          Practicar este sonido
        </Link>
        <Link
          href="/practice/sounds/minimal-pairs"
          className="flex-1 text-center py-3.5 px-4 rounded-full border border-black/30 bg-transparent text-black ts-button hover:bg-black/10 transition-all"
        >
          Ver pares mínimos
        </Link>
      </div>
    </PastelCard>
  );
}
