"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MinimalPairsRunner } from "@/components/sounds/MinimalPairsRunner";
import { MinimalPairsSidebar } from "@/components/phoneme-practice/MinimalPairsSidebar";
import { MINIMAL_PAIR_CONTRASTS } from "@/lib/sounds/minimal-pairs";
import { DEFAULT_CONTRAST_CATEGORY, contrastsByCategory, type ContrastCategory } from "@/lib/sounds/contrast-categories";

// Planned structure:
// <MinimalPairsWorkspace>
//   <MinimalPairsWorkspaceGrid>
//     <MinimalPairsRunner />     — Main Butter PastelCard (left column, 8 cols)
//     <MinimalPairsSidebar />    — Contrast list & Weekly stats cards (right column, 4 cols)
//   </MinimalPairsWorkspaceGrid>
// </MinimalPairsWorkspace>
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
  const otherCategory = activeCategory === "vowel" ? "consonant" : "vowel";
  const otherCategoryCount = grouped[otherCategory]?.length ?? 5;

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
    <section className="sound-lab__minimal-pairs space-y-6 max-w-[1280px] mx-auto" aria-label="Práctica de pares mínimos">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Principal (Izquierda) — 8 columnas */}
        <div className="lg:col-span-8">
          <MinimalPairsRunner
            key={activeContrast.id}
            initialPhoneme={activeContrast.phonemeA}
            initialContrastId={activeContrast.id}
          />
        </div>

        {/* Columna Lateral (Derecha) — 4 columnas */}
        <div className="lg:col-span-4">
          <MinimalPairsSidebar
            activeCategory={activeCategory}
            activeContrastId={activeContrast.id}
            categoryContrasts={categoryContrasts}
            otherCategoryCount={otherCategoryCount}
            onSelectCategory={selectCategory}
            onSelectContrast={selectContrast}
          />
        </div>
      </div>
    </section>
  );
}
