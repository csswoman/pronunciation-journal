"use client";

import { IPA_EXTRA } from "@/lib/pronunciation/ipa-data";
import { HARD_FOR_SPANISH_SPEAKERS } from "@/lib/pronunciation/ipa-data";
import { PHONEMES, PHONEME_MATRIX, type PhonemeData } from "./data";

function shortTip(symbol: string): string {
  const tip = IPA_EXTRA[symbol]?.spanishTip;
  if (!tip) return "";
  const firstSentence = tip.split(/[.!?]/)[0];
  return firstSentence.length > 90
    ? `${firstSentence.slice(0, 87)}…`
    : `${firstSentence}.`;
}

export default function SpanishSpeakersGrid({
  onSelect,
}: {
  onSelect: (phoneme: PhonemeData) => void;
}) {
  const items = HARD_FOR_SPANISH_SPEAKERS.map((symbol) =>
    PHONEMES.find((p) => p.symbol === symbol)
  ).filter((p): p is PhonemeData => Boolean(p));

  return (
    <section className="ipa-chart__section">
      <header className="ipa-chart__section-head">
        <div>
          <h2 className="ipa-chart__section-title">
            Sonidos difíciles para hispanohablantes
          </h2>
          <p className="ipa-chart__lead mt-1">
            Estos fonemas no existen en español o se confunden con otros — empieza por aquí.
          </p>
        </div>
        <span className="ipa-chart__pill-warn">{items.length} para enfocarte</span>
      </header>

      <div className="ipa-chart__hardgrid">
        {items.map((phoneme) => {
          const keyword =
            PHONEME_MATRIX[phoneme.symbol]?.keyword ?? phoneme.examples[0];
          const label = `${phoneme.symbol}, ejemplo ${keyword}`;
          return (
            <button
              key={phoneme.symbol}
              type="button"
              aria-label={label}
              className="ipa-chart__hard"
              onClick={() => onSelect(phoneme)}
            >
              <div className="ipa-chart__hard-head">
                <span className="ipa-chart__hard-sym">{phoneme.symbol}</span>
                <span className="ipa-chart__hard-word">{keyword}</span>
              </div>
              <p className="ipa-chart__hard-note">{shortTip(phoneme.symbol)}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
