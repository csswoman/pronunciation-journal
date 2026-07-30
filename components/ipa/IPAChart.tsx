"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "@/components/auth/AuthProvider";

import { IPA_AUDIO_MAP, SOUNDS_BASE_URL } from "@/lib/pronunciation/ipa-audio";
import { cancelSpeech, speakText } from "@/lib/speech/synthesis";
import {
  getExploredSymbolsToday,
  markPhonemeExplored,
} from "@/lib/db";
import { PHONEMES, PHONEME_MATRIX, type PhonemeData } from "./data";
import IPACategoryTabs from "./IPACategoryTabs";
import IPAMatrix from "./IPAMatrix";
import DiphthongGrid from "./DiphthongGrid";
import SpanishSpeakersGrid from "./SpanishSpeakersGrid";
import PracticeWithAICTA from "./PracticeWithAICTA";
import { SoundDetail } from "@/components/sounds/SoundDetail";
import { practiceHrefForIpa } from "@/lib/sound-lab/lesson-lookup";
import type { Lesson } from "@/lib/types";

type MatrixCategory = "vowel" | "consonant" | "diphthong";

interface IPAChartProps {
  /** Lessons to resolve practice links from; omit to fall back to /practice/sounds. */
  lessons?: Lesson[];
}

export default function IPAChart({ lessons = [] }: IPAChartProps) {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<MatrixCategory>("vowel");
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeData>(
    () => PHONEMES.find((p) => p.type === "vowel") ?? PHONEMES[0]
  );
  const [playingSymbol, setPlayingSymbol] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const exploredArray = useLiveQuery(() => getExploredSymbolsToday(user?.id), [user?.id], [] as string[]);
  const exploredSymbols = useMemo(
    () => new Set(exploredArray ?? []),
    [exploredArray]
  );

  useEffect(() => {
    return () => {
      currentAudioRef.current?.pause();
      cancelSpeech();
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

  const stopSound = useCallback(() => {
    currentAudioRef.current?.pause();
    currentAudioRef.current = null;
    cancelSpeech();
    setPlayingSymbol(null);
    setAudioError(null);
  }, []);

  const playSound = useCallback((rawSymbol: string, example?: string) => {
    const fileName = IPA_AUDIO_MAP[rawSymbol] ?? IPA_AUDIO_MAP[rawSymbol[0]];
    stopSound();
    setAudioError(null);

    if (!fileName) {
      if (!example) {
        setAudioError("No se pudo reproducir este sonido.");
        return;
      }
      setPlayingSymbol(rawSymbol);
      speakText(example, {
        onEnd: () => setPlayingSymbol(null),
        onError: () => setAudioError("No se pudo reproducir este sonido."),
      });
      return;
    }

    try {
      setPlayingSymbol(rawSymbol);
      const audio = new Audio(`${SOUNDS_BASE_URL}/${fileName}`);
      currentAudioRef.current = audio;
      audio.onended = () => {
        if (example) {
          speakText(example, { onEnd: () => setPlayingSymbol(null) });
        } else {
          setPlayingSymbol(null);
        }
      };
      audio.onerror = () => {
        setPlayingSymbol(null);
        setAudioError("No se pudo reproducir este sonido.");
      };
      audio.play().catch((err) => {
        if (err.name !== "AbortError" && err.name !== "NotAllowedError") {
          console.error(`Playback failed for ${rawSymbol}:`, err);
        }
        setPlayingSymbol(null);
        setAudioError("No se pudo reproducir este sonido.");
      });
    } catch {
      setPlayingSymbol(null);
      setAudioError("No se pudo reproducir este sonido.");
    }
  }, [stopSound]);

  const toggleSound = useCallback(
    (rawSymbol: string, example?: string) => {
      if (playingSymbol === rawSymbol) {
        stopSound();
        return;
      }
      playSound(rawSymbol, example);
    },
    [playSound, playingSymbol, stopSound],
  );

  useEffect(() => {
    setAudioError(null);
  }, [selectedPhoneme.rawSymbol]);

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
        toggleSound(selectedPhoneme.rawSymbol, spokenWordFor(selectedPhoneme));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, selectedPhoneme, spokenWordFor, toggleSound]);

  return (
    <div className="ipa-chart animate-fadeIn">
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

        <SoundDetail
          phoneme={selectedPhoneme}
          progressPct={0}
          isPlaying={playingSymbol === selectedPhoneme.rawSymbol}
          playbackError={audioError}
          onPlay={() => toggleSound(selectedPhoneme.rawSymbol, spokenWordFor(selectedPhoneme))}
          practiceHref={practiceHrefForIpa(lessons, selectedPhoneme.symbol) ?? undefined}
        />
      </div>

      <SpanishSpeakersGrid onSelect={handleSelectFromAnywhere} />

      <details className="ipa-chart__secondary-disclosure">
        <summary>
          <span>Más apoyo para practicar</span>
          <span className="ipa-chart__secondary-disclosure-meta">
            para <span className="font-ipa">{selectedPhoneme.symbol}</span>
          </span>
        </summary>
        <div className="ipa-chart__secondary-content">
          <PracticeWithAICTA focusedSymbol={selectedPhoneme.symbol} />
        </div>
      </details>
    </div>
  );
}

