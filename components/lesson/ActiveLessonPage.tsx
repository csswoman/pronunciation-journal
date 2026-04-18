"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getLessonById } from "@/lib/lesson-generator";
import { useScoring } from "@/hooks/useScoring";
import { useLesson } from "@/hooks/useLesson";
import { useRecorder } from "@/hooks/useRecorder";
import { useTranscription } from "@/hooks/useTranscription";
import { calculateXP } from "@/lib/scoring";
import { fetchPronunciation } from "@/lib/dictionary";
import { isFavorite, toggleFavorite, getLessonOffset, advanceLessonOffset, LESSON_SESSION_SIZE } from "@/lib/db";
import AudioWaveform from "@/components/lesson/AudioWaveform";
import { LessonLobby, emptyLessonMastery } from "@/components/lesson/LessonLobby";
import type { LessonStageId, LessonStageMasteryMap, DifficultyMode } from "@/components/lesson/LessonLobby";
import type { Lesson } from "@/lib/types";
import PageLayout from "@/components/layout/PageLayout";
import SessionHeader from "./SessionHeader";
import WordCard from "./WordCard";
import RecordingControls from "./RecordingControls";
import FeedbackSection from "./FeedbackSection";
import CompleteSection from "./CompleteSection";

export type Phase = "ready" | "recording" | "processing" | "feedback" | "no-audio" | "complete";

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--page-bg)" }}>
      <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

interface Props {
  backHref: string;
}

