"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { MessageCircle, Target } from "lucide-react";
import { IPA_AUDIO_MAP, SOUNDS_BASE_URL } from "@/lib/ipa-audio";
import {
  FILTER_TABS,
  PHONEMES,
  type FilterType,
  type PhonemeData,
} from "@/components/ipa-chart/data";
import { HARD_FOR_SPANISH_SPEAKERS } from "@/lib/ipa-data";
import FeaturedPhonemePanel from "@/components/ipa-chart/FeaturedPhonemePanel";
import FilterTabs from "@/components/ipa-chart/FilterTabs";
import PhonemeCard from "@/components/ipa-chart/PhonemeCard";
import PhonemeRow from "@/components/ipa-chart/PhonemeRow";
import ViewToggle from "@/components/ipa-chart/ViewToggle";

export default function IPAChart() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeData>(
    () => PHONEMES[Math.floor(Math.random() * PHONEMES.length)]
  );
  const [playingSymbol, setPlayingSymbol] = useState<string | null>(null);
  const [gridView, setGridView] = useState<"grid" | "list">("grid");
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      currentAudioRef.current?.pause();
    };
  }, []);

  const speakExample = (word: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = "en-US";
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  };

  const playSound = (rawSymbol: string, example?: string) => {
    const fileName = IPA_AUDIO_MAP[rawSymbol];
    if (!fileName) return;

    currentAudioRef.current?.pause();
    window.speechSynthesis?.cancel();

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
  };

  const filteredPhonemes =
    activeFilter === "all"
      ? PHONEMES
      : PHONEMES.filter((phoneme) => phoneme.type === activeFilter);

  const phonemeCounts = {
    all: PHONEMES.length,
    vowel: PHONEMES.filter((p) => p.type === "vowel").length,
    consonant: PHONEMES.filter((p) => p.type === "consonant").length,
    diphthong: PHONEMES.filter((p) => p.type === "diphthong").length,
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <FilterTabs
        tabs={FILTER_TABS}
        activeTab={activeFilter}
        onChange={setActiveFilter}
        counts={phonemeCounts}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="space-y-4">
          <FeaturedPhonemePanel
            phoneme={selectedPhoneme}
            isPlaying={playingSymbol === selectedPhoneme.rawSymbol}
            onPlay={() => playSound(selectedPhoneme.rawSymbol, selectedPhoneme.example)}

          />

          <div className="rounded-3xl p-6 text-white" style={{ backgroundColor: "var(--primary)" }}>
            <h3 className="font-bold text-base mb-1">
              Practice {selectedPhoneme.symbol}
            </h3>
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              Drill this sound with targeted exercises and track your progress in the practice area.
            </p>
            <Link href="/practice">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                className="border-white/30 bg-white/15 text-white hover:bg-white/25 hover:text-white"
              >
                <Target size={16} />
                Go to Practice
              </Button>
            </Link>
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
                    playSound(phoneme.rawSymbol, phoneme.example);
                  }}
                  onSelect={() => {
                    setSelectedPhoneme(phoneme);
                    playSound(phoneme.rawSymbol, phoneme.example);
                  }}
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
                    playSound(phoneme.rawSymbol, phoneme.example);
                  }}
                  onSelect={() => {
                    setSelectedPhoneme(phoneme);
                    playSound(phoneme.rawSymbol, phoneme.example);
                  }}
                />
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center gap-4 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              Difficulty for Spanish speakers:
            </span>
            {[
              { color: "#22c55e", label: "Easy" },
              { color: "#eab308", label: "Moderate" },
              { color: "#ef4444", label: "Hard" },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>

          {activeFilter === "all" && (
            <div
              className="mt-4 rounded-3xl p-5 border"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--line-divider)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🔥</span>
                <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  Difíciles para hispanohablantes
                </h3>
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
                Estos sonidos no existen en español — requieren práctica específica
              </p>
              <div className="flex flex-wrap gap-2">
                {HARD_FOR_SPANISH_SPEAKERS.map((symbol) => {
                  const phoneme = PHONEMES.find((p) => p.symbol === symbol);
                  if (!phoneme) return null;
                  const isActive = selectedPhoneme.symbol === symbol;
                  return (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => {
                        setSelectedPhoneme(phoneme);
                        playSound(phoneme.rawSymbol, phoneme.example);
                      }}
                      className="group relative text-left rounded-2xl px-3 py-2 border transition-all duration-150 hover:scale-[1.04] focus:outline-none"
                      style={{
                        backgroundColor: isActive ? "var(--primary)" : "var(--btn-regular-bg)",
                        borderColor: isActive ? "var(--primary)" : "var(--line-divider)",
                      }}
                    >
                      <span
                        className="text-base font-bold font-ipa block leading-none"
                        style={{ color: isActive ? "white" : "var(--text-primary)" }}
                      >
                        {symbol}
                      </span>
                      <span
                        className="text-[9px] block mt-0.5"
                        style={{ color: isActive ? "rgba(255,255,255,0.65)" : "var(--text-secondary)" }}
                      >
                        {phoneme.example}
                      </span>
                    </button>
                  );
                })}
              </div>
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
          💬
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
            Practice with AI
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Have real conversations with Gemini-powered AI and get pronunciation feedback on the sounds you just explored.
          </p>
        </div>
        <Link href="/ai-practice">
          <Button variant="primary" size="lg" className="shrink-0 whitespace-nowrap">
            <MessageCircle size={16} />
            Start Session
          </Button>
        </Link>
      </div>
    </div>
  );
}
