"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import Button from "@/components/ui/Button";
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
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <CardBadge color="warning">NEEDS PRACTICE</CardBadge>
        <span className="text-xs text-fg-subtle">{accuracy}% accuracy</span>
      </div>

      {/* Title */}
      <div>
        <p className="text-xl font-bold leading-tight text-fg">
          Recommended<br />for you
        </p>
        <p className="text-xs mt-0.5 text-fg-subtle">Based on your recent sessions</p>
      </div>

      {/* Phoneme showcase */}
      <div className="flex items-center justify-between gap-3 py-2">
        <div>
          <p className="text-4xl font-bold leading-none font-mono text-fg">{phoneme}</p>
          <p className="text-body-sm mt-1 text-fg-subtle">{label}</p>
        </div>
        <div className="flex items-end gap-0.5" aria-hidden="true">
          {[10, 18, 28, 22, 34, 26, 38, 30, 22, 16, 10].map((h, i) => (
            <span
              key={i}
              className="block w-1 rounded-full opacity-70"
              style={{ height: `${h}px`, backgroundColor: "var(--primary)" }}
            />
          ))}
        </div>
      </div>

      {/* Mistake insight */}
      <p className="text-sm leading-relaxed italic text-fg-muted">
        &ldquo;You often say{" "}
        <strong className="not-italic text-fg">{exampleMistake.target}</strong>{" "}
        as{" "}
        <strong className="not-italic text-warning-value">{exampleMistake.heard}</strong>{" "}
        — the tongue should touch your upper teeth.&rdquo;
      </p>

      {/* Practice words */}
      <div>
        <p className="text-xs font-semibold tracking-widest mb-2 text-fg-subtle">PRACTICE WORDS</p>
        <div className="flex flex-wrap gap-2">
          {PRACTICE_WORDS.map((w) => (
            <Button
              key={w}
              size="sm"
              variant={speaking === w ? "soft" : "ghost"}
              onClick={() => speak(w)}
              aria-label={`Practice saying "${w}"`}
            >
              {w}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
