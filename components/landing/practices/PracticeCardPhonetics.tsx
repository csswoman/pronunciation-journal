"use client";

// Planned structure:
// <PracticeCardPhonetics>
//   PastelCard (coral)
//   Left column: icon kicker, Bricolage title, description, interactive feature tag selector, dark callout
//   Right column: feature carousel presentation (strict 4-tier typography: Bricolage display, DM mono, UI sans, Noto IPA)
import { useState } from "react";
import PastelCard from "@/components/layout/PastelCard";
import { Ear, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const PHONETIC_SLIDES = [
  {
    id: "ritmo",
    tag: "ritmo",
    title: "Ritmo acentual",
    subtitle: "grande = pulso · pequeño = se reduce",
    badge: "Frase real",
    description:
      "El inglés golpea unas sílabas y aplasta otras. Las palabras de contenido llevan la fuerza del compás.",
    content: (
      <div className="my-4 rounded-2xl border border-black/5 bg-neutral-50/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5 font-sans font-bold text-neutral-900">
          <span className="font-sans text-base font-semibold text-neutral-500">I</span>
          <span className="font-display text-3xl sm:text-4xl font-black text-neutral-900">WANT</span>
          <span className="font-ipa text-sm font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-lg whitespace-nowrap">
            tə
          </span>
          <span className="font-display text-3xl sm:text-4xl font-black text-neutral-900">GO</span>
          <span className="font-ipa text-sm font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-lg whitespace-nowrap">
            tə
          </span>
          <span className="font-ipa text-sm font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-lg whitespace-nowrap">
            ðə
          </span>
          <span className="font-display text-3xl sm:text-4xl font-black text-neutral-900">STORE</span>
        </div>
      </div>
    ),
  },
  {
    id: "pares-minimos",
    tag: "pares mínimos",
    title: "Par mínimo",
    subtitle: "discriminación auditiva",
    badge: "Sonidos confusos",
    description:
      "Distingue vocales y consonantes muy cercanas que cambian completamente el significado de la palabra.",
    content: (
      <div className="my-4 flex flex-col gap-3 rounded-2xl border border-black/5 bg-neutral-50/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Word + IPA badges using font-sans for words & font-ipa for phonetics */}
          <span className="whitespace-nowrap rounded-xl border border-amber-300 bg-amber-100/90 px-3.5 py-1.5 text-amber-950 text-sm sm:text-base font-bold shadow-xs">
            <span className="font-sans font-extrabold mr-1">sheep</span>
            <span className="font-ipa font-normal text-amber-900">/iː/</span>
          </span>
          <span className="font-mono text-xs text-neutral-400 font-bold uppercase">vs</span>
          <span className="whitespace-nowrap rounded-xl border border-sky-300 bg-sky-100/90 px-3.5 py-1.5 text-sky-950 text-sm sm:text-base font-bold shadow-xs">
            <span className="font-sans font-extrabold mr-1">ship</span>
            <span className="font-ipa font-normal text-sky-900">/ɪ/</span>
          </span>
        </div>
        <p className="font-sans text-xs sm:text-sm text-neutral-600 leading-relaxed">
          También <span className="font-ipa font-bold text-neutral-800">/æ/–/ʌ/</span>,{" "}
          <span className="font-ipa font-bold text-neutral-800">/b/–/v/</span> y la &quot;e&quot; de apoyo en <span className="font-sans italic font-semibold text-neutral-800">school</span>.
        </p>
      </div>
    ),
  },
  {
    id: "habla-conectada",
    tag: "habla conectada",
    title: "Habla conectada",
    subtitle: "reducción & asimilación",
    badge: "Velocidad real",
    description:
      "Escucha cómo las palabras se unen y se transforman en velocidad normal vs lenta.",
    content: (
      <div className="my-4 flex flex-col gap-3 rounded-2xl border border-black/5 bg-neutral-50/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2.5 text-base font-bold text-neutral-800">
          <span className="font-sans font-extrabold text-neutral-900 whitespace-nowrap">did you →</span>
          <span className="whitespace-nowrap rounded-xl border border-rose-300 bg-rose-100 px-3.5 py-1.5 font-bold text-rose-950 font-ipa text-base sm:text-lg shadow-xs">
            /dɪdʒuː/
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap rounded-full bg-black px-3.5 py-1 text-xs font-sans font-bold text-white shadow-xs">
            Normal (1.0x)
          </span>
          <span className="whitespace-nowrap rounded-full border border-neutral-300 bg-white px-3.5 py-1 text-xs font-sans font-semibold text-neutral-800 shadow-xs">
            Lenta (0.7x)
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "articulacion",
    tag: "articulación",
    title: "Articulación",
    subtitle: "posicionamiento físico",
    badge: "think /θ/",
    description:
      "Aprende exactamente dónde colocar la lengua, el aire y la voz para sonar natural.",
    content: (
      <div className="my-4 grid grid-cols-3 gap-2 rounded-2xl border border-black/5 bg-neutral-50/80 p-3">
        <div className="rounded-xl bg-white p-2.5 shadow-xs border border-black/5">
          <p className="font-mono text-[10px] font-bold tracking-wider uppercase text-neutral-400">
            Lengua
          </p>
          <p className="mt-0.5 font-sans font-bold text-xs sm:text-sm text-neutral-900 leading-tight">Entre dientes</p>
        </div>
        <div className="rounded-xl bg-white p-2.5 shadow-xs border border-black/5">
          <p className="font-mono text-[10px] font-bold tracking-wider uppercase text-neutral-400">
            Aire
          </p>
          <p className="mt-0.5 font-sans font-bold text-xs sm:text-sm text-neutral-900 leading-tight">Sale suave</p>
        </div>
        <div className="rounded-xl bg-white p-2.5 shadow-xs border border-black/5">
          <p className="font-mono text-[10px] font-bold tracking-wider uppercase text-neutral-400">
            Voz
          </p>
          <p className="mt-0.5 font-sans font-bold text-xs sm:text-sm text-neutral-900 leading-tight">Sorda</p>
        </div>
      </div>
    ),
  },
];

export function PracticeCardPhonetics() {
  const [activeSlide, setActiveSlide] = useState(0);

  const currentFeature = PHONETIC_SLIDES[activeSlide];

  const handlePrev = () => {
    setActiveSlide((prev) => (prev === 0 ? PHONETIC_SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev === PHONETIC_SLIDES.length - 1 ? 0 : prev + 1));
  };

  return (
    <PastelCard tone="coral" className="flex flex-col gap-6 lg:flex-row lg:gap-7 p-6 sm:p-7">
      {/* Left Column: Title, Interactive Tags & Callout */}
      <div className="flex flex-1 flex-col justify-between gap-5">
        <div>
          {/* Header Icon + Kicker */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/10 text-black select-none dark:bg-white/10 dark:text-white">
              <Ear className="h-5 w-5" />
            </div>
            <span className="font-mono text-xs font-bold tracking-widest uppercase text-ink-secondary">
              Oído y fonética
            </span>
          </div>

          <h3 className="mt-3.5 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-ink leading-snug">
            Entrena el oído que el español no te dio.
          </h3>

          <p className="mt-2.5 font-sans text-xs sm:text-sm leading-relaxed text-ink-secondary text-pretty">
            Ves el ritmo del inglés, escuchas los sonidos que confundes y
            aprendes dónde va la lengua.
          </p>

          {/* Interactive Feature Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {PHONETIC_SLIDES.map((slide, index) => {
              const isActive = index === activeSlide;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-mono font-bold tracking-wide uppercase transition-all cursor-pointer whitespace-nowrap",
                    isActive
                      ? "bg-black text-white shadow-xs dark:bg-white dark:text-black"
                      : "bg-white/60 text-ink hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40"
                  )}
                >
                  {slide.tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Dark Box */}
        <div className="rounded-2xl bg-[var(--ink)] p-4 text-white shadow-xs">
          <p className="font-display text-sm font-bold text-white">Por eso no oyes el &quot;to&quot;.</p>
          <p className="mt-1 font-sans text-xs sm:text-sm leading-relaxed text-neutral-300">
            En una frase real se reduce a{" "}
            <span className="font-ipa font-bold text-amber-300 text-sm sm:text-base px-1">/tə/</span>.
            Aquí aprendes a no buscarlo.
          </p>
        </div>
      </div>

      {/* Right Column: Feature Carousel Card */}
      <div className="flex flex-1 flex-col justify-between rounded-2xl border border-black/10 bg-white/95 p-5 shadow-xs">
        {/* Carousel Header Controls */}
        <div>
          <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            {/* Title & Badge */}
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h4 className="font-display font-extrabold text-base tracking-tight text-neutral-900 whitespace-nowrap">
                {currentFeature.title}
              </h4>
              <span className="whitespace-nowrap rounded-full bg-rose-100 border border-rose-200/80 px-2.5 py-0.5 font-mono text-[10px] font-bold text-rose-900 uppercase tracking-wider">
                {currentFeature.badge}
              </span>
            </div>

            {/* Navigation Arrows & Counter */}
            <div className="flex items-center gap-1.5 shrink-0 select-none">
              <span className="font-mono text-xs font-bold text-neutral-400 whitespace-nowrap mr-0.5">
                {activeSlide + 1} / {PHONETIC_SLIDES.length}
              </span>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Anterior función"
                className="flex h-7.5 w-7.5 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 transition-all hover:bg-neutral-100 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Siguiente función"
                className="flex h-7.5 w-7.5 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 transition-all hover:bg-neutral-100 active:scale-95 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Subtitle note in DM Mono */}
          <p className="mt-2 text-xs font-mono font-medium text-neutral-500">
            {currentFeature.subtitle}
          </p>

          {/* Active Feature Content */}
          {currentFeature.content}
        </div>

        {/* Feature description note */}
        <div className="border-t border-neutral-100 pt-3 font-sans text-xs sm:text-sm text-neutral-700 leading-relaxed font-medium">
          {currentFeature.description}
        </div>
      </div>
    </PastelCard>
  );
}
