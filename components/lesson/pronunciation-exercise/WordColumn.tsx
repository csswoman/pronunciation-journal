"use client";

import { Volume2, Heart } from "lucide-react";
import type { IpaSegment } from "./exercise-types";

interface Props {
  word: string;
  ipaSegments: IpaSegment[];
  sentence: string;
  sentenceHighlight: string;
  isFav: boolean;
  onListen: () => void;
  onToggleFav: () => void;
}

function HighlightedSentence({ sentence, highlight }: { sentence: string; highlight: string }) {
  const idx = sentence.indexOf(highlight);
  if (idx === -1) return <span>{sentence}</span>;
  return (
    <>
      {sentence.slice(0, idx)}
      <span className="text-fg font-medium">{highlight}</span>
      {sentence.slice(idx + highlight.length)}
    </>
  );
}

export default function WordColumn({
  word,
  ipaSegments,
  sentence,
  sentenceHighlight,
  isFav,
  onListen,
  onToggleFav,
}: Props) {
  return (
    <div className="flex flex-col gap-space-6 py-space-6">
      {/* Word display */}
      <div className="space-y-space-2 animate-fadeIn">
        <h1
          className="font-[family-name:var(--font-heading)] text-fg leading-none tracking-tight"
          style={{ fontSize: "clamp(3.5rem, 7vw, 6rem)", fontWeight: 700 }}
        >
          {word}
        </h1>

        {/* IPA with focus phoneme underline */}
        <p
          className="font-[family-name:var(--font-heading)] italic text-h2 text-primary"
          aria-label={`IPA: ${ipaSegments.map(s => s.text).join("")}`}
        >
          /
          {ipaSegments.map((seg, i) => (
            <span
              key={i}
              className={seg.isFocus ? "border-b-2 border-primary pb-0.5" : undefined}
            >
              {seg.text}
            </span>
          ))}
          /
        </p>
      </div>

      {/* Example sentence */}
      <p className="text-body-lg text-fg-muted leading-relaxed max-w-sm italic">
        &ldquo;<HighlightedSentence sentence={sentence} highlight={sentenceHighlight} />&rdquo;
      </p>

      {/* Action row */}
      <div className="flex items-center gap-space-3">
        <button
          onClick={onListen}
          className="inline-flex items-center gap-space-2 rounded-full bg-primary text-on-primary px-space-5 py-space-2 text-body-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          <Volume2 className="w-4 h-4" />
          Listen
        </button>
        <button
          onClick={onToggleFav}
          aria-label={isFav ? "Remove from saved" : "Save word"}
          className={`inline-flex items-center gap-space-2 rounded-full border px-space-4 py-space-2 text-body-sm transition-colors ${
            isFav
              ? "border-error text-error bg-error-soft"
              : "border-border-default text-fg-muted bg-transparent hover:border-border-strong hover:text-fg"
          }`}
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
          {isFav ? "Saved" : "Save"}
        </button>
      </div>

      {/* Mic prompt */}
      <p className="text-caption text-fg-subtle">Tap the mic when you&apos;re ready</p>
    </div>
  );
}
