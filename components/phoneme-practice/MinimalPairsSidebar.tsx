"use client";

import { cn } from "@/lib/cn";
import type { MinimalPairContrast } from "@/lib/sounds/minimal-pairs";
import type { ContrastCategory } from "@/lib/sounds/contrast-categories";

const CATEGORY_LABELS: Record<ContrastCategory, string> = {
  vowel: "Vocales",
  consonant: "Consonantes",
};

interface MinimalPairsSidebarProps {
  activeCategory: ContrastCategory;
  activeContrastId: string;
  categoryContrasts: MinimalPairContrast[];
  onSelectCategory: (category: ContrastCategory) => void;
  onSelectContrast: (id: string) => void;
  className?: string;
}

// Sub-components: Category segmented control, Contrast vertical list item
export function MinimalPairsSidebar({
  activeCategory,
  activeContrastId,
  categoryContrasts,
  onSelectCategory,
  onSelectContrast,
  className = "",
}: MinimalPairsSidebarProps) {
  return (
    <aside
      className={cn(
        "sound-lab__pairs-sidebar flex flex-col rounded-2xl border border-border-default bg-surface-raised p-3.5 shadow-xs",
        className,
      )}
      aria-label="Selección de pares fonéticos"
    >
      {/* 1. Selector de categoría tipo segmented control */}
      <div className="mb-3.5 flex flex-col gap-2">
        <span className="font-label text-xs font-semibold text-fg-muted uppercase tracking-wider">
          Tipo de sonido
        </span>
        <div
          className="grid grid-cols-2 gap-1 rounded-full border border-border-subtle bg-surface-sunken p-1"
          role="group"
          aria-label="Categoría de sonido"
        >
          {(Object.keys(CATEGORY_LABELS) as ContrastCategory[]).map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                className={cn(
                  "inline-flex min-h-[34px] items-center justify-center rounded-full px-3 py-1 font-caption text-xs font-semibold transition-all duration-150 select-none",
                  isActive
                    ? "bg-surface-raised text-primary shadow-xs font-bold"
                    : "text-fg-muted hover:text-fg",
                )}
                data-active={isActive ? "true" : undefined}
                aria-pressed={isActive}
                onClick={() => onSelectCategory(category)}
              >
                {CATEGORY_LABELS[category]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Lista de contrastes con scroll vertical */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-label text-xs font-semibold text-fg-muted uppercase tracking-wider">
            Contrastes ({categoryContrasts.length})
          </span>
          <span className="font-caption text-[11px] text-fg-subtle">
            {activeCategory === "vowel" ? "Vocálicos" : "Consonánticos"}
          </span>
        </div>

        <div
          role="listbox"
          aria-label="Contrastes de fonemas"
          className="sound-lab__pairs-sidebar-list flex flex-col gap-1 max-h-[480px] overflow-y-auto pr-1"
        >
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
                  "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all duration-150 border select-none",
                  isActive
                    ? "border-primary/40 bg-primary-soft text-primary font-semibold shadow-xs"
                    : "border-transparent text-fg-muted hover:border-border-subtle hover:bg-surface-sunken hover:text-fg",
                )}
              >
                <span className="flex items-center gap-1.5 font-ipa text-body-sm font-semibold">
                  <span className={cn(isActive ? "text-primary font-bold" : "text-fg")}>
                    {contrast.phonemeA}
                  </span>
                  <span className="text-fg-subtle font-caption opacity-40" aria-hidden>
                    vs
                  </span>
                  <span className={cn(isActive ? "text-primary font-bold" : "text-fg")}>
                    {contrast.phonemeB}
                  </span>
                </span>

                <span
                  className={cn(
                    "font-caption text-xs tabular-nums transition-colors",
                    isActive ? "text-primary font-medium" : "text-fg-subtle group-hover:text-fg-muted",
                  )}
                >
                  {contrast.pairs.length} pares
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
