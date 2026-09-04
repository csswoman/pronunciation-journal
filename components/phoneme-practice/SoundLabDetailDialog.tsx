"use client";

// Planned structure:
// <SoundLabDetailDialog>
//   <Backdrop />
//   <ModalCard>
//     <ModalHeader />     — Badges (Tipo, Dificultad) + CloseButton
//     <IpaHero />         — Símbolo IPA interactivo + "como en {palabra}"
//     <ExamplesRow />     — Botones de audio [▷ see] [▷ tree] [▷ key]
//     <SpanishTipCard />  — Caja "El truco"
//     <ArticulationAccordion /> — "Cómo se produce este sonido" (colapsable)
//     <PracticeAction />  — Botón "Practicar ahora"
//   </ModalCard>
// </SoundLabDetailDialog>

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ChevronDown, Play, X } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import { PillButton } from "@/components/ui/PillButton";
import type { Lesson } from "@/lib/types";
import type { PhonemeData } from "@/components/ipa/data";
import { IPA_EXTRA } from "@/lib/pronunciation/ipa-data";
import { playIpaSound } from "@/lib/pronunciation/ipa-audio";
import { canonicalizeSoundIpa, SOUND_CLASS_SINGULAR_LABELS } from "@/lib/sounds/inventory";
import { getSoundLearnerHint } from "@/lib/sounds/copy";
import { parseSoundDuration } from "@/lib/sounds/duration";
import { getArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";
import { SagittalDiagram } from "@/components/pronunciation/SagittalDiagram";
import { useSpeakWord } from "@/hooks/useSpeakWord";
import { cn } from "@/lib/cn";

interface SoundLabDetailDialogProps {
  dialogRef: RefObject<HTMLDivElement | null>;
  phoneme: PhonemeData;
  lesson: Lesson;
  progressPct?: number; isWeak?: boolean; isContinuing?: boolean; practiceHref?: string;
  onPractice: () => void;
  onClose: () => void;
}

const DIFFICULTY_LABELS: Record<string, string> = { easy: "Fácil", medium: "Medio", hard: "Difícil" };

export function SoundLabDetailDialog({ dialogRef, phoneme, lesson, onPractice, onClose }: SoundLabDetailDialogProps) {
  const [showArticulation, setShowArticulation] = useState(false);
  const [ipaPlaying, setIpaPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { speaking, speak, stop } = useSpeakWord();

  const extra = IPA_EXTRA[canonicalizeSoundIpa(phoneme.symbol)];
  const soundTypeLabel = SOUND_CLASS_SINGULAR_LABELS[phoneme.type] ?? "Vocal";
  const difficulty = extra?.difficulty ?? lesson.difficulty ?? "easy";
  const difficultyLabel = DIFFICULTY_LABELS[difficulty] ?? "Fácil";
  const hint = getSoundLearnerHint(phoneme);
  const duration = parseSoundDuration(lesson.description);
  const guide = getArticulationGuide(phoneme.symbol);

  const examples = useMemo(() => {
    const canonical = [...new Set(phoneme.examples)].filter(Boolean).slice(0, 3);
    return canonical.length > 0 ? canonical : [...new Set(lesson.words.map((w) => w.word))].filter(Boolean).slice(0, 3);
  }, [lesson.words, phoneme.examples]);

  const anchorWord = examples[0] ?? lesson.words[0]?.word ?? "";
  const articulationSteps = extra?.articulationEs?.length ? extra.articulationEs : phoneme.tips;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [onClose]);

  function handlePlayIpa() {
    if (ipaPlaying) return;
    setIpaPlaying(true);
    const result = playIpaSound(phoneme.rawSymbol, {
      onStart: () => setIpaPlaying(true),
      onEnd: () => setIpaPlaying(false),
      onError: () => setIpaPlaying(false),
    });
    audioRef.current = result?.kind === "audio" ? result.audio : null;
    if (!result) setIpaPlaying(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-[440px] sm:max-w-[580px] md:max-w-[620px] max-h-[90vh] overflow-y-auto rounded-3xl border border-border-default bg-surface-raised p-5 sm:p-7 text-fg shadow-2xl focus:outline-none flex flex-col items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sound-dialog-ipa"
        tabIndex={-1}
      >
        {/* Header: Badges & Close */}
        <div className="w-full flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge label={soundTypeLabel} variant="default" size="sm" />
            <Badge label={difficultyLabel} variant="neutral" size="sm" />
            {duration && (
              <Badge
                label={duration === "long" ? "Larga" : "Corta"}
                variant="neutral"
                size="sm"
              />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-sunken hover:text-fg transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        {/* IPA Symbol Hero */}
        <button
          id="sound-dialog-ipa"
          type="button"
          onClick={handlePlayIpa}
          className={cn(
            "font-ipa text-5xl sm:text-6xl font-bold tracking-tight text-primary hover:opacity-90 active:scale-95 transition-all cursor-pointer select-none mb-1 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl px-3 py-1",
            ipaPlaying && "text-primary animate-pulse",
          )}
          aria-label={`Reproducir sonido ${phoneme.symbol}`}
          title="Toca para oír el sonido"
        >
          {phoneme.symbol}
        </button>

        {/* Anchor Word & Friendly Hint */}
        {anchorWord && (
          <p className="text-body-sm sm:text-body text-fg-muted font-normal mb-1">
            como en <span className="text-primary font-semibold">{anchorWord}</span>
          </p>
        )}
        <p className="text-caption sm:text-body-sm text-fg-muted text-center max-w-md mb-4 leading-relaxed font-normal">
          {hint}
        </p>

        {/* Examples Audio Pills */}
        {examples.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {examples.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => (speaking === word ? stop() : speak(word))}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-sunken px-3.5 py-1.5 text-caption font-medium text-fg hover:border-border-strong hover:bg-surface-raised active:scale-95 transition-all cursor-pointer",
                  speaking === word && "border-primary bg-primary-soft text-primary shadow-xs",
                )}
                aria-label={`Pronunciar ${word}`}
              >
                <Play
                  size={10}
                  className={cn(
                    "fill-current shrink-0 text-fg-subtle transition-colors",
                    speaking === word && "text-primary fill-primary animate-pulse",
                  )}
                  aria-hidden
                />
                <span>{word}</span>
              </button>
            ))}
          </div>
        )}

        {/* Spanish Tip Box: "El truco" */}
        {extra?.spanishTip && (
          <aside className="w-full rounded-2xl border border-border-default bg-surface-sunken p-4 text-left mb-2.5">
            <p className="text-body-sm font-bold text-fg mb-1">El truco</p>
            <p className="text-caption sm:text-body-sm text-fg-muted leading-relaxed font-normal">
              {extra.spanishTip}
            </p>
          </aside>
        )}

        {/* Articulation Disclosure: "Cómo se produce este sonido" */}
        <div className="w-full flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowArticulation((prev) => !prev)}
            className="inline-flex items-center justify-center gap-1.5 text-caption sm:text-body-sm text-fg-muted hover:text-fg transition-colors py-1.5 cursor-pointer w-full text-center"
            aria-expanded={showArticulation}
          >
            <ChevronDown size={14} className={cn("transition-transform duration-200", showArticulation && "rotate-180")} aria-hidden />
            <span>{showArticulation ? "Ocultar cómo se produce" : "Cómo se produce este sonido"}</span>
          </button>

          {showArticulation && (
            <div className="w-full rounded-2xl border border-border-default bg-surface-sunken/60 p-4 text-left mt-1 mb-2 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-[210px_1fr] gap-4 items-center">
                {guide && (
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-base border border-border-subtle">
                    <SagittalDiagram guide={guide} isAnimating={true} speed="normal" />
                    <div className="w-full flex items-center justify-between pt-2 mt-1 border-t border-border-subtle text-[11px] text-fg-muted">
                      <span className="font-medium text-fg">Posición: {guide.placeEs}</span>
                      <span className="text-fg-subtle">{guide.vocalCordsVibrate ? "Con voz" : "Sin voz"}</span>
                    </div>
                  </div>
                )}
                {articulationSteps && articulationSteps.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider">
                      Paso a paso con tu boca
                    </p>
                    <ol className="flex flex-col gap-2">
                      {articulationSteps.map((step, i) => (
                        <li key={step} className="flex items-start gap-2 text-caption text-fg-muted leading-relaxed">
                          <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-border-subtle text-[10px] font-bold text-fg mt-0.5">
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button with Theme Fill */}
        <PillButton
          variant="primary"
          size="md"
          onClick={onPractice}
          className="w-full py-3 text-body-sm sm:text-body font-semibold rounded-full shadow-sm mt-2.5 cursor-pointer justify-center"
        >
          Practicar ahora
        </PillButton>
      </div>
    </div>
  );
}
