// Planned structure:
// <LandingHeroCard>
//   header ("PALABRA 4 DE 2.800" + "A1" badge)
//   word + interactive audio trigger ("of" in Bricolage display + speaker button)
//   phonetic interactive boxes (FUERTE /'ʌv/ + DÉBIL · LA REAL /əv/)
//   example contextual inset ("a cup of coffee" with "of" pill mark + note)
//   spaced repetition indicator (5 dots + "Dos aciertos seguidos. Vuelve en 6 días.")
"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { speak } from "@/lib/phoneme-practice/tts";
import { playIpaSound } from "@/lib/pronunciation/ipa-audio";

export function LandingHeroCard() {
  const [activeSound, setActiveSound] = useState<string | null>(null);

  const playWord = () => {
    setActiveSound("word");
    speak("of", {
      rate: 0.85,
      onEnd: () => setActiveSound(null),
      onError: () => setActiveSound(null),
    });
  };

  const playStrongVowel = () => {
    setActiveSound("strong");
    playIpaSound("ʌ", {
      onEnd: () => setActiveSound(null),
      onError: () => setActiveSound(null),
    });
  };

  const playWeakVowel = () => {
    setActiveSound("weak");
    playIpaSound("ə", {
      onEnd: () => setActiveSound(null),
      onError: () => setActiveSound(null),
    });
  };

  const playExamplePhrase = () => {
    setActiveSound("phrase");
    speak("a cup of coffee", {
      rate: 0.9,
      onEnd: () => setActiveSound(null),
      onError: () => setActiveSound(null),
    });
  };

  return (
    <article
      aria-label="Espécimen interactivo de palabra"
      className="relative mx-auto flex w-full max-w-md flex-col gap-5 rounded-3xl border border-black/10 bg-white/95 p-6 shadow-xl shadow-black/5 sm:p-8"
    >
      {/* Kicker + Level Badge */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
          Palabra 4 de 2.800
        </span>
        <span className="rounded-full bg-[var(--butter-soft)] px-2.5 py-0.5 font-mono text-xs font-bold text-ink border border-black/10">
          A1
        </span>
      </div>

      {/* Word + Audio Button */}
      <div className="flex items-center justify-between pt-0.5">
        <h2 className="font-display text-5xl font-extrabold tracking-tight leading-none text-ink">
          of
        </h2>
        <button
          type="button"
          onClick={playWord}
          aria-label="Escuchar pronunciación de of"
          aria-pressed={activeSound === "word"}
          className={`flex size-11 items-center justify-center rounded-full bg-ink text-white shadow-xs transition-all hover:scale-105 active:scale-95 focus-ring ${
            activeSound === "word" ? "ring-3 ring-ink/30 scale-105" : ""
          }`}
        >
          <Volume2 className="size-5" />
        </button>
      </div>

      {/* Phonetic Forms — Click to listen */}
      <div className="grid grid-cols-2 gap-3.5 pt-0.5">
        <button
          type="button"
          onClick={playStrongVowel}
          aria-label="Escuchar sonido fuerte /ʌ/"
          aria-pressed={activeSound === "strong"}
          className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all hover:border-black/30 active:scale-98 cursor-pointer ${
            activeSound === "strong"
              ? "border-ink bg-white ring-2 ring-black/10"
              : "border-black/10 bg-white/60 dark:bg-white/5"
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <span className="font-mono text-[10px] font-bold tracking-widest text-ink-muted uppercase">
              Fuerte
            </span>
            <Volume2 className="size-3.5 text-ink-muted" />
          </div>
          <span className="font-ipa mt-0.5 text-2xl font-bold leading-tight text-ink">
            /ˈʌv/
          </span>
        </button>

        <button
          type="button"
          onClick={playWeakVowel}
          aria-label="Escuchar sonido débil /ə/"
          aria-pressed={activeSound === "weak"}
          className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all hover:border-black/30 active:scale-98 cursor-pointer ${
            activeSound === "weak"
              ? "border-ink bg-[var(--butter-soft)] ring-2 ring-black/10"
              : "border-black/10 bg-[var(--butter-soft)]"
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <span className="font-mono text-[10px] font-bold tracking-widest text-ink uppercase">
              Débil · La real
            </span>
            <Volume2 className="size-3.5 text-ink" />
          </div>
          <span className="font-ipa mt-0.5 text-2xl font-bold leading-tight text-ink">
            /əv/
          </span>
        </button>
      </div>

      {/* Example Sentence Inset — Click to listen */}
      <button
        type="button"
        onClick={playExamplePhrase}
        aria-label="Escuchar frase: a cup of coffee"
        aria-pressed={activeSound === "phrase"}
        className={`flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all hover:border-black/30 active:scale-98 cursor-pointer sm:p-5 ${
          activeSound === "phrase"
            ? "border-ink bg-white ring-2 ring-black/10"
            : "border-black/10 bg-white/70 dark:bg-black/20"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="text-base font-medium leading-snug text-ink">
            a cup{" "}
            <mark className="rounded-sm border border-black/10 bg-[var(--mint-soft)] px-1.5 py-0.5 font-bold text-ink font-ipa">
              of
            </mark>{" "}
            coffee
          </p>
          <Volume2 className="size-4 text-ink-muted shrink-0 ml-2" />
        </div>
        <p className="text-xs leading-normal text-ink-secondary">
          Suena como “a cuppa coffee”. Por eso no lo oyes.
        </p>
      </button>

      {/* SRS Schedule Progress */}
      <div className="flex items-center gap-3 pt-1 tabular-nums">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-5 rounded-full bg-ink" />
          <span className="h-1.5 w-5 rounded-full bg-ink" />
          <span className="h-1.5 w-5 rounded-full bg-black/15 dark:bg-white/20" />
          <span className="h-1.5 w-5 rounded-full bg-black/15 dark:bg-white/20" />
          <span className="h-1.5 w-5 rounded-full bg-black/15 dark:bg-white/20" />
        </div>
        <p className="text-xs font-medium text-ink-secondary">
          Dos aciertos seguidos. Vuelve en 6 días.
        </p>
      </div>
    </article>
  );
}
