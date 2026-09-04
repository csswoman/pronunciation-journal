"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MinimalPairsRunner } from "@/components/sounds/MinimalPairsRunner";
import { MINIMAL_PAIR_CONTRASTS } from "@/lib/sounds/minimal-pairs";
import {
  contrastsByCategory,
  DEFAULT_CONTRAST_CATEGORY,
  type ContrastCategory,
} from "@/lib/sounds/contrast-categories";
import { MinimalPairsSidebar } from "./MinimalPairsSidebar";
import { ContrastMouthComparison } from "./ContrastMouthComparison";

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
    <section className="sound-lab__minimal-pairs space-y-4" aria-label="Práctica de pares mínimos">
      {/* Selector superior horizontal para pantallas móviles / tablets estrechas */}
      <div className="sound-lab__contrast-selector lg:hidden">
        <div className="sound-lab__contrast-row">
          <div
            className="sound-lab__contrast-category-picker"
            role="group"
            aria-label="Categoría de contraste"
          >
            {(Object.keys(CATEGORY_LABELS) as ContrastCategory[]).map((category) => (
              <button
                key={category}
                type="button"
                className="sound-lab__contrast-category-option"
                data-active={category === activeCategory ? "true" : undefined}
                aria-pressed={category === activeCategory}
                onClick={() => selectCategory(category)}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>

          <div className="sound-lab__contrast-row-divider" aria-hidden />

          <div className="sound-lab__contrast-picker" role="group" aria-label="Contrastes de sonido">
            {categoryContrasts.map((contrast) => {
              const isActive = contrast.id === activeContrast.id;
              return (
                <button
                  key={contrast.id}
                  type="button"
                  className="sound-lab__contrast-option"
                  data-active={isActive ? "true" : undefined}
                  aria-pressed={isActive}
                  onClick={() => selectContrast(contrast.id)}
                >
                  <span className="font-ipa text-body-sm font-semibold">{contrast.phonemeA}</span>
                  <span className="text-fg-subtle font-caption opacity-60" aria-hidden>/</span>
                  <span className="font-ipa text-body-sm font-semibold">{contrast.phonemeB}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Layout principal: 2 columnas en desktop (ejercicio + comparación de boca a la izquierda, sidebar navegable a la derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px] items-start gap-5">
        <div className="flex flex-col gap-4 min-w-0">
          <ContrastMouthComparison
            phonemeA={activeContrast.phonemeA}
            phonemeB={activeContrast.phonemeB}
          />

          <MinimalPairsRunner
            key={activeContrast.id}
            initialPhoneme={activeContrast.phonemeA}
            initialContrastId={activeContrast.id}
          />
        </div>

        {/* Sidebar exclusivo para Desktop (sticky, cómodo de scrollear y ver todos los pares) */}
        <div className="hidden lg:block sticky top-6">
          <MinimalPairsSidebar
            activeCategory={activeCategory}
            activeContrastId={activeContrast.id}
            categoryContrasts={categoryContrasts}
            onSelectCategory={selectCategory}
            onSelectContrast={selectContrast}
          />
        </div>
      </div>
    </section>
  );
}
