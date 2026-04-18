"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { IPA_AUDIO_MAP, SOUNDS_BASE_URL } from "@/lib/ipa-audio";
import {
  DEFAULT_PHONEME,
  FILTER_TABS,
  PHONEMES,
  TYPE_PILL,
  type FilterType,
  type PhonemeData,
} from "./ipa-chart/data";
import FeaturedPhonemePanel from "./ipa-chart/FeaturedPhonemePanel";
import FilterTabs from "./ipa-chart/FilterTabs";
import PhonemeCard from "./ipa-chart/PhonemeCard";
import PhonemeRow from "./ipa-chart/PhonemeRow";
import ViewToggle from "./ipa-chart/ViewToggle";

export default function IPAChart() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedPhoneme, setSelectedPhoneme] =
    useState<PhonemeData>(DEFAULT_PHONEME);
  const [playingSymbol, setPlayingSymbol] = useState<string | null>(null);
  const [gridView, setGridView] = useState<"grid" | "list">("grid");
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      currentAudioRef.current?.pause();
    };
  }, []);

  const playSound = (rawSymbol: string) => {
    const fileName = IPA_AUDIO_MAP[rawSymbol];
    if (!fileName) return;

    currentAudioRef.current?.pause();

    try {
      setPlayingSymbol(rawSymbol);
      const audio = new Audio(`${SOUNDS_BASE_URL}/${fileName}`);
      currentAudioRef.current = audio;
      audio.onended = () => setPlayingSymbol(null);
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
  };

  const filteredPhonemes =
    activeFilter === "all"
      ? PHONEMES
      : PHONEMES.filter((phoneme) => phoneme.type === activeFilter);

  return (
    <div className="space-y-6 animate-fadeIn">
      <FilterTabs
        tabs={FILTER_TABS}
        activeTab={activeFilter}
        onChange={setActiveFilter}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="space-y-4">
          <FeaturedPhonemePanel
            phoneme={selectedPhoneme}
            isPlaying={playingSymbol === selectedPhoneme.rawSymbol}
            onPlay={() => playSound(selectedPhoneme.rawSymbol)}
            typeMeta={TYPE_PILL[selectedPhoneme.type]}
          />

          <div className="rounded-3xl p-6 text-white" style={{ backgroundColor: "var(--primary)" }}>
            <h3 className="font-bold text-base mb-1">Practice Mode</h3>
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              Compare your pronunciation with AI-powered feedback.
            </p>
            <Button
              variant="outline"
              size="lg"
              fullWidth
              className="border-white/30 bg-white/15 text-white hover:bg-white/25 hover:text-white"
            >
              <span>🎤</span>
              Enable Microphone
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              IPA Symbols Grid
            </h2>
            <ViewToggle view={gridView} onChange={setGridView} />
          </div>

          {gridView === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredPhonemes.map((phoneme) => (
                <PhonemeCard
                  key={phoneme.symbol}
                  phoneme={phoneme}
                  isPlaying={playingSymbol === phoneme.rawSymbol}
                  isSelected={selectedPhoneme.symbol === phoneme.symbol}
                  onPlay={(event) => {
                    event.stopPropagation();
                    playSound(phoneme.rawSymbol);
                  }}
                  onSelect={() => setSelectedPhoneme(phoneme)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPhonemes.map((phoneme) => (
                <PhonemeRow
                  key={phoneme.symbol}
                  phoneme={phoneme}
                  isPlaying={playingSymbol === phoneme.rawSymbol}
                  isSelected={selectedPhoneme.symbol === phoneme.symbol}
                  onPlay={(event) => {
                    event.stopPropagation();
                    playSound(phoneme.rawSymbol);
                  }}
                  onSelect={() => setSelectedPhoneme(phoneme)}
                />
              ))}
            </div>
          )}

          {filteredPhonemes.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="dashed"
                size="lg"
                className="border-[var(--line-divider)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)]"
              >
                <span className="text-lg">+</span>
                Custom Set
              </Button>
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 border"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--line-divider)",
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shrink-0"
          style={{ backgroundColor: "var(--primary)" }}
        >
          ✦
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
            Smart Phonology AI
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Our AI detects nuances in your accent and suggests specific IPA targets to improve
            clarity. Click any symbol to start training.
          </p>
        </div>
        <Button variant="primary" size="lg" className="shrink-0 whitespace-nowrap">
          Analyze Voice
        </Button>
      </div>
    </div>
  );
}
