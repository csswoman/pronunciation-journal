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
  const items = HARD_FOR_SPANISH_SPEAKERS
    .map((symbol) => PHONEMES.find((p) => p.symbol === symbol))
    .filter((p): p is PhonemeData => Boolean(p));

  return (
    <section
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--line-divider)",
      }}
    >
      <header className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-fg mb-1">
            Sonidos difíciles para hispanohablantes
          </h2>
          <p className="text-sm text-fg-muted">
            Estos fonemas no existen en español o se confunden con otros — empieza por aquí.
          </p>
        </div>
        <span
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: "var(--warning-soft, var(--btn-regular-bg))",
            color: "var(--warning, var(--primary))",
          }}
        >
          <span className="font-bold">{items.length}</span>
          <span className="opacity-80">to focus on</span>
        </span>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((phoneme) => {
          const keyword = PHONEME_MATRIX[phoneme.symbol]?.keyword ?? phoneme.examples[0];
          return (
            <button
              key={phoneme.symbol}
              type="button"
              onClick={() => onSelect(phoneme)}
              className="text-left rounded-xl border p-3 transition-all duration-150 hover:scale-[1.02] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--line-divider)",
              }}
            >
              <span className="block font-serif text-2xl leading-none text-fg mb-1">
                {phoneme.symbol}
              </span>
              <span
                className="block text-tiny font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                {keyword}
              </span>
              <span className="block text-xs leading-snug text-fg-muted">
                {shortTip(phoneme.symbol)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
