"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface Props {
  lesson: Lesson | null;
  progress: number;
  onResume?: () => void;
}

const PHONEME_DESCRIPTORS: Record<string, string> = {
  b: "PLOSIVE · VOICED · BILABIAL",
  p: "PLOSIVE · VOICELESS · BILABIAL",
  d: "PLOSIVE · VOICED · ALVEOLAR",
  t: "PLOSIVE · VOICELESS · ALVEOLAR",
  g: "PLOSIVE · VOICED · VELAR",
  k: "PLOSIVE · VOICELESS · VELAR",
  f: "FRICATIVE · VOICELESS · LABIODENTAL",
  v: "FRICATIVE · VOICED · LABIODENTAL",
  s: "FRICATIVE · VOICELESS · ALVEOLAR",
  z: "FRICATIVE · VOICED · ALVEOLAR",
  ʃ: "FRICATIVE · VOICELESS · POSTALVEOLAR",
  ʒ: "FRICATIVE · VOICED · POSTALVEOLAR",
  m: "NASAL · VOICED · BILABIAL",
  n: "NASAL · VOICED · ALVEOLAR",
  ŋ: "NASAL · VOICED · VELAR",
  l: "LATERAL · VOICED · ALVEOLAR",
  r: "RHOTIC · VOICED · ALVEOLAR",
  w: "APPROXIMANT · VOICED · LABIAL-VELAR",
  j: "APPROXIMANT · VOICED · PALATAL",
  h: "FRICATIVE · VOICELESS · GLOTTAL",
};

const BAR_COUNT = 80;
const TOTAL_SECONDS = 60;

function extractIpaCore(title: string): string | null {
  const m = title.match(/^\/([^/]+)\//);
  return m ? m[1] : null;
}

function generateBarHeights(count: number, seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Array.from({ length: count }, (_, i) => {
    const pseudo = Math.abs(Math.sin(hash + i * 7.3) * 10000) % 1;
    const envelope = Math.sin((i / count) * Math.PI) * 0.8;
    const micro = Math.abs(Math.sin(hash * 0.1 + i * 2.1)) * 0.2;
    return Math.max(0.05, pseudo * 0.55 * envelope + micro + 0.04);
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function SoundLabContinuingBar({ lesson, progress, onResume }: Props) {
  const [hovered, setHovered] = useState(false);
  const [liveHeights, setLiveHeights] = useState<number[] | null>(null);
  const rafRef = useRef(0);

  const baseHeights = useMemo(
    () => (lesson ? generateBarHeights(BAR_COUNT, lesson.id) : []),
    [lesson],
  );

  useEffect(() => {
    if (!hovered) {
      cancelAnimationFrame(rafRef.current);
      setLiveHeights(null);
      return;
    }
    const startedAt = performance.now();
    function tick(now: number) {
      const t = (now - startedAt) / 1000;
      setLiveHeights(
        baseHeights.map((h, i) => {
          const wave = Math.sin(t * 2.8 + i * 0.22) * 0.14;
          return Math.max(0.04, Math.min(0.92, h + wave));
        }),
      );
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [hovered, baseHeights]);

  if (!lesson) return null;

  const displayHeights = liveHeights ?? baseHeights;
  const ipaCore = extractIpaCore(lesson.title);
  const ipaLabel = ipaCore ? `//${ipaCore}//` : lesson.title;
  const descriptors = ipaCore ? (PHONEME_DESCRIPTORS[ipaCore] ?? "") : "";
  const nowBarIndex = Math.round((progress / 100) * BAR_COUNT);
  const elapsed = Math.round((progress / 100) * TOTAL_SECONDS);

  return (
    <div
      className="relative cursor-default overflow-hidden rounded-md bg-primary-50 px-space-6 py-space-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row: phoneme label · REC timer · percentage */}
      <div className="mb-space-3 flex items-baseline justify-between gap-space-4">
        <div className="flex items-baseline gap-space-2">
          <span className="text-tiny font-medium uppercase tracking-widest text-fg-subtle">{ipaLabel}</span>
          {descriptors && (
            <span className="text-tiny font-light uppercase tracking-widest text-fg-muted">{descriptors}</span>
          )}
        </div>

        <div className="flex items-center gap-space-4 ml-auto">
          {/* REC indicator lives here, contextually tied to the waveform */}
          <div className="flex items-center gap-space-1 text-tiny text-fg-subtle">
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="font-medium uppercase tracking-wider">
              {formatTime(elapsed)} / {formatTime(TOTAL_SECONDS)}
            </span>
          </div>
          <span className="font-heading text-body font-black text-primary">{progress}%</span>
        </div>
      </div>

      {/* Waveform row: play button + bars */}
      <div className="flex items-center gap-space-3">
        {/* Play / resume button */}
        <button
          type="button"
          onClick={onResume}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm transition-all duration-150 hover:scale-105 hover:shadow-md active:scale-95"
          aria-label="Resume lesson"
        >
          <Play className="h-3.5 w-3.5 translate-x-px fill-current" />
        </button>

        {/* Bars */}
        <div className="flex flex-1 items-center justify-start gap-[3px]" style={{ height: 56 }}>
          {displayHeights.map((h, i) => {
            const played = i <= nowBarIndex;
            const distanceAfter = i - nowBarIndex;
            const remainingBars = Math.max(BAR_COUNT - nowBarIndex, 1);
            const opacity = played
              ? 0.65
              : Math.max(0.04, 0.22 * Math.pow(1 - distanceAfter / remainingBars, 2));
            return (
              <div
                key={i}
                className="shrink-0 rounded-full"
                style={{
                  width: 2,
                  height: `${Math.round(h * 100)}%`,
                  backgroundColor: "var(--color-primary)",
                  opacity,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Time markers */}
      <div className="relative mt-space-2 flex items-center justify-between pl-11 text-tiny text-fg-subtle">
        <span>{formatTime(0)}</span>
        <span
          className="absolute -translate-x-1/2 text-fg-muted"
          style={{ left: `calc(2.75rem + ${Math.min(Math.max(progress, 3), 96)}% * (100% - 2.75rem) / 100%)` }}
        >
          ↑ NOW
        </span>
        <span>{formatTime(TOTAL_SECONDS)}</span>
      </div>
    </div>
  );
}
