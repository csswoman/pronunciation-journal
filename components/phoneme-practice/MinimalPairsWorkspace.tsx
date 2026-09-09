"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MinimalPairsRunner } from "@/components/sounds/MinimalPairsRunner";
import { MINIMAL_PAIR_CONTRASTS } from "@/lib/sounds/minimal-pairs";
import { DEFAULT_CONTRAST_CATEGORY, contrastsByCategory, type ContrastCategory } from "@/lib/sounds/contrast-categories";

const CATEGORY_LABELS: Record<ContrastCategory, string> = {
  vowel: "Vocales",
  consonant: "Consonantes",
};

// Sub-components: Category picker group, Contrast pair picker group, MinimalPairsSidebar, ContrastMouthComparison, MinimalPairsRunner
export default function MinimalPairsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const grouped = useMemo(() => contrastsByCategory(MINIMAL_PAIR_CONTRASTS), []);

  const requestedId = searchParams.get("contrast");
  const requestedCategory = searchParams.get("category") as ContrastCategory | null;

  const activeContrast =
    MINIMAL_PAIR_CONTRASTS.find((contrast) => contrast.id === requestedId) ??
    grouped[DEFAULT_CONTRAST_CATEGORY][0];

  const activeCategory: ContrastCategory =
    requestedCategory && grouped[requestedCategory]
      ? requestedCategory
      : grouped.vowel.some((c) => c.id === activeContrast.id)
        ? "vowel"
        : "consonant";

  const categoryContrasts = grouped[activeCategory];

  function selectContrast(id: string) {
    router.replace(
      `/practice/sounds?tab=minimal-pairs&category=${activeCategory}&contrast=${encodeURIComponent(id)}`,
      { scroll: false },
    );
  }

  function selectCategory(category: ContrastCategory) {
    const first = grouped[category][0];
    router.replace(
      `/practice/sounds?tab=minimal-pairs&category=${category}&contrast=${encodeURIComponent(first.id)}`,
      { scroll: false },
    );
  }

  return (
    <section className="sound-lab__minimal-pairs space-y-4 max-w-2xl mx-auto" aria-label="Práctica de pares mínimos">
      {/* 1. Toggle único Vocales / Consonantes */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="inline-flex p-1 rounded-full bg-surface-sunken border border-border-subtle"
          role="group"
          aria-label="Tipo de fonema"
        >
          {(Object.keys(CATEGORY_LABELS) as ContrastCategory[]).map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                className={`px-4 py-1.5 rounded-full font-caption text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-surface-raised text-primary shadow-xs font-bold"
                    : "text-fg-muted hover:text-fg"
                }`}
                aria-pressed={isActive}
                onClick={() => selectCategory(category)}
              >
                {CATEGORY_LABELS[category]}
              </button>
            );
          })}
        </div>

        {/* 2. Un solo selector de contraste (dropdown estilizado) */}
        <div className="w-full">
          <label htmlFor="contrast-select" className="sr-only">
            Seleccionar contraste
          </label>
          <div className="relative">
            <select
              id="contrast-select"
              value={activeContrast.id}
              onChange={(e) => selectContrast(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border-default bg-surface-raised px-4 py-2.5 pr-10 text-body-sm font-semibold text-fg shadow-xs transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              {categoryContrasts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.phonemeA} vs {c.phonemeB} · {c.pairs.length} pares
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tarjeta de práctica principal con boca integrada */}
      <MinimalPairsRunner
        key={activeContrast.id}
        initialPhoneme={activeContrast.phonemeA}
        initialContrastId={activeContrast.id}
      />

      {/* 4. Accesos directos sutiles en fila a otros contrastes */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
        {categoryContrasts.map((c) => {
          const isActive = c.id === activeContrast.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => selectContrast(c.id)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-caption text-xs transition-colors ${
                isActive
                  ? "bg-primary-soft text-primary font-bold border border-primary/30"
                  : "bg-surface-sunken text-fg-muted hover:text-fg border border-border-subtle"
              }`}
            >
              <span className="font-ipa">{c.phonemeA} vs {c.phonemeB}</span>
              <span className="opacity-50">· {c.pairs.length}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
