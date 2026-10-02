"use client";

// Planned structure:
// <SpanishSpeakersGrid>
//   <SpanishFocusHeader>
//     <TitleAndBadge />
//   </SpanishFocusHeader>
//   <PhonemeCardsGrid>
//     <PhonemeCard />
//   </PhonemeCardsGrid>
// </SpanishSpeakersGrid>

import { Check } from "@/components/icons";
import { IPA_EXTRA } from "@/lib/pronunciation/ipa-data";
import { HARD_FOR_SPANISH_SPEAKERS } from "@/lib/pronunciation/ipa-data";
import { PHONEMES, PHONEME_MATRIX, type PhonemeData } from "./data";

const SPANISH_HARD_TIPS: Record<string, string> = {
  "/æ/": "No existe en español y aparece en todas partes.",
  "/ʌ/": "Un “uh” corto y seco, como un golpe suave.",
  "/ɜr/": "La vocal con R americana.",
  "/ɔ/": "La «o» larga y profunda; en inglés no es plana.",
  "/ɪ/": "Di una «i» floja sin sonreír; suena casi a «e».",
  "/ð/": "La «d» suave entre dientes, como en «cada».",
  "/θ/": "Como la «z» de España: sopla entre los dientes.",
  "/v/": "En español b y v suenan igual; aquí no.",
  "/z/": "El zumbido de la abeja: la s vibra.",
  "/ʒ/": "Como la «y» argentina o la «j» francesa.",
  "/r/": "La R americana: enrolla la lengua sin tocar arriba.",
};

function shortTip(symbol: string): string {
  if (SPANISH_HARD_TIPS[symbol]) {
    return SPANISH_HARD_TIPS[symbol];
  }
  const extra = IPA_EXTRA[symbol];
  const tip = extra?.spanishTipLongEs ?? extra?.spanishTip;
  if (!tip) return "";
  const firstSentence = tip.split(/[.!?]/)[0];
  return firstSentence.length > 90
    ? `${firstSentence.slice(0, 87)}…`
    : `${firstSentence}.`;
}

export default function SpanishSpeakersGrid({
  onSelect,
  exploredSymbols,
}: {
  onSelect: (phoneme: PhonemeData) => void;
  exploredSymbols?: Set<string>;
}) {
  const items = HARD_FOR_SPANISH_SPEAKERS.map((symbol) =>
    PHONEMES.find((p) => p.symbol === symbol)
  ).filter((p): p is PhonemeData => Boolean(p));

  return (
    <section className="ipa-chart__section ipa-chart__spanish-focus" aria-labelledby="spanish-focus-title">
      <header className="ipa-chart__section-head">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h2 id="spanish-focus-title" className="ts-headline text-fg font-bold m-0 text-xl md:text-2xl">
            Los que más cuestan en español
          </h2>
          <span className="ts-badge bg-surface-sunken border border-border-subtle text-fg-muted px-3 py-1 rounded-full text-xs font-semibold">
            {items.length} sonidos
          </span>
        </div>
      </header>

      <div className="ipa-chart__hardgrid mt-3.5">
        {items.map((phoneme) => {
          const keyword =
            PHONEME_MATRIX[phoneme.symbol]?.keyword ?? phoneme.examples[0];
          const isExplored = exploredSymbols?.has(phoneme.symbol);
          const label = `${phoneme.symbol}, ejemplo ${keyword}`;
          return (
            <button
              key={phoneme.symbol}
              type="button"
              aria-label={label}
              className="ipa-chart__hard text-left p-3.5 md:p-4 rounded-2xl border border-border-subtle bg-surface hover:border-border-strong hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between shadow-xs min-h-[92px]"
              onClick={() => onSelect(phoneme)}
            >
              <div>
                <div className="ipa-chart__hard-head flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-ipa font-bold italic text-2xl md:text-[26px] text-fg leading-none">/{phoneme.rawSymbol}/</span>
                    <span className="font-sans text-xs md:text-sm text-fg font-medium">{keyword}</span>
                  </div>
                  {isExplored && (
                    <span
                      className="w-6 h-6 rounded-full bg-[var(--mint)] text-emerald-950 flex items-center justify-center shrink-0"
                      aria-label="Completado"
                    >
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="ts-caption text-fg-muted mt-2 text-xs md:text-sm leading-relaxed">{shortTip(phoneme.symbol)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

