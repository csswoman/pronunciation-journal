"use client";

import PastelCard from "@/components/layout/PastelCard";
import { cn } from "@/lib/cn";
import type { MinimalPairContrast } from "@/lib/sounds/minimal-pairs";
import type { ContrastCategory } from "@/lib/sounds/contrast-categories";

interface MinimalPairsSidebarProps {
  activeCategory: ContrastCategory;
  activeContrastId: string;
  categoryContrasts: MinimalPairContrast[];
  otherCategoryCount?: number;
  accuracyScore?: string; // e.g. "6/8"
  weeklyAccuracyPct?: number; // e.g. 75
  hardestContrastLabel?: string; // e.g. "/æ/ vs /ʌ/"
  onSelectCategory: (category: ContrastCategory) => void;
  onSelectContrast: (id: string) => void;
  className?: string;
}

// Sub-components: Contrast list card, Weekly stats pastel card
export function MinimalPairsSidebar({
  activeCategory,
  activeContrastId,
  categoryContrasts,
  otherCategoryCount = 5,
  accuracyScore = "6/8",
  weeklyAccuracyPct = 75,
  hardestContrastLabel = "/æ/ vs /ʌ/",
  onSelectCategory,
  onSelectContrast,
  className = "",
}: MinimalPairsSidebarProps) {
  const isVowel = activeCategory === "vowel";
  const title = isVowel ? "PARES DE VOCALES" : "PARES DE CONSONANTES";
  const toggleLabel = isVowel
    ? `Ver consonantes (${otherCategoryCount})`
    : `Ver vocales (${otherCategoryCount})`;

  return (
    <aside className={cn("space-y-4", className)} aria-label="Selección de pares y estadísticas">
      {/* 1. Tarjeta de selección de pares */}
      <div className="rounded-2xl border border-border-default bg-surface-raised p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-kicker font-bold text-xs uppercase tracking-wider text-fg-muted">
            {title}
          </span>
          <span className="w-5 h-5 rounded-full bg-surface-sunken border border-border-subtle text-fg ts-badge flex items-center justify-center">
            {categoryContrasts.length}
          </span>
        </div>

        <div role="listbox" aria-label="Lista de contrastes" className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto pr-1">
          {categoryContrasts.map((contrast) => {
            const isActive = contrast.id === activeContrastId;
            return (
              <button
                key={contrast.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => onSelectContrast(contrast.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all duration-150 border select-none cursor-pointer",
                  isActive
                    ? "bg-surface-sunken border-border-subtle text-fg font-bold shadow-2xs"
                    : "border-transparent text-fg-muted hover:text-fg hover:bg-surface-sunken/60 font-medium",
                )}
              >
                <span className="ts-ipa-sm">
                  {contrast.phonemeA} vs {contrast.phonemeB}
                </span>

                {isActive ? (
                  <span className="bg-primary text-on-primary ts-badge px-2.5 py-0.5 rounded-full tabular-nums">
                    {accuracyScore}
                  </span>
                ) : (
                  <span className="font-caption text-xs text-fg-muted tabular-nums">
                    {contrast.pairs.length} pares
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onSelectCategory(isVowel ? "consonant" : "vowel")}
          className="w-full mt-2 rounded-full border border-border-default bg-surface-sunken hover:bg-surface-raised py-2.5 px-4 ts-button text-fg transition-colors text-center cursor-pointer select-none"
        >
          {toggleLabel}
        </button>
      </div>

      {/* 2. Tarjeta pastel de estadísticas semanales (Mentol) */}
      <PastelCard tone="mint" className="p-5 space-y-3 rounded-2xl">
        <span className="font-kicker font-bold text-xs uppercase tracking-wider text-ink/70 block">
          TU OÍDO ESTA SEMANA
        </span>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="ts-display-numeral text-ink">
            {weeklyAccuracyPct} %
          </span>
          <span className="ts-label-strong text-ink/80">
            de acierto
          </span>
        </div>

        <div className="w-full h-2.5 bg-ink/15 rounded-full overflow-hidden mt-3" aria-hidden>
          <div
            className="h-full bg-ink rounded-full transition-all duration-500"
            style={{ width: `${weeklyAccuracyPct}%` }}
          />
        </div>

        <p className="ts-body text-ink/80 mt-3 pt-1">
          El par que más te cuesta:{" "}
          <strong className="ts-ipa-sm text-ink font-bold">{hardestContrastLabel}</strong>
        </p>
      </PastelCard>
    </aside>
  );
}
