"use client";

// Planned structure:
// <OnboardingStep2Level>
//   <LeftInfoColumn: kicker, title, desc, placementPromptCard, footnote />
//   <RightLevelOptionsStack: 5 CEFR Level cards (A1-C1) with radio indicators />
// </OnboardingStep2Level>

import Link from "next/link";
import { Check } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { CefrLevel } from "@/lib/essential-words/types";
import { ONBOARDING_CEFR_OPTIONS } from "../welcome-tour-data";

interface OnboardingStep2LevelProps {
  selectedLevel: CefrLevel;
  onSelectLevel: (level: CefrLevel) => void;
  onFinishTour: () => void;
}

export default function OnboardingStep2Level({
  selectedLevel,
  onSelectLevel,
  onFinishTour,
}: OnboardingStep2LevelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      {/* Columna izquierda: Título y sugerencia de nivelación */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-caption text-fg-subtle tracking-wider uppercase font-semibold">
            Antes de empezar
          </span>
          <h2 className="font-heading text-h2 font-extrabold text-fg tracking-tight leading-tight">
            ¿Hasta dónde entiendes sin traducir?
          </h2>
          <p className="text-body-md text-fg-muted">
            Elige la frase más difícil que entiendas a la primera. Con eso armamos tus lecciones y tu vocabulario.
          </p>
        </div>

        {/* Tarjeta de ayuda para nivelación */}
        <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-sunken p-4 flex flex-col gap-2">
          <span className="text-body-sm font-bold text-fg">¿No estás segura?</span>
          <Link
            href="/assessment?mode=placement"
            onClick={onFinishTour}
            className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:underline"
          >
            <span>Haz la prueba rápida de nivel</span>
            <span aria-hidden>→</span>
          </Link>
        </div>

        <p className="text-caption text-fg-subtle">
          No es examen. Puedes cambiar tu nivel cuando quieras en Perfil.
        </p>
      </div>

      {/* Columna derecha: Lista de 5 niveles CEFR */}
      <div className="lg:col-span-7 flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        {ONBOARDING_CEFR_OPTIONS.map((opt) => {
          const isSelected = selectedLevel === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              data-tone={opt.tone}
              onClick={() => onSelectLevel(opt.id)}
              className={cn(
                "pastel-card w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer",
                isSelected
                  ? "ring-2 ring-primary shadow-md scale-[1.01]"
                  : "hover:scale-[1.005] opacity-90 hover:opacity-100"
              )}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex flex-col items-center justify-center shrink-0 w-16 border-r border-ink/15 pr-3">
                  <span className="font-heading text-h3 font-extrabold text-ink leading-none">{opt.badge}</span>
                  <span className="text-[11px] font-semibold text-ink-muted leading-tight mt-0.5 text-center">{opt.name}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-body-sm font-bold text-ink truncate">{opt.en}</p>
                  <p className="text-caption text-ink-secondary truncate">{opt.es}</p>
                </div>
              </div>

              <div
                className={cn(
                  "size-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  isSelected
                    ? "bg-primary border-primary text-primary-fg"
                    : "border-ink/30 bg-paper/60 text-transparent"
                )}
              >
                <Check size={14} strokeWidth={3} aria-hidden />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
