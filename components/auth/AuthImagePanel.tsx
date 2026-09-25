"use client";

// Planned structure (exact original layout with rich animations):
// <AuthImagePanel>
//   <BrandHeader>
//     <BadgeAa />
//     <BrandName />
//   </BrandHeader>
//   <HeroGrid>
//     <PeopleIllustration />
//     <BentoCards>
//       <WordOfDayCard />
//       <PhraseOfDayCard />
//     </BentoCards>
//   </HeroGrid>
//   <HeroFooterText />
// </AuthImagePanel>

import { useState } from "react";
import Image from "next/image";
import PastelCard from "@/components/layout/PastelCard";
import { Volume2, Sparkles } from "@/components/icons";

const ILLUSTRATION_SRC = "/images/background.png";

export function AuthImagePanel() {
  const [isPlaying, setIsPlaying] = useState(false);

  const playSampleAudio = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const audio = new Audio("/sounds/sale.ogg");
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      audio.play().catch(() => setIsPlaying(false));
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative hidden lg:flex lg:w-[50%] xl:w-[48%] shrink-0 flex-col justify-between rounded-[32px] bg-gradient-to-br from-[var(--sky-soft)] via-white to-[var(--butter-soft)] dark:from-surface-raised dark:via-surface dark:to-surface-raised p-8 overflow-hidden select-none border border-border-subtle shadow-xs">
      {/* Gentle floating ambient blobs */}
      <div
        className="absolute -top-24 -left-16 size-72 rounded-full bg-[var(--sky)]/40 blur-3xl animate-float-soft"
        aria-hidden
      />
      <div
        className="absolute bottom-0 -right-10 size-64 rounded-full bg-[var(--coral)]/30 blur-3xl animate-float-soft [animation-delay:1.2s]"
        aria-hidden
      />

      {/* Top-left brand mark */}
      <div className="flex items-center gap-3 relative z-10 animate-home-in">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--butter)] text-black font-bold text-sm shadow-xs border border-black/10 transition-transform duration-300 hover:scale-105">
          Aa
        </div>
        <span className="font-[family-name:var(--font-display)] font-bold text-fg text-base tracking-tight">
          English Journal
        </span>
      </div>

      {/* Middle Hero Section: Illustration + Bento Cards */}
      <div className="relative z-10 my-auto py-6 grid grid-cols-12 gap-6 items-center">
        {/* Left: hand-drawn illustration with gentle floating animation */}
        <div className="col-span-5 relative aspect-square w-full flex items-center justify-center animate-home-in animate-home-in-d1">
          <Image
            src={ILLUSTRATION_SRC}
            alt="Estudiantes practicando pronunciación en inglés"
            width={520}
            height={520}
            className="relative object-contain object-center p-2 animate-float-soft transition-transform duration-500 hover:scale-105"
            priority
          />
        </div>

        {/* Right: Daily Bento Cards with spring hover & audio animation */}
        <div className="col-span-7 flex flex-col gap-4">
          {/* Palabra del Día Card */}
          <PastelCard
            tone="coral"
            className="animate-home-in animate-home-in-d2 relative rounded-2xl p-5 text-slate-950 shadow-sm transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1 active:scale-[0.99] group border border-black/5"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold tracking-wider text-slate-900 uppercase">
                  PALABRA DEL DÍA
                </span>
                <Sparkles className="size-3 text-slate-800 animate-pulse" />
              </div>
              <span className="text-xs font-bold bg-black/10 text-slate-950 px-2.5 py-0.5 rounded-full">
                sustantivo
              </span>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-3xl font-black text-slate-950 tracking-tight leading-none mb-1">
              sale
            </h3>
            <p className="font-ipa text-sm font-bold text-slate-950 mb-0.5">
              /seɪl/
            </p>
            <p className="text-sm font-bold text-slate-900">
              oferta, rebaja
            </p>

            {/* Audio Button with equalizer wave animation */}
            <button
              type="button"
              onClick={playSampleAudio}
              className={`absolute right-4 bottom-4 size-10 rounded-full bg-slate-950 text-white flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 cursor-pointer ${
                isPlaying ? "ring-2 ring-slate-950 ring-offset-2 ring-offset-[var(--coral)]" : ""
              }`}
              aria-label="Escuchar la palabra sale"
            >
              {isPlaying ? (
                <div className="flex items-center justify-center gap-0.5 size-4">
                  <span className="w-0.5 h-3 bg-white rounded-full animate-wave-bar" />
                  <span className="w-0.5 h-3 bg-white rounded-full animate-wave-bar [animation-delay:150ms]" />
                  <span className="w-0.5 h-3 bg-white rounded-full animate-wave-bar [animation-delay:300ms]" />
                </div>
              ) : (
                <Volume2 className="size-4 group-hover:scale-110 transition-transform" />
              )}
            </button>
          </PastelCard>

          {/* Frase del Día Card */}
          <PastelCard
            tone="butter"
            className="animate-home-in animate-home-in-d3 rounded-2xl p-5 text-slate-950 shadow-sm transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1 active:scale-[0.99] border border-black/5"
          >
            <span className="text-[11px] font-extrabold tracking-wider text-slate-900 uppercase block mb-1.5">
              FRASE DEL DÍA
            </span>
            <h4 className="font-[family-name:var(--font-display)] text-lg font-black text-slate-950 leading-snug mb-1">
              Let&apos;s read between the lines.
            </h4>
            <p className="font-ipa text-xs font-bold text-slate-950 mb-1">
              /lɛts riːd bɪ&apos;twiːn ðə laɪnz/
            </p>
            <p className="text-xs font-bold text-slate-900">
              Leamos entre líneas.
            </p>
          </PastelCard>
        </div>
      </div>

      {/* Bottom Hero Text with entrance animation */}
      <div className="relative z-10 pt-2 animate-home-in animate-home-in-d3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl lg:text-3xl font-bold text-fg tracking-tight leading-tight text-balance mb-2">
          Tu inglés, un día a la vez.
        </h2>
        <p className="text-sm text-fg-muted font-normal leading-relaxed max-w-md text-pretty">
          Palabras y frases con audio, IPA y traducción. Sesiones cortas, a tu ritmo.
        </p>
      </div>
    </div>
  );
}
