"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useScoring } from "@/hooks/useScoring";
import { useLesson } from "@/hooks/useLesson";
import { useRecorder } from "@/hooks/useRecorder";
import { useTranscription } from "@/hooks/useTranscription";
import { calculateXP } from "@/lib/scoring";
import { fetchPronunciation } from "@/lib/dictionary";
import { isFavorite, toggleFavorite } from "@/lib/db";
import type { Lesson, LessonWord } from "@/lib/types";
import type { Phase } from "@/components/lesson/ActiveLessonPage";
import type { LessonStageId, LessonStageMasteryMap } from "@/components/lesson/LessonLobby";

interface UseLessonSessionOptions {
  lessonId: string;
  lessonData: Lesson | null | undefined;
  activeStage: LessonStageId;
  isDynamic: boolean;
  scoringThreshold: number;
  setStageMastery: React.Dispatch<React.SetStateAction<LessonStageMasteryMap>>;
  advanceOffset: () => void;
}

interface UseLessonSessionReturn {
  phase: Phase;
  setPhase: (p: Phase) => void;
  currentWord: LessonWord | null;
  currentIndex: number;
  totalWords: number;
  wordAttempts: ReturnType<typeof useLesson>["wordAttempts"];
  sessionAccuracy: number;
  totalXP: number;
  scoringResult: ReturnType<typeof useScoring>["result"];
  xpEarned: number;
  feedback: ReturnType<typeof useScoring>["feedback"];
  isRecording: boolean;
  stream: MediaStream | null;
  wordAudioUrl: string | null;
  isFav: boolean;
  startLesson: (lesson: Lesson) => void;
  resetLesson: () => void;
  handleStartRecording: () => Promise<void>;
  handleStopRecording: () => void;
  handleCancelRecording: () => void;
  handleNext: () => void;
  handleRetry: () => void;
  handleSkip: () => void;
  handleMarkKnown: () => void;
  handleToggleFavorite: () => Promise<void>;
}

export function useLessonSession({
  lessonId,
  lessonData,
  activeStage,
  isDynamic,
  scoringThreshold,
  setStageMastery,
  advanceOffset,
}: UseLessonSessionOptions): UseLessonSessionReturn {
  const [phase, setPhase] = useState<Phase>("ready");
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
      advanceOffset();
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
  }, [resetForNext, nextWord, currentIndex, totalWords, isDynamic, activeStage, sessionAccuracy, advanceOffset, setStageMastery]);

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

  const handleToggleFavorite = useCallback(async () => {
    if (!currentWord) return;
    const nowFav = await toggleFavorite(currentWord.word, lessonIdRef.current, currentWord.ipa);
    setIsFav(nowFav);
  }, [currentWord]);

  return {
    phase,
    setPhase,
    currentWord,
    currentIndex,
    totalWords,
    wordAttempts,
    sessionAccuracy,
    totalXP,
    scoringResult,
    xpEarned,
    feedback,
    isRecording,
    stream,
    wordAudioUrl,
    isFav,
    startLesson,
    resetLesson,
    handleStartRecording,
    handleStopRecording,
    handleCancelRecording,
    handleNext,
    handleRetry,
    handleSkip,
    handleMarkKnown,
    handleToggleFavorite,
  };
}
