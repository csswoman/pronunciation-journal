"use client";

import { Headphones } from "@/components/icons";
import type { MinimalPairContrast } from "@/lib/sounds/minimal-pairs";
import { ContrastChip } from "./ContrastChip";

export function MinimalPairsUnavailable({
  initialPhoneme,
  contrasts,
  onSelect,
}: {
  initialPhoneme?: string;
  contrasts: MinimalPairContrast[];
  onSelect: (index: number) => void;
}) {
  return (
    <section className="ipa-chart__section" aria-label="Pares mínimos">
      <header className="ipa-chart__mp-head">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="ipa-chart__mp-icon shrink-0" aria-hidden>
            <Headphones size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="ipa-chart__section-title">Pares mínimos</h2>
            <p className="ipa-chart__lead">Elige un contraste para entrenar tu oído.</p>
          </div>
        </div>
      </header>
      <div className="ipa-chart__mpchips">
        {contrasts.map((contrast, index) => (
          <ContrastChip
            key={contrast.id}
            contrast={contrast}
            isActive={false}
            onClick={() => onSelect(index)}
          />
        ))}
      </div>
      <div className="ipa-chart__done">
        <p className="ipa-chart__done-title">Todavía no hay un contraste para este sonido</p>
        <p className="ipa-chart__done-score">
          {initialPhoneme
            ? `${initialPhoneme} aún no tiene una sesión de pares mínimos definida.`
            : "Selecciona uno de los contrastes disponibles para empezar."}
        </p>
      </div>
    </section>
  );
}
