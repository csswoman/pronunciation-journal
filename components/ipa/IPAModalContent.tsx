"use client";

// Planned structure:
// <IPAModalContent>
//   <ModalHeader />
//   <ModalControls />
//   <ModalMatrixContainer />
//   <ModalBottomSoundBar />
// </IPAModalContent>

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLiveQuery } from "dexie-react-hooks";
import { getExploredSymbolsToday, markPhonemeExplored } from "@/lib/db";
import { PHONEMES, PHONEME_MATRIX, type PhonemeData } from "./data";
import IPAMatrix from "./IPAMatrix";
import DiphthongGrid from "./DiphthongGrid";
import { useIpaChartAudio } from "./useIpaChartAudio";
import { useSpeakWord } from "@/hooks/useSpeakWord";
import { ArrowRight, Play, Search, Volume2, X } from "@/components/icons";
import { cn } from "@/lib/cn";

type MatrixCategory = "vowel" | "consonant" | "diphthong";

const TABS: { id: MatrixCategory; label: string }[] = [
  { id: "vowel", label: "Vocales" },
  { id: "consonant", label: "Consonantes" },
  { id: "diphthong", label: "Diptongos" },
];

interface IPAModalContentProps {
  onClose: () => void;
}

export function IPAModalContent({ onClose }: IPAModalContentProps) {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<MatrixCategory>("vowel");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeData>(
    () => PHONEMES.find((p) => p.type === "vowel") ?? PHONEMES[0]
  );
  const { playingSymbol, playSound, toggleSound } = useIpaChartAudio();
  const { speak } = useSpeakWord();

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

  const isAudioPlaying = playingSymbol === selectedPhoneme.rawSymbol;

  return (
    <div className="flex flex-col gap-5 p-6 max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <span className="ts-kicker text-fg-subtle">
            CONSULTA RÁPIDA
          </span>
          <h2 id="ipa-reference-dialog-title" className="ts-headline text-fg mt-0.5">
            Tabla IPA
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/ipa"
            onClick={onClose}
            className="hidden sm:inline-flex items-center gap-1.5 ts-button text-fg hover:text-primary transition-colors"
          >
            <span>Abrir la página completa</span>
            <ArrowRight size={16} />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="press-feedback p-2 rounded-full bg-surface-sunken hover:bg-surface-raised border border-border-subtle text-fg-subtle hover:text-fg transition-all"
            aria-label="Cerrar tabla IPA"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-sunken border border-border-subtle">
          {TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCategoryChange(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full ts-pill transition-all",
                  isActive
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-fg-muted hover:text-fg hover:bg-surface-raised"
                )}
              >
                <span>{tab.label}</span>
                <span className="ts-stat opacity-75">
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[180px] flex-1 sm:flex-initial">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-full border border-border-subtle bg-surface-sunken pl-9 pr-3 py-1.5 ts-body text-fg placeholder:text-fg-subtle outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Matrix Body */}
      <div className="bg-surface-raised border border-border-subtle rounded-3xl p-4 shadow-xs">
        {activeCategory === "diphthong" && !searchQuery.trim() ? (
          <DiphthongGrid
            phonemes={currentPhonemes}
            selectedSymbol={selectedPhoneme.symbol}
            exploredSymbols={exploredSymbols}
            playingSymbol={playingSymbol}
            onSelect={handleSelect}
          />
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

      {/* Selected Sound Bottom Bar (Image 2 design) */}
      <div className="bg-[var(--lilac)]/70 dark:bg-purple-950/60 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-purple-200/50 shadow-xs">
        <div className="flex items-center gap-4 flex-wrap min-w-0">
          <span className="ts-ipa-lg font-bold text-fg shrink-0">
            {selectedPhoneme.symbol}
          </span>
          <div className="min-w-0">
            <p className="ts-body text-fg truncate">
              {selectedPhoneme.description}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {selectedPhoneme.examples.slice(0, 3).map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => speak(word)}
                  className="press-feedback inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border-subtle bg-surface-raised ts-pill text-fg hover:border-primary transition-all"
                >
                  <Play size={10} className="fill-current text-fg-muted" />
                  <span>{word}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => toggleSound(selectedPhoneme.rawSymbol, spokenWordFor(selectedPhoneme))}
            className="press-feedback flex shrink-0 items-center justify-center size-10 rounded-full bg-fg text-surface hover:opacity-90 transition-all shadow-xs"
            aria-label={isAudioPlaying ? "Pausar sonido" : "Reproducir sonido"}
          >
            <Volume2 size={18} />
          </button>

          <Link
            href={`/practice/sounds/sound/${encodeURIComponent(selectedPhoneme.rawSymbol)}`}
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-fg text-surface ts-button hover:opacity-90 transition-all shadow-xs"
          >
            Practicar
          </Link>
        </div>
      </div>
    </div>
  );
}
