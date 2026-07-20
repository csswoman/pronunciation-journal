"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "@/components/auth/AuthProvider";

import { IPA_AUDIO_MAP, SOUNDS_BASE_URL } from "@/lib/pronunciation/ipa-audio";
import { cancelSpeech, speakText } from "@/lib/speech/synthesis";
import {
  getExploredSymbolsToday,
  markPhonemeExplored,
  resetTodaysExplorations,
} from "@/lib/db";
import { PHONEMES, PHONEME_MATRIX, type PhonemeData } from "./data";
import IPAPageHeader from "./IPAPageHeader";
import IPAProgressBar from "./IPAProgressBar";
import IPACategoryTabs from "./IPACategoryTabs";
import IPAMatrix from "./IPAMatrix";
import DiphthongGrid from "./DiphthongGrid";
import PhonemeDetailPanel from "./PhonemeDetailPanel";
import SpanishSpeakersGrid from "./SpanishSpeakersGrid";
import MinimalPairsTrainer from "./MinimalPairsTrainer";
import PracticeWithAICTA from "./PracticeWithAICTA";

type MatrixCategory = "vowel" | "consonant" | "diphthong";

export default function IPAChart() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<MatrixCategory>("vowel");
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeData>(
    () => PHONEMES.find((p) => p.type === "vowel") ?? PHONEMES[0]
  );
  const [playingSymbol, setPlayingSymbol] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const exploredArray = useLiveQuery(() => getExploredSymbolsToday(user?.id), [user?.id], [] as string[]);
  const exploredSymbols = useMemo(
    () => new Set(exploredArray ?? []),
    [exploredArray]
  );

  useEffect(() => {
    return () => {
      currentAudioRef.current?.pause();
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const phonemesByCategory = useMemo(
    () => ({
      vowel: PHONEMES.filter((p) => p.type === "vowel"),
      consonant: PHONEMES.filter((p) => p.type === "consonant"),
      diphthong: PHONEMES.filter((p) => p.type === "diphthong"),
    }),
    []
  );

  const currentPhonemes = phonemesByCategory[activeCategory];

  const counts = useMemo(
    () => ({
      vowel: phonemesByCategory.vowel.length,
      consonant: phonemesByCategory.consonant.length,
      diphthong: phonemesByCategory.diphthong.length,
    }),
    [phonemesByCategory]
  );

  const speakExample = useCallback((word: string) => {
    speakText(word);
  }, []);

  const playSound = useCallback((rawSymbol: string, example?: string) => {
    const fileName = IPA_AUDIO_MAP[rawSymbol] ?? IPA_AUDIO_MAP[rawSymbol[0]];
    if (!fileName) return;

    currentAudioRef.current?.pause();
    cancelSpeech();

    try {
      setPlayingSymbol(rawSymbol);
      const audio = new Audio(`${SOUNDS_BASE_URL}/${fileName}`);
      currentAudioRef.current = audio;
      audio.onended = () => {
        setPlayingSymbol(null);
        if (example) speakExample(example);
      };
      audio.onerror = () => setPlayingSymbol(null);
      audio.play().catch((err) => {
        if (err.name !== "AbortError" && err.name !== "NotAllowedError") {
          console.error(`Playback failed for ${rawSymbol}:`, err);
        }
        setPlayingSymbol(null);
      });
    } catch {
      setPlayingSymbol(null);
    }
  }, [speakExample]);

  const spokenWordFor = useCallback(
    (phoneme: PhonemeData) =>
      PHONEME_MATRIX[phoneme.symbol]?.keyword ?? phoneme.examples[0],
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

  const handleSelectFromAnywhere = useCallback(
    (phoneme: PhonemeData) => {
      if (phoneme.type !== activeCategory) {
        setActiveCategory(phoneme.type as MatrixCategory);
      }
      handleSelect(phoneme);
    },
    [activeCategory, handleSelect]
  );

  const handleCategoryChange = useCallback(
    (category: MatrixCategory) => {
      setActiveCategory(category);
      const first = phonemesByCategory[category][0];
      if (first) setSelectedPhoneme(first);
    },
    [phonemesByCategory]
  );

  const navigate = useCallback(
    (delta: 1 | -1) => {
      const idx = currentPhonemes.findIndex((p) => p.symbol === selectedPhoneme.symbol);
      if (idx === -1) return;
      const nextIdx = (idx + delta + currentPhonemes.length) % currentPhonemes.length;
      handleSelect(currentPhonemes[nextIdx]);
    },
    [currentPhonemes, selectedPhoneme, handleSelect]
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      if (target?.closest("button, a, [role='button']")) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigate(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(-1);
      } else if (event.code === "Space") {
        event.preventDefault();
        playSound(selectedPhoneme.rawSymbol, spokenWordFor(selectedPhoneme));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, playSound, selectedPhoneme, spokenWordFor]);

  const [undoSnapshot, setUndoSnapshot] = useState<string[] | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleReset = useCallback(() => {
    const snapshot = [...(exploredArray ?? [])];
    if (snapshot.length === 0) return;
    setUndoSnapshot(snapshot);
    void resetTodaysExplorations(user?.id);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => setUndoSnapshot(null), 5000);
  }, [exploredArray, user?.id]);

  const handleUndoReset = useCallback(async () => {
    if (!undoSnapshot) return;
    await Promise.all(undoSnapshot.map((symbol) => markPhonemeExplored(symbol, user?.id)));
    setUndoSnapshot(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  }, [undoSnapshot, user?.id]);

  return (
    <div className="animate-fadeIn">
      <IPAPageHeader
        onStartPractice={() => router.push("/practice/sounds")}
      />

      <IPAProgressBar
        explored={exploredSymbols.size}
        total={PHONEMES.length}
        onReset={handleReset}
        undoAvailable={undoSnapshot !== null}
        onUndo={handleUndoReset}
      />

      <IPACategoryTabs
        active={activeCategory}
        onChange={handleCategoryChange}
        counts={counts}
      />

      <div className="ipa-chart__main">
        <div key={activeCategory} className="animate-fadeIn">
          {activeCategory === "diphthong" ? (
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

        <PhonemeDetailPanel
          phoneme={selectedPhoneme}
          isPlaying={playingSymbol === selectedPhoneme.rawSymbol}
          onPlay={() => playSound(selectedPhoneme.rawSymbol, spokenWordFor(selectedPhoneme))}
          onSpeakExample={speakExample}
          onPrev={() => navigate(-1)}
          onNext={() => navigate(1)}
        />
      </div>

      <div className="ipa-chart__sections">
        <SpanishSpeakersGrid onSelect={handleSelectFromAnywhere} />
        <MinimalPairsTrainer />
        <PracticeWithAICTA focusedSymbol={selectedPhoneme.symbol} />
      </div>
    </div>
  );
}

