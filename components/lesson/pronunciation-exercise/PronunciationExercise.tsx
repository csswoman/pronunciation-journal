"use client";

// Planned structure:
// <PronunciationExercise>
//   <ExerciseTopBar />         ← breadcrumb + difficulty toggle
//   <ExerciseStageBar />       ← 4px 3-segment fill bar
//   <SessionMomentumStrip />   ← attempts / nailed / retries / streak / timer
//   <div two-column>
//     <WordColumn />           ← word + IPA + sentence + listen/save
//     <WaveformZone />         ← reference + live animated waveform
//   </div>
//   <MicBand />                ← secondary actions + mic + phoneme chips
//   <StatsRibbon />            ← attempt dots + best score
//   dev toggle (fixed, bottom-right)
// </PronunciationExercise>

import { useState, useEffect, useRef } from "react";
import ExerciseTopBar from "./ExerciseTopBar";
import ExerciseStageBar from "./ExerciseStageBar";
import SessionMomentumStrip from "./SessionMomentumStrip";
import WordColumn from "./WordColumn";
import WaveformZone from "./WaveformZone";
import MicBand from "./MicBand";
import StatsRibbon from "./StatsRibbon";
import type { MicState, PhonemeResult, AttemptScore, IpaSegment } from "./exercise-types";

const MOCK_IPA: IpaSegment[] = [
  { text: "t",  isFocus: false },
  { text: "iː", isFocus: true },
  { text: "m",  isFocus: false },
];

const MOCK_PHONEMES: PhonemeResult[] = [
  { phoneme: "t",  variant: "correct" },
  { phoneme: "iː", variant: "failed" },
  { phoneme: "m",  variant: "close" },
];

const MOCK_ATTEMPTS: AttemptScore[] = [
  "excellent", "acceptable", "poor", "excellent", "acceptable",
];

const MIC_CYCLE: MicState[] = ["idle", "recording", "processing", "done"];

export default function PronunciationExercise() {
  const [micState, setMicState]       = useState<MicState>("idle");
  const [showFeedback, setShowFeedback] = useState(false);
  const [diffMode, setDiffMode]       = useState<"chill" | "master">("chill");
  const [stageIndex, setStageIndex]   = useState(0);
  const [elapsed, setElapsed]         = useState(134); // demo start: 2:14
  const doneRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => () => { if (doneRef.current) clearTimeout(doneRef.current); }, []);

  function handleStart() { setMicState("recording"); setShowFeedback(false); }
  function handleStop()  { setMicState("processing"); }
  function handleRetry() { setMicState("idle"); setShowFeedback(false); }

  function cycleMicState() {
    setMicState(prev => {
      const next = MIC_CYCLE[(MIC_CYCLE.indexOf(prev) + 1) % MIC_CYCLE.length];
      if (next === "done") {
        setShowFeedback(true);
        doneRef.current = setTimeout(() => setMicState("idle"), 600);
      }
      if (next === "recording") setShowFeedback(false);
      return next;
    });
  }

  return (
    <div className="flex flex-col h-screen bg-surface-base overflow-hidden">
      <ExerciseTopBar
        pattern="ea"
        wordIndex={1}
        totalWords={3}
        stageIndex={stageIndex}
        totalStages={3}
        diffMode={diffMode}
        onDiffChange={setDiffMode}
        onBack={() => {}}
      />

      <ExerciseStageBar
        stageIndex={stageIndex}
        wordProgress={0.33}
        onJumpStage={setStageIndex}
      />

      <SessionMomentumStrip
        attempts={5}
        nailed={3}
        retries={2}
        streak={4}
        elapsed={elapsed}
      />

      {/* Center stage — two-column */}
      <div className="flex flex-1 min-h-0 gap-space-6 px-space-8 max-w-[1280px] mx-auto w-full">
        <div className="flex-[55] min-w-0 flex flex-col justify-center">
          <WordColumn
            word="team"
            ipaSegments={MOCK_IPA}
            sentence="Our team won the championship."
            sentenceHighlight="team"
            isFav={false}
            onListen={() => {}}
            onToggleFav={() => {}}
          />
        </div>
        <div className="flex-[45] min-w-0">
          <WaveformZone
            phonemeSegments={["t", "iː", "m"]}
            isRecording={micState === "recording"}
            showUserWave={micState === "recording" || showFeedback}
          />
        </div>
      </div>

      <MicBand
        micState={micState}
        showFeedback={showFeedback}
        phonemeResults={MOCK_PHONEMES}
        coachingLine="Your /iː/ landed a bit short — try lengthening the vowel."
        onStart={handleStart}
        onStop={handleStop}
        onSkip={() => {}}
        onKnow={() => {}}
        onRetry={handleRetry}
      />

      <StatsRibbon
        attempts={MOCK_ATTEMPTS}
        bestToday={92}
        soundLabel="/iː/"
      />

      {/* Dev: cycle mic states */}
      <button
        onClick={cycleMicState}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-surface-tooltip px-space-3 py-space-1 text-caption text-on-primary opacity-50 hover:opacity-100 transition-opacity"
      >
        dev: {micState}
      </button>
    </div>
  );
}