export default function ActiveLessonPage({ backHref }: Props) {
  const params = useParams();
  const lessonId = params.id as string;
  const staticLesson = getLessonById(lessonId);
  const isDynamic = !staticLesson && (lessonId.startsWith("pattern-") || lessonId.startsWith("sound-"));
  const [dynamicLesson, setDynamicLesson] = useState<Lesson | null | undefined>(
    isDynamic ? undefined : null
  );

  useEffect(() => {
    if (!isDynamic) return;
    import("@/lib/lesson-generator-db").then(({ getDbLessonById }) =>
      getDbLessonById(lessonId).then(setDynamicLesson)
    );
  }, [lessonId, isDynamic]);

  const fullLesson = staticLesson ?? dynamicLesson;

  const [view, setView] = useState<"lobby" | "session">("lobby");
  const [activeStage, setActiveStage] = useState<LessonStageId>("guided");
  const [stageMastery, setStageMastery] = useState<LessonStageMasteryMap>(emptyLessonMastery());
  const [lessonData, setLessonData] = useState<Lesson | null | undefined>(undefined);
  const [sessionOffset, setSessionOffset] = useState(0);

  useEffect(() => {
    if (!fullLesson) return;
    getLessonOffset(lessonId).then(setSessionOffset);
  }, [fullLesson, lessonId]);

  function handleSelectStage(stageId: LessonStageId, diff: DifficultyMode) {
    if (!fullLesson) return;
    const baseThreshold = stageId === "speed" ? 85 : stageId === "pronunciation" ? 75 : 65;
    setScoringThreshold(diff === "master" ? Math.min(baseThreshold + 15, 95) : baseThreshold);
    import("@/lib/lesson-generator-db").then(({ sliceLessonWords }) => {
      const sliced = sliceLessonWords(fullLesson, sessionOffset, LESSON_SESSION_SIZE);
      const stageWords = sliced.words.map((w) => ({
        ...w,
        ipa: stageId === "pronunciation" || stageId === "speed" ? "" : w.ipa,
        hint: stageId === "speed" ? undefined : w.hint,
        audioUrl: stageId === "speed" ? undefined : w.audioUrl,
      }));
      setLessonData({ ...sliced, words: stageWords });
      setActiveStage(stageId);
      setView("session");
    });
  }

  async function handleBackToLobby() {
    setView("lobby");
    setLessonData(undefined);
    setPhase("ready");
  }

  const totalChunks = fullLesson ? Math.ceil(fullLesson.words.length / LESSON_SESSION_SIZE) : 1;
  const sessionChunk = fullLesson ? Math.floor(sessionOffset / LESSON_SESSION_SIZE) + 1 : 1;

  const [phase, setPhase] = useState<Phase>("ready");
  const [scoringThreshold, setScoringThreshold] = useState(70);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [wordAudioUrl, setWordAudioUrl] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  const {
    currentWord, currentIndex, totalWords, wordAttempts, sessionAccuracy, totalXP,
    startLesson, addResult, nextWord, skipWord, markKnown, retryWord, resetLesson,
  } = useLesson();

  const { result: scoringResult, xpEarned, feedback, scoreAndSave, reset: resetScoring } = useScoring();

  const currentWordRef = useRef(currentWord);
  useEffect(() => { currentWordRef.current = currentWord; }, [currentWord]);
  const lessonIdRef = useRef(lessonId);
  const scoringThresholdRef = useRef(scoringThreshold);
  useEffect(() => { scoringThresholdRef.current = scoringThreshold; }, [scoringThreshold]);

  const processSpeechResult = useCallback(async (text: string) => {
    const word = currentWordRef.current;
    if (!word) return;
    if (!text.trim()) { setPhase("no-audio"); return; }
    try {
      const result = await scoreAndSave(text, word.word, lessonIdRef.current, scoringThresholdRef.current);
      addResult(result, calculateXP(result.accuracy), word.word);
      setPhase("feedback");
    } catch (err) {
      console.error("Scoring error:", err);
      setPhase("ready");
    }
  }, [addResult, scoreAndSave]);

  const { isRecording, audioUrl, startRecording, stopRecording, resetRecording } = useRecorder();

  const geminiInFlightRef = useTranscription({
    phase,
    audioUrl,
    currentWord: currentWordRef.current?.word ?? "",
    onResult: processSpeechResult,
  });

  useEffect(() => {
    if (!currentWord) return;
    setWordAudioUrl(currentWord.audioUrl ?? null);
    setIsFav(false);
    if (!currentWord.audioUrl) {
      fetchPronunciation(currentWord.word)
        .then((data) => { if (data.audioUrl) setWordAudioUrl(data.audioUrl); })
        .catch(() => {});
    }
    isFavorite(currentWord.word).then(setIsFav);
  }, [currentWord]);

  const handleToggleFavorite = useCallback(async () => {
    if (!currentWord) return;
    const nowFav = await toggleFavorite(currentWord.word, lessonIdRef.current, currentWord.ipa);
    setIsFav(nowFav);
  }, [currentWord]);

  useEffect(() => {
    if (!lessonData) return;
    resetLesson();
    startLesson(lessonData);
    setPhase("ready");
  }, [lessonData]);

  useEffect(() => {
    if (!lessonData) return;
    import("@/lib/phonemes")
      .then(({ warmupPhonemeEngine }) => warmupPhonemeEngine(lessonData.words.map((w) => w.word)))
      .catch(() => {});
  }, [lessonData]);

  const resetForNext = useCallback(() => {
    resetScoring();
    resetRecording();
    geminiInFlightRef.current = false;
  }, [resetScoring, resetRecording, geminiInFlightRef]);

  const handleStartRecording = useCallback(async () => {
    resetForNext();
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setStream(ms);
      await startRecording();
      setPhase("recording");
    } catch (err) {
      console.error("Mic error:", err);
    }
  }, [resetForNext, startRecording]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setPhase("processing");
  }, [stopRecording, stream]);

  const handleCancelRecording = useCallback(() => {
    stopRecording();
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    resetRecording();
    geminiInFlightRef.current = false;
    setPhase("ready");
  }, [stopRecording, stream, resetRecording, geminiInFlightRef]);

  const handleNext = useCallback(() => {
    resetForNext();
    const isLast = currentIndex + 1 >= totalWords;
    if (isLast) {
      if (isDynamic && fullLesson && fullLesson.words.length > LESSON_SESSION_SIZE) {
        advanceLessonOffset(lessonId, fullLesson.words.length).then(setSessionOffset);
      }
      if (isDynamic) {
        setStageMastery((prev) => ({
          ...prev,
          [activeStage]: { pct: Math.round(sessionAccuracy), attempts: prev[activeStage].attempts + 1 },
        }));
      }
      setPhase("complete");
    } else {
      nextWord();
      setPhase("ready");
    }
  }, [resetForNext, nextWord, currentIndex, totalWords, isDynamic, fullLesson, lessonId, activeStage, sessionAccuracy]);

  const handleRetry = useCallback(() => {
    resetForNext();
    retryWord();
    setPhase("ready");
  }, [resetForNext, retryWord]);

  const handleSkip = useCallback(() => {
    if (!currentWord) return;
    resetForNext();
    skipWord(currentWord.word);
    if (currentIndex + 1 >= totalWords) setPhase("complete");
    else setPhase("ready");
  }, [resetForNext, currentWord, currentIndex, totalWords, skipWord]);

  const handleMarkKnown = useCallback(() => {
    if (!currentWord) return;
    resetForNext();
    markKnown(currentWord.word, currentIndex);
    if (currentIndex >= totalWords - 1) setPhase("complete");
    else setPhase("ready");
  }, [resetForNext, currentWord, currentIndex, totalWords, markKnown]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (fullLesson === undefined) return <LoadingSpinner />;

  if (view === "lobby" && fullLesson) {
    return (
      <PageLayout variant="lesson">
        <LessonLobby
          lesson={fullLesson}
          totalWords={fullLesson.words.length}
          sessionChunk={sessionChunk}
          totalChunks={totalChunks}
          mastery={stageMastery}
          onSelectStage={handleSelectStage}
          backHref={backHref}
        />
      </PageLayout>
    );
  }

  if (lessonData === undefined) return <LoadingSpinner />;

  if (!lessonData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--page-bg)" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--deep-text)" }}>Lesson not found</h1>
          <a href={backHref} style={{ color: "var(--primary)" }}>← Back</a>
        </div>
      </div>
    );
  }

  return (
    <PageLayout variant="lesson" hero={
      <SessionHeader
        title={lessonData.title}
        currentIndex={currentIndex}
        totalWords={totalWords}
        phase={phase}
        onBack={handleBackToLobby}
      />
    }>
      <main className="py-10 px-6 w-full lg:px-8">
        {phase === "complete" && (
          <CompleteSection
            wordAttempts={wordAttempts}
            sessionAccuracy={sessionAccuracy}
            totalXP={totalXP}
            totalWords={totalWords}
            isDynamic={isDynamic}
            backHref={backHref}
            lessonData={lessonData}
            onBackToLobby={handleBackToLobby}
            onRetryLesson={() => { resetLesson(); startLesson(lessonData); setPhase("ready"); }}
          />
        )}

        {phase !== "complete" && currentWord && (
          <div className="flex flex-col items-center space-y-10">
            <WordCard
              word={currentWord.word}
              ipa={currentWord.ipa}
              hint={currentWord.hint}
              audioUrl={wordAudioUrl}
              isFav={isFav}
              onToggleFavorite={handleToggleFavorite}
            />

            <div className="w-full">
              <AudioWaveform isRecording={isRecording} stream={stream} />
            </div>

            <RecordingControls
              phase={phase}
              currentIndex={currentIndex}
              totalWords={totalWords}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              onCancel={handleCancelRecording}
              onRetry={handleRetry}
              onSkip={handleSkip}
              onMarkKnown={handleMarkKnown}
            />

            {phase === "feedback" && scoringResult && feedback && (
              <FeedbackSection
                scoringResult={scoringResult}
                feedback={feedback}
                xpEarned={xpEarned}
                currentIndex={currentIndex}
                totalWords={totalWords}
                onRetry={handleRetry}
                onNext={handleNext}
              />
            )}
          </div>
        )}
      </main>
    </PageLayout>
  );
}
