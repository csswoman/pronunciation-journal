"use client";

// Planned structure:
// <IPAPageView>
//   <IPAPageHeader />
//   <div className="grid">
//     <LeftMatrixColumn />
//     <RightDetailColumn />
//   </div>
//   <SpanishSpeakersGrid />
// </IPAPageView>

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLiveQuery } from "dexie-react-hooks";
import { getExploredSymbolsToday, markPhonemeExplored } from "@/lib/db";
import { PHONEMES, PHONEME_MATRIX, type PhonemeData } from "./data";
import { IPAPageHeader } from "./IPAPageHeader";
import { IPASoundDetailSideCard } from "./IPASoundDetailSideCard";
import IPAMatrix from "./IPAMatrix";
import DiphthongGrid from "./DiphthongGrid";
import SpanishSpeakersGrid from "./SpanishSpeakersGrid";
import { useIpaChartAudio } from "./useIpaChartAudio";

type MatrixCategory = "vowel" | "consonant" | "diphthong";

export function IPAPageView() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<MatrixCategory>("vowel");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeData>(
    () => PHONEMES.find((p) => p.type === "vowel") ?? PHONEMES[0]
  );
  const { playingSymbol, playSound, toggleSound } = useIpaChartAudio();

  const exploredArray = useLiveQuery(() => getExploredSymbolsToday(user?.id), [user?.id], [] as string[]);
  const exploredSymbols = useMemo(() => new Set(exploredArray ?? []), [exploredArray]);

  const phonemesByCategory = useMemo(
    () => ({
      vowel: PHONEMES.filter((p) => p.type === "vowel"),
      consonant: PHONEMES.filter((p) => p.type === "consonant"),
      diphthong: PHONEMES.filter((p) => p.type === "diphthong"),
    }),
    []
  );

  const currentPhonemes = useMemo(() => {
    const list = phonemesByCategory[activeCategory];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return PHONEMES.filter(
      (p) =>
        p.symbol.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.examples.some((ex) => ex.toLowerCase().includes(q))
    );
  }, [activeCategory, phonemesByCategory, searchQuery]);

  const counts = useMemo(
    () => ({
      vowel: phonemesByCategory.vowel.length,
      consonant: phonemesByCategory.consonant.length,
      diphthong: phonemesByCategory.diphthong.length,
    }),
    [phonemesByCategory]
  );

  const spokenWordFor = useCallback(
    (phoneme: PhonemeData) => PHONEME_MATRIX[phoneme.symbol]?.keyword ?? phoneme.examples[0],
    []
  );

  const handleSelect = useCallback(
    (phoneme: PhonemeData) => {
      setSelectedPhoneme(phoneme);
      void markPhonemeExplored(phoneme.symbol, user?.id);
      playSound(phoneme.rawSymbol, spokenWordFor(phoneme));
    },
    [playSound, spokenWordFor, user?.id]
  );

  const handleCategoryChange = useCallback(
    (category: MatrixCategory) => {
      setActiveCategory(category);
      setSearchQuery("");
      const first = phonemesByCategory[category][0];
      if (first) setSelectedPhoneme(first);
    },
    [phonemesByCategory]
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-8 animate-fadeIn">
      {/* Header */}
      <IPAPageHeader
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        counts={counts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Grid + Detail Card */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-start">
        {/* Left Column: Matrix */}
        <div className="flex flex-col gap-4 min-w-0">
          {activeCategory === "diphthong" && !searchQuery.trim() ? (
            <div className="bg-surface-raised border border-border-subtle rounded-3xl p-5 shadow-xs">
              <DiphthongGrid
                phonemes={currentPhonemes}
                selectedSymbol={selectedPhoneme.symbol}
                exploredSymbols={exploredSymbols}
                playingSymbol={playingSymbol}
                onSelect={handleSelect}
              />
            </div>
          ) : (
            <IPAMatrix
              category={activeCategory}
              phonemes={currentPhonemes}
              selectedSymbol={selectedPhoneme.symbol}
              exploredSymbols={exploredSymbols}
              playingSymbol={playingSymbol}
              onSelect={handleSelect}
            />
          )}
        </div>

        {/* Right Column: Sound Detail Card */}
        <IPASoundDetailSideCard
          phoneme={selectedPhoneme}
          isPlaying={playingSymbol === selectedPhoneme.rawSymbol}
          onPlay={() => toggleSound(selectedPhoneme.rawSymbol, spokenWordFor(selectedPhoneme))}
        />
      </div>

      {/* Bottom Section */}
      <SpanishSpeakersGrid onSelect={handleSelect} exploredSymbols={exploredSymbols} />
    </div>
  );
}
