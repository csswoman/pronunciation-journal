"use client";

import { Play, Square } from "lucide-react";
import { IPA_EXTRA } from "@/lib/pronunciation/ipa-data";
import type { PhonemeData } from "./data";

function categoryFeatures(category: string): string[] {
  return category
    .split(/\s+/)
    .filter((part) => part.length > 1)
    .slice(0, 3);
}

export default function PhonemeDetailPanel({
  phoneme,
  isPlaying,
  onPlay,
  onSpeakExample,
  onPrev,
  onNext,
}: {
  phoneme: PhonemeData;
  isPlaying: boolean;
  onPlay: () => void;
  onSpeakExample?: (word: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const extra = IPA_EXTRA[phoneme.symbol];
  const features = categoryFeatures(phoneme.category);
  const description = phoneme.description.split("—")[0].trim();

  return (
    <aside
      className="rounded-2xl border p-6 sticky top-4"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--line-divider)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-tiny font-bold uppercase tracking-widest"
          style={{ color: "var(--text-tertiary)" }}
        >
          {phoneme.type}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous phoneme"
            className="w-7 h-7 inline-flex items-center justify-center rounded-md border text-xs transition-colors hover:bg-[var(--btn-regular-bg)]"
            style={{ borderColor: "var(--line-divider)", color: "var(--text-secondary)" }}
          >
            ←
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next phoneme"
            className="w-7 h-7 inline-flex items-center justify-center rounded-md border text-xs transition-colors hover:bg-[var(--btn-regular-bg)]"
            style={{ borderColor: "var(--line-divider)", color: "var(--text-secondary)" }}
          >
            →
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span className="font-serif text-6xl leading-none text-fg">
          {phoneme.symbol}
        </span>
        <button
          type="button"
          onClick={onPlay}
          aria-label={isPlaying ? "Stop" : "Play sound"}
          className="w-10 h-10 inline-flex items-center justify-center rounded-full text-on-primary shrink-0 transition-transform hover:scale-105"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--card-bg)" }}
        >
          {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>
      </div>

      <p className="text-sm text-fg-muted mb-5">
        {description}
      </p>

      <section className="mb-5">
        <p className="text-tiny font-bold uppercase tracking-widest text-fg-muted mb-3">
          Examples
        </p>
        <ul className="space-y-2.5">
          {phoneme.examples.slice(0, 3).map((word) => (
            <li
              key={word}
              className="flex items-center justify-between text-sm"
            >
              <button
                type="button"
                onClick={() => onSpeakExample?.(word)}
                className="font-medium text-fg hover:opacity-70 transition-opacity"
              >
                {word}
              </button>
              <button
                type="button"
                onClick={() => onSpeakExample?.(word)}
                className="font-serif text-fg-muted hover:opacity-70 transition-opacity inline-flex items-center gap-1"
              >
                {phoneme.symbol}
                <span className="text-tiny">▸</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {phoneme.tips.length > 0 && (
        <section className="mb-5">
          <p className="text-tiny font-bold uppercase tracking-widest text-fg-muted mb-3">
            How to say it
          </p>
          <ul className="space-y-2">
            {phoneme.tips.slice(0, 3).map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-fg"
              >
                <span
                  className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                  style={{ backgroundColor: "var(--text-secondary)" }}
                />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {features.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {features.map((feature) => (
            <span
              key={feature}
              className="px-2 py-1 rounded-md text-tiny font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: "var(--btn-regular-bg)",
                color: "var(--text-secondary)",
              }}
            >
              {feature}
            </span>
          ))}
        </div>
      )}

      {extra?.spanishTip && (
        <details
          className="mt-5 rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--line-divider)" }}
        >
          <summary
            className="px-3 py-2 text-tiny font-bold uppercase tracking-widest cursor-pointer select-none"
            style={{ color: "var(--text-secondary)" }}
          >
            Para hispanohablantes
          </summary>
          <p className="px-3 pb-3 text-xs leading-relaxed text-fg-muted">
            {extra.spanishTip}
          </p>
        </details>
      )}
    </aside>
  );
}
