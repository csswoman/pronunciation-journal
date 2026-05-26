"use client";

import Link from "next/link";
import { Play, Square, ArrowRight, Volume2, ChevronLeft, ChevronRight, Languages } from "lucide-react";
import { IPA_EXTRA } from "@/lib/pronunciation/ipa-data";
import type { PhonemeData } from "./data";

const TYPE_LABEL: Record<PhonemeData["type"], string> = {
  vowel: "Vowel",
  consonant: "Consonant",
  diphthong: "Diphthong",
};

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
  const description = phoneme.description.split("—")[0].trim();
  const spanishTip = extra?.spanishTip.split(/(?<=[.!?])\s+/)[0];

  return (
    <aside
      className="rounded-2xl border overflow-hidden sticky top-4"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--line-divider)",
      }}
    >
      {/* ── Hero ────────────────────────────────────── */}
      <div
        className="relative px-5 pt-4 pb-5 border-b"
        style={{
          backgroundColor: "var(--btn-regular-bg)",
          borderColor: "var(--line-divider)",
        }}
      >
        <header className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "var(--text-primary)" }}
            />
            <span
              className="text-tiny font-bold uppercase tracking-widest"
              style={{ color: "var(--text-tertiary)" }}
            >
              {TYPE_LABEL[phoneme.type]}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous phoneme"
              className="w-7 h-7 inline-flex items-center justify-center rounded-md border transition-all duration-150 hover:bg-[var(--card-bg)] active:scale-95"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--line-divider)",
                color: "var(--text-secondary)",
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Next phoneme"
              className="w-7 h-7 inline-flex items-center justify-center rounded-md border transition-all duration-150 hover:bg-[var(--card-bg)] active:scale-95"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--line-divider)",
                color: "var(--text-secondary)",
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </header>

        <div key={phoneme.symbol} className="animate-fadeIn">
          <div className="flex items-end justify-between gap-3">
            <span
              className="font-serif text-6xl leading-none"
              style={{ color: "var(--text-primary)" }}
            >
              {phoneme.symbol}
            </span>

            <button
              type="button"
              onClick={onPlay}
              aria-label={isPlaying ? "Stop" : "Play sound"}
              className="relative w-12 h-12 inline-flex items-center justify-center rounded-full shrink-0 transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: isPlaying ? "var(--primary)" : "var(--text-primary)",
                color: "var(--card-bg)",
              }}
            >
              {isPlaying ? (
                <Square size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
              {isPlaying && (
                <span
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    backgroundColor: "var(--primary)",
                    animation: "mic-ring 0.8s ease-out infinite",
                  }}
                />
              )}
            </button>
          </div>

          <p
            className="mt-4 text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────── */}
      <div className="px-5 py-4 space-y-4">
        {phoneme.tips.length > 0 && (
          <section>
            <p
              className="text-tiny font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              How to say it
            </p>
            <ol className="space-y-2.5">
              {phoneme.tips.slice(0, 3).map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span
                    className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-tiny font-bold tabular-nums"
                    style={{
                      backgroundColor: "var(--btn-regular-bg)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5">{tip}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section>
          <p
            className="text-tiny font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            Examples
          </p>
          <ul className="space-y-1">
            {phoneme.examples.slice(0, 4).map((word) => (
              <li key={word}>
                <button
                  type="button"
                  onClick={() => onSpeakExample?.(word)}
                  className="group w-full flex items-center justify-between text-sm py-2 px-3 -mx-2 rounded-lg transition-colors hover:bg-[var(--btn-regular-bg)]"
                >
                  <span
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {word}
                  </span>
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full transition-all opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-90"
                    style={{
                      backgroundColor: "var(--card-bg)",
                      border: "1px solid var(--line-divider)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Volume2 size={12} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {spanishTip && (
          <section
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--btn-regular-bg)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Languages
                size={13}
                style={{ color: "var(--text-secondary)" }}
              />
              <p
                className="text-tiny font-bold uppercase tracking-widest"
                style={{ color: "var(--text-tertiary)" }}
              >
                Para hispanohablantes
              </p>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--text-primary)" }}
            >
              {spanishTip}
            </p>
          </section>
        )}

        <Link
          href="/practice/sounds"
          className="group flex w-full items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]"
          style={{
            backgroundColor: "var(--text-primary)",
            color: "var(--card-bg)",
          }}
        >
          <span className="inline-flex items-center gap-2">
            Practice{" "}
            <span className="font-serif text-base">{phoneme.symbol}</span>
          </span>
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </aside>
  );
}
