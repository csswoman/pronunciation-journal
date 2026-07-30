"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MinimalPairsRunner } from "@/components/sounds/MinimalPairsRunner";
import { MINIMAL_PAIR_CONTRASTS } from "@/lib/sounds/minimal-pairs";

export default function MinimalPairsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("contrast");
  const activeContrast =
    MINIMAL_PAIR_CONTRASTS.find((contrast) => contrast.id === requestedId) ??
    MINIMAL_PAIR_CONTRASTS[0];

  function selectContrast(id: string) {
    router.replace(`/practice/sounds?tab=minimal-pairs&contrast=${encodeURIComponent(id)}`, {
      scroll: false,
    });
  }

  return (
    <section className="sound-lab__minimal-pairs" aria-label="Práctica de pares mínimos">
      <div className="sound-lab__contrast-picker" role="group" aria-label="Contrastes de sonido">
        {MINIMAL_PAIR_CONTRASTS.map((contrast) => {
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
              <span className="font-ipa">{contrast.phonemeA}</span>
              <span aria-hidden>vs</span>
              <span className="font-ipa">{contrast.phonemeB}</span>
            </button>
          );
        })}
      </div>

      <p className="sound-lab__contrast-hint text-body-sm text-fg-muted">
        {activeContrast.hint}
      </p>

      <MinimalPairsRunner
        key={activeContrast.id}
        initialPhoneme={activeContrast.phonemeA}
        initialContrastId={activeContrast.id}
      />
    </section>
  );
}
