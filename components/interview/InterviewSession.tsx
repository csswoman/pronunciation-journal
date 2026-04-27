"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ScoringResult } from "@/lib/types";
import type { ExerciseDifficulty, Level } from "./CandidateRecorder";
import { speakPromise } from "./interview-utils";
import { InterviewTopBar } from "./InterviewTopBar";
import { InterviewerBubble } from "./InterviewerBubble";
import { CandidateBubble } from "./CandidateBubble";
import { InterviewResults } from "./InterviewResults";

export interface InterviewTurn {
  role: "interviewer" | "candidate";
  text: string;
}

interface Props {
  title: string;
  turns: InterviewTurn[];
  difficulty: ExerciseDifficulty;
  level: Level;
  onReset: () => void;
}

export default function InterviewSession({ title, turns, difficulty, level, onReset }: Props) {
  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const [visibleCount, setVisibleCount] = useState(1);
  const [results, setResults] = useState<Map<number, { score: ScoringResult; transcript: string }>>(new Map());
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const playAllAbort = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentIdx = visibleCount - 1;
  const isDone = visibleCount >= turns.length && results.has(turns.length - 1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleCount, results.size]);

  useEffect(() => {
    if (!speechSupported || turns[0]?.role !== "interviewer") return;
    playTurn(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playTurn = useCallback(async (idx: number) => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    setPlayingIdx(idx);
    await speakPromise(turns[idx].text);
    setPlayingIdx(null);
  }, [turns, speechSupported]);

  const stopTurn = () => {
    if (speechSupported) window.speechSynthesis.cancel();
    setPlayingIdx(null);
  };

  const handlePlayAll = async () => {
    if (isPlayingAll) {
      playAllAbort.current = true;
      window.speechSynthesis.cancel();
      setIsPlayingAll(false);
      setPlayingIdx(null);
      return;
    }
    playAllAbort.current = false;
    setIsPlayingAll(true);
    for (let i = 0; i < turns.length; i++) {
      if (playAllAbort.current) break;
      setPlayingIdx(i);
      await speakPromise(turns[i].text);
      setPlayingIdx(null);
      if (playAllAbort.current) break;
      await new Promise<void>((r) => setTimeout(r, 500));
    }
    setIsPlayingAll(false);
  };

  const revealNext = () => {
    if (visibleCount >= turns.length) return;
    const nextIdx = visibleCount;
    setVisibleCount(visibleCount + 1);
    if (turns[nextIdx]?.role === "interviewer") {
      setTimeout(() => playTurn(nextIdx), 300);
    }
  };

  const handleReset = () => {
    window.speechSynthesis?.cancel();
    onReset();
  };

  if (showResults) {
    return (
      <InterviewResults
        title={title}
        turns={turns}
        results={results}
        difficulty={difficulty}
        level={level}
        onReset={onReset}
      />
    );
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      <InterviewTopBar
        title={title}
        visibleCount={visibleCount}
        totalTurns={turns.length}
        speechSupported={speechSupported}
        isPlayingAll={isPlayingAll}
        onPlayAll={handlePlayAll}
        onReset={handleReset}
      />

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4"
        style={{ background: "var(--muted-bg)" }}>

        {turns.slice(0, visibleCount).map((turn, idx) => {
          const isActive = idx === currentIdx;
          const isCurrentlyPlaying = playingIdx === idx;
          const turnResult = results.get(idx);

          if (turn.role === "interviewer") {
            return (
              <InterviewerBubble
                key={idx}
                text={turn.text}
                isActive={isActive}
                isPlaying={isCurrentlyPlaying}
                hasNextCandidate={isActive && idx + 1 < turns.length && turns[idx + 1].role === "candidate"}
                onListen={() => isCurrentlyPlaying ? stopTurn() : playTurn(idx)}
                onRevealNext={revealNext}
              />
            );
          }

          return (
            <CandidateBubble
              key={idx}
              idx={idx}
              text={turn.text}
              isActive={isActive}
              isListening={isCurrentlyPlaying}
              turnResult={turnResult}
              difficulty={difficulty}
              level={level}
              isDone={isDone}
              onRecordDone={(score, transcript) =>
                setResults((prev) => new Map(prev).set(idx, { score, transcript }))
              }
              onListen={() => isCurrentlyPlaying ? stopTurn() : playTurn(idx)}
              onRetry={() => setResults((prev) => { const m = new Map(prev); m.delete(idx); return m; })}
              onNext={() => isDone ? setShowResults(true) : revealNext()}
            />
          );
        })}

        {isPlayingAll && (
          <div className="flex justify-center py-2">
            <span className="flex gap-1 items-end h-5">
              {[1, 2, 3].map((i) => (
                <span key={i} className="w-1 rounded-full animate-bounce"
                  style={{ height: `${6 + i * 4}px`, background: "var(--color-accent)", animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!speechSupported && (
        <div className="flex-shrink-0 px-4 py-2 text-center text-xs"
          style={{ color: "var(--muted-text)", background: "var(--card-bg)", borderTop: "1px solid var(--line-divider)" }}>
          Speech synthesis not supported — audio playback is disabled.
        </div>
      )}
    </div>
  );
}
