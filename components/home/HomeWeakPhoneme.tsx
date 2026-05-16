"use client";

import { useCallback, useState } from "react";
import { CardBadge } from "@/components/ui/CardBadge";

const PRACTICE_WORDS = ["three", "thank", "thumb", "breath", "mouth", "teeth"];

interface HomeWeakPhonemeProps {
  phoneme?: string;
  label?: string;
  accuracy?: number;
  exampleMistake?: { target: string; heard: string };
}

function useSpeakWord() {
  const [speaking, setSpeaking] = useState<string | null>(null);

  const speak = useCallback((word: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.onstart = () => setSpeaking(word);
    utterance.onend = () => setSpeaking(null);
    utterance.onerror = () => setSpeaking(null);
    window.speechSynthesis.speak(utterance);
  }, []);

  return { speaking, speak };
}

export default function HomeWeakPhoneme({
  phoneme = "/θ/",
  label = "voiceless dental fricative",
  accuracy = 72,
  exampleMistake = { target: "think", heard: "sink" },
}: HomeWeakPhonemeProps) {
  const { speaking, speak } = useSpeakWord();

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <CardBadge
          color="warning"
        >
          NEEDS PRACTICE
        </CardBadge>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {accuracy}% accuracy
        </span>
      </div>

      {/* Title */}
      <div>
        <p className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
          Recommended<br />for you
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          Based on your recent sessions
        </p>
      </div>

      {/* Phoneme card */}
      <div
        className="rounded-lg px-4 py-3 flex items-center justify-between gap-3"
        style={{
          backgroundColor: "var(--surface-sunken)",
          borderLeft: "3px solid var(--primary)",
        }}
      >
        <div>
          <p
            className="text-4xl font-bold leading-none font-mono"
            style={{ color: "var(--text-primary)" }}
          >
            {phoneme}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            {label}
          </p>
        </div>
        <div className="flex items-end gap-0.5">
          {[10, 18, 28, 22, 34, 26, 38, 30, 22, 16, 10].map((h, i) => (
            <span
              key={i}
              className="block w-1 rounded-full"
              style={{
                height: `${h}px`,
                backgroundColor: "var(--primary)",
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>

      {/* Mistake insight */}
      <p
        className="text-sm leading-relaxed italic"
        style={{ color: "var(--text-secondary)" }}
      >
        &ldquo;You often say{" "}
        <strong className="not-italic" style={{ color: "var(--text-primary)" }}>
          {exampleMistake.target}
        </strong>{" "}
        as{" "}
        <strong className="not-italic" style={{ color: "var(--warning-value)" }}>
          {exampleMistake.heard}
        </strong>{" "}
        — the tongue should touch your upper teeth.&rdquo;
      </p>

      {/* Practice words */}
      <div>
        <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>
          PRACTICE WORDS
        </p>
        <div className="flex flex-wrap gap-2">
          {PRACTICE_WORDS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => speak(w)}
              className="text-sm px-4 h-9 flex items-center rounded-lg border transition-colors"
              style={{
                borderColor: speaking === w ? "var(--primary)" : "var(--border-default)",
                backgroundColor: speaking === w ? "var(--primary-soft)" : "var(--surface-raised)",
                color: speaking === w ? "var(--primary)" : "var(--text-secondary)",
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
