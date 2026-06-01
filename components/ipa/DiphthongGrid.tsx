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
    <div className="ipa-chart__chartcard">
      <div className="ipa-chart__diph-grid">
        {phonemes.map((phoneme) => {
          const glide = DIPHTHONG_GLIDES[phoneme.symbol];
          const keyword =
            PHONEME_MATRIX[phoneme.symbol]?.keyword ?? phoneme.examples[0];
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

      <div className="ipa-chart__chartfoot">
        <span>Deslizamientos entre dos vocales</span>
        <span>{phonemes.length} diptongos</span>
      </div>
    </div>
  );
}
