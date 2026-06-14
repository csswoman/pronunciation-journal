"use client";

import Link from "next/link";
import {
  Play,
  Square,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { IPA_EXTRA } from "@/lib/pronunciation/ipa-data";
import type { PhonemeData } from "./data";

const TYPE_LABEL: Record<PhonemeData["type"], string> = {
  vowel: "Vocal",
  consonant: "Consonante",
  diphthong: "Diptongo",
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
    <aside className="ipa-chart__panel">
      <div className="ipa-chart__panel-hero">
        <header className="flex items-start justify-between mb-4">
          <span className="ipa-chart__panel-tag">● {TYPE_LABEL[phoneme.type]}</span>
          <div className="ipa-chart__panel-nav flex gap-1.5">
            <button type="button" onClick={onPrev} aria-label="Fonema anterior">
              <ChevronLeft size={14} />
            </button>
            <button type="button" onClick={onNext} aria-label="Fonema siguiente">
              <ChevronRight size={14} />
            </button>
          </div>
        </header>

        <div key={phoneme.symbol} className="animate-fadeIn">
          <div className="flex items-center justify-between gap-3">
            <span className="ipa-chart__panel-sym">{phoneme.symbol}</span>
            <button
              type="button"
              onClick={onPlay}
              aria-label={isPlaying ? "Detener" : "Reproducir sonido"}
              className="ipa-chart__panel-play"
            >
              {isPlaying ? (
                <Square size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
            </button>
          </div>
          <p className="ipa-chart__panel-name">{description}</p>
        </div>
      </div>

      <div className="ipa-chart__panel-body">
        {phoneme.tips.length > 0 && (
          <section>
            <p className="ipa-chart__panel-sec">Cómo decirlo</p>
            <div className="ipa-chart__howto">
              {phoneme.tips.slice(0, 3).map((tip, i) => (
                <div key={i} className="ipa-chart__howto-step">
                  <span className="ipa-chart__howto-n">{i + 1}</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <p className="ipa-chart__panel-sec">Ejemplos</p>
          <div className="ipa-chart__exwords">
            {phoneme.examples.slice(0, 4).map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => onSpeakExample?.(word)}
                className="ipa-chart__exword"
              >
                {word}
              </button>
            ))}
          </div>
        </section>

        {spanishTip && (
          <section>
            <p className="ipa-chart__panel-sec">Para hispanohablantes</p>
            <div className="ipa-chart__esnote">
              <div className="ipa-chart__esnote-h">⚐ Nota</div>
              {spanishTip}
            </div>
          </section>
        )}

        <Link
          href="/practice/sounds"
          className="ipa-chart__btn ipa-chart__btn--primary ipa-chart__panel-practice"
        >
          Practicar {phoneme.symbol}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    </aside>
  );
}
