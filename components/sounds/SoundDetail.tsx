"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSpeakWord } from "@/hooks/useSpeakWord";
import type { Lesson } from "@/lib/types";
import { IPA_EXTRA } from "@/lib/pronunciation/ipa-data";
import { playIpaSound } from "@/lib/pronunciation/ipa-audio";
import { canonicalizeSoundIpa } from "@/lib/sounds/inventory";
import { getSoundDescription } from "@/lib/sounds/copy";
import { parseSoundDuration } from "@/lib/sounds/duration";
import { cancelSpeech } from "@/lib/speech/synthesis";
import type { PhonemeData } from "@/components/ipa/data";
import { cn } from "@/lib/cn";
import { SoundArticulation } from "./SoundArticulation";
import { SoundExamples } from "./SoundExamples";
import { SoundHeader, SoundProgress } from "./SoundHeader";
import { SoundPractice } from "./SoundPractice";
import { SoundSpanishTip } from "./SoundSpanishTip";

type Difficulty = "easy" | "medium" | "hard";

interface Props {
  phoneme: PhonemeData;
  lesson?: Lesson | null;
  progressPct?: number;
  isWeak?: boolean;
  isContinuing?: boolean;
  isPlaying?: boolean;
  practiceHref?: string;
  onPractice?: () => void;
  onPlay?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onClose?: () => void;
  titleId?: string;
  descriptionId?: string;
  playbackError?: string | null;
  className?: string;
}

function clampProgress(progressPct: number | undefined): number | undefined {
  if (progressPct === undefined || !Number.isFinite(progressPct)) return undefined;
  return Math.max(0, Math.min(100, Math.round(progressPct)));
}

function getDifficulty(
  phoneme: PhonemeData,
  lesson: Lesson | null | undefined,
): Difficulty | undefined {
  return IPA_EXTRA[canonicalizeSoundIpa(phoneme.symbol)]?.difficulty ?? lesson?.difficulty;
}

export function SoundDetail({
  phoneme,
  lesson,
  progressPct,
  isWeak = false,
  isContinuing = false,
  isPlaying,
  practiceHref = "/practice/sounds",
  onPractice,
  onPlay,
  onPrev,
  onNext,
  onClose,
  titleId,
  descriptionId,
  playbackError,
  className,
}: Props) {
  const extra = IPA_EXTRA[canonicalizeSoundIpa(phoneme.symbol)];
  const { speaking, speak, stop } = useSpeakWord();
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const safeProgress = clampProgress(progressPct);
  const difficulty = getDifficulty(phoneme, lesson);
  const duration = parseSoundDuration(lesson?.description);
  const examples = useMemo(
    () => {
      const canonicalExamples = [...new Set(phoneme.examples)].filter(Boolean).slice(0, 5);
      if (canonicalExamples.length > 0) return canonicalExamples;
      return [...new Set(lesson?.words.map((word) => word.word) ?? [])]
        .filter(Boolean)
        .slice(0, 5);
    },
    [lesson?.words, phoneme.examples],
  );
  const exampleWord = examples[0] ?? null;
  const isAudioPlaying = isPlaying ?? internalPlaying;
  const visibleAudioError = audioError ?? playbackError ?? null;
  const articulation = extra?.articulationEs.length
    ? extra.articulationEs
    : extra?.articulation ?? phoneme.tips;

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      cancelSpeech();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    setAudioError(null);
  }, [phoneme.rawSymbol]);

  function handlePlay() {
    setAudioError(null);

    if (onPlay) {
      onPlay();
      return;
    }

    if (internalPlaying) {
      audioRef.current?.pause();
      cancelSpeech();
      setInternalPlaying(false);
      return;
    }

    const result = playIpaSound(phoneme.rawSymbol, {
      onStart: () => setInternalPlaying(true),
      onEnd: () => setInternalPlaying(false),
      onError: () => {
        setInternalPlaying(false);
        setAudioError("No se pudo reproducir este sonido.");
      },
    });
    audioRef.current = result?.kind === "audio" ? result.audio : null;
  }

  function handleSpeakExample(word: string) {
    if (speaking === word) {
      stop();
      return;
    }
    setAudioError(null);
    speak(word);
  }

  return (
    <aside
      className={cn("ipa-chart__panel sound-detail", className)}
      {...(titleId
        ? {
            "aria-labelledby": titleId,
            ...(descriptionId ? { "aria-describedby": descriptionId } : {}),
          }
        : { "aria-label": `Detalle del sonido ${phoneme.symbol}` })}
    >
      <SoundHeader
        phoneme={phoneme}
        titleId={titleId}
        descriptionId={descriptionId}
        description={getSoundDescription(phoneme)}
        difficulty={difficulty}
        duration={duration}
        exampleWord={exampleWord}
        isContinuing={isContinuing}
        isWeak={isWeak}
        isPlaying={isAudioPlaying}
        onPlay={handlePlay}
        onPrev={onPrev}
        onNext={onNext}
        onClose={onClose}
      />

      {visibleAudioError ? (
        <div className="sound-detail__audio-error" role="status">
          <span>{visibleAudioError}</span>
          <button type="button" onClick={handlePlay}>
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="ipa-chart__panel-body sound-detail__body">
        {safeProgress !== undefined ? <SoundProgress progress={safeProgress} /> : null}
        <SoundArticulation key={phoneme.symbol} articulation={articulation} symbol={phoneme.symbol} />
        <SoundExamples
          examples={examples}
          speaking={speaking}
          onSpeak={handleSpeakExample}
        />
        {extra?.spanishTip ? <SoundSpanishTip tip={extra.spanishTip} /> : null}
      </div>
      <div className="sound-detail__footer">
        <SoundPractice
          phoneme={phoneme}
          href={practiceHref}
          onPractice={onPractice}
        />
      </div>
    </aside>
  );
}
