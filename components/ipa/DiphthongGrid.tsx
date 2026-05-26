"use client";

import {
  DIPHTHONG_GLIDES,
  PHONEME_MATRIX,
  type PhonemeData,
} from "./data";
import DiphthongCard from "./DiphthongCard";

export default function DiphthongGrid({
  phonemes,
  selectedSymbol,
  exploredSymbols,
  playingSymbol,
  onSelect,
}: {
  phonemes: PhonemeData[];
  selectedSymbol: string;
  exploredSymbols: Set<string>;
  playingSymbol: string | null;
  onSelect: (phoneme: PhonemeData) => void;
}) {
  return (
    <div
      className="rounded-2xl border p-4 md:p-6"
      style={{
        backgroundColor: "var(--bg-secondary, var(--card-bg))",
        borderColor: "var(--line-divider)",
      }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {phonemes.map((phoneme) => {
          const glide = DIPHTHONG_GLIDES[phoneme.symbol];
          const keyword = PHONEME_MATRIX[phoneme.symbol]?.keyword ?? phoneme.examples[0];
          if (!glide) return null;
          return (
            <DiphthongCard
              key={phoneme.symbol}
              phoneme={phoneme}
              keyword={keyword}
              glide={glide}
              isSelected={selectedSymbol === phoneme.symbol}
              isExplored={exploredSymbols.has(phoneme.symbol)}
              isPlaying={playingSymbol === phoneme.rawSymbol}
              onSelect={() => onSelect(phoneme)}
            />
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-fg-muted">
        <span>Each diphthong is a glide between two vowel positions</span>
        <span>{phonemes.length} diphthongs</span>
      </div>
    </div>
  );
}
