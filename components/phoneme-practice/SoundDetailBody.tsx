"use client";

import { ArrowRight, ChevronRight, CloudFog, Lightbulb, Smile, VolumeX } from "@/components/icons";
import { PillButton } from "@/components/ui/PillButton";
import PastelCard from "@/components/layout/PastelCard";
import type { PhonemeData } from "@/components/ipa/data";
import { IPA_EXTRA } from "@/lib/pronunciation/ipa-data";
import { getArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";
import { canonicalizeSoundIpa } from "@/lib/sounds/inventory";

// Planned structure:
// <SoundDetailBody>
//   <SoundProgressSection />
//   <SoundGridSection>
//     <TrickCard />
//     <ArticulationCard />
//   </SoundGridSection>
//   <ConfusionBanner />
//   <FooterAction />
// </SoundDetailBody>

interface SoundDetailBodyProps {
  phoneme: PhonemeData;
  progressPct: number;
  onPractice: () => void;
}

export function SoundDetailBody({ phoneme, progressPct, onPractice }: SoundDetailBodyProps) {
  const extra = IPA_EXTRA[canonicalizeSoundIpa(phoneme.symbol)];
  const guide = getArticulationGuide(phoneme.symbol);

  // Calculate 5-segment progress
  const totalSteps = 5;
  const completedSteps = Math.min(5, Math.max(0, Math.round((progressPct / 100) * totalSteps)));

  // "El truco" copy
  const trickText =
    extra?.spanishTipLongEs ??
    extra?.spanishTip ??
    phoneme.tips.join(" ") ??
    "Es como tu p española, pero con un “puff” de aire al inicio de sílabas tónicas.";

  const trickTestText =
    phoneme.rawSymbol === "p"
      ? "Prueba: pon un papel frente a tus labios y di paper. Debe moverse."
      : guide?.visualCueEs ?? "Practica concentrándote en la tensión muscular y la respiración.";

  // Articulation details ("Cómo se produce")
  const lipsDesc =
    phoneme.rawSymbol === "p"
      ? "Se juntan y se separan de golpe."
      : guide?.placeEs ?? extra?.articulationEs?.[0] ?? "Junta los labios con firmeza.";

  const airDesc =
    phoneme.rawSymbol === "p"
      ? "Sale con fuerza, con un soplo audible."
      : guide?.visualCueEs ?? extra?.articulationEs?.[1] ?? "Flujo de aire continuo y claro.";

  const isVoiceless = guide ? !guide.vocalCordsVibrate : phoneme.rawSymbol === "p" || phoneme.rawSymbol === "t" || phoneme.rawSymbol === "k";
  const voicingTitle = isVoiceless ? "Sin voz" : "Con voz";

  const contrastingPhoneme =
    extra?.minimalPairs?.[0]?.phonemeB ?? (phoneme.rawSymbol === "p" ? "/b/" : "/v/");

  const voiceDesc =
    phoneme.rawSymbol === "p"
      ? "La garganta no vibra (a diferencia de /b/)."
      : isVoiceless
      ? `La garganta no vibra (a diferencia de ${contrastingPhoneme}).`
      : `Las cuerdas vocales en la garganta vibran de forma constante.`;

  // Minimal pair banner info
  const firstPair = extra?.minimalPairs?.[0];
  const secondPair = extra?.minimalPairs?.[1];

  const minimalPairExamples =
    firstPair && secondPair
      ? `${firstPair.wordA} vs ${firstPair.wordB} · ${secondPair.wordA} vs ${secondPair.wordB}`
      : "pat vs bat · pie vs buy";

  return (
    <div className="w-full bg-slate-950 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 flex flex-col gap-4 sm:gap-5 shadow-inner">
      {/* 1. Progress Bar Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between ts-caption">
          <span className="font-bold uppercase tracking-wider text-slate-400 text-xs">TU PROGRESO</span>
          <span className="text-slate-400 font-medium text-xs">
            {completedSteps} de {totalSteps} ejercicios
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 w-full">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-colors duration-300 ${
                idx < completedSteps ? "bg-slate-400" : "bg-slate-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 2. Grid: "El truco" & "Cómo se produce" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Left: Pastel Butter "El truco" Card */}
        <PastelCard tone="butter" className="p-4 sm:p-5 flex flex-col gap-3 text-slate-900 border-none rounded-2xl h-fit">
          <div className="flex items-center gap-2">
            <Lightbulb size={20} className="text-slate-900 shrink-0" aria-hidden />
            <span className="font-display font-bold text-base text-slate-900">El truco</span>
          </div>

          <p className="ts-body text-slate-900 leading-relaxed text-sm font-normal m-0">
            {trickText}
          </p>

          <div className="bg-white/80 dark:bg-amber-900/30 rounded-xl p-3 text-xs sm:text-sm text-slate-900 leading-snug border border-amber-200/60 font-medium">
            {trickTestText}
          </div>
        </PastelCard>

        {/* Right: "Cómo se produce" Card */}
        <div className="bg-slate-900/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 border border-slate-800/80 h-fit">
          <h4 className="text-base font-display font-bold text-white m-0">Cómo se produce</h4>

          <div className="flex flex-col gap-3">
            {/* Lips */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
                <Smile size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-sm text-white">Labios</span>
                <span className="text-slate-300 text-xs leading-snug">{lipsDesc}</span>
              </div>
            </div>

            {/* Air */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
                <CloudFog size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-sm text-white">Aire</span>
                <span className="text-slate-300 text-xs leading-snug">{airDesc}</span>
              </div>
            </div>

            {/* Voicing */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
                <VolumeX size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-sm text-white">{voicingTitle}</span>
                <span className="text-slate-300 text-xs leading-snug">{voiceDesc}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Confusion / Minimal Pair Banner */}
      <button
        type="button"
        onClick={onPractice}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 p-3.5 sm:p-4 flex items-center justify-between transition-colors cursor-pointer text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center font-phoneme font-bold text-amber-300 text-sm shrink-0">
            {contrastingPhoneme}
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
              Se confunde con {contrastingPhoneme}
            </span>
            <span className="text-xs text-slate-400 mt-0.5">
              {minimalPairExamples} — practícalo en Pares mínimos
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-400 group-hover:text-white transition-colors shrink-0 ml-2" />
      </button>

      {/* 4. Footer Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <span className="text-xs text-slate-400 font-medium text-center sm:text-left">
          5 ejercicios · escuchar, grabar y comparar · 3 min
        </span>
        <PillButton
          variant="primary"
          size="md"
          onClick={onPractice}
          className="w-full sm:w-auto py-2.5 px-6 ts-button font-bold rounded-full shadow-md justify-center flex items-center gap-2 cursor-pointer"
        >
          <span>Practicar ahora</span>
          <ArrowRight size={16} aria-hidden />
        </PillButton>
      </div>
    </div>
  );
}
