"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useScoring } from "@/hooks/useScoring";
import { useLesson } from "@/hooks/useLesson";
import { useSharedMicStream } from "@/hooks/useSharedMicStream";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { calculateXP } from "@/lib/pronunciation/scoring";
import { fetchPronunciation } from "@/lib/pronunciation/dictionary";
import { isFavorite, toggleFavorite } from "@/lib/db";
import { db } from "@/lib/db";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getUserLearningState } from "@/lib/ai-practice/load-state";
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
  const syncCEFRAtSessionEnd = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      const localRow = await db.learningState.get(userId);
      const localState = localRow?.state ?? await getUserLearningState(userId);
      const cefrEstimate = localState.level.cefrEstimate;
      const { data: previous } = await supabase
        .from("user_profiles" as never)
        .select("cefr_level")
        .eq("id", userId)
        .maybeSingle();
      const previousProfile = previous as { cefr_level?: string } | null;
      if (previousProfile?.cefr_level === cefrEstimate) return;
      const { error } = await supabase
        .from("user_profiles" as never)
        .upsert({ id: userId, cefr_level: cefrEstimate } as never, { onConflict: "id" });
      if (error) console.error("Failed to sync cefr_level:", error);
    } catch (error) {
      console.error("Failed to sync cefr_level:", error);
    }
  }, []);
  const [phase, setPhase] = useState<Phase>("ready");
  const [stream] = useState<MediaStream | null>(null);
  const [wordAudioUrl, setWordAudioUrl] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  const {
    currentWord, currentIndex, totalWords, wordAttempts, sessionAccuracy, totalXP,
    startLesson, addResult, nextWord, skipWord, markKnown, retryWord, resetLesson,
  } = useLesson();

  const { result: scoringResult, xpEarned, feedback, scoreAndSave, reset: resetScoring } = useScoring();
  // TODO(Fase 3): migrate speech evaluation call site in hooks/useScoring.ts (scorePronunciation)
  // to defaultEvaluationEngine.evaluate() when text-based evaluator migration is ready.

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

  const { getStream, release: releaseMicStream } = useSharedMicStream();
  const { state: speechState, result: speechResult, start: startSpeech, stop: stopSpeech, abort: abortSpeech, reset: resetSpeech } = useSpeechInput({
    prefer: "gemini",
    getStream,
  });

  useEffect(() => {
    if (phase !== "processing" || speechState !== "done") return;
    void processSpeechResult(speechResult?.transcript ?? "");
  }, [phase, speechState, speechResult, processSpeechResult]);

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
    import("@/lib/pronunciation/phonemes")
      .then(({ warmupPhonemeEngine }) => warmupPhonemeEngine(lessonData.words.map((w) => w.word)))
      .catch(() => {});
  }, [lessonData]);

  const resetForNext = useCallback(() => {
    resetScoring();
    resetSpeech();
  }, [resetScoring, resetSpeech]);

  const handleStartRecording = useCallback(async () => {
    resetForNext();
    try {
      const ms = await getStream();
      await startSpeech();
      setPhase("recording");
    } catch (err) {
      console.error("Mic error:", err);
    }
  }, [resetForNext, getStream, startSpeech]);

  const handleStopRecording = useCallback(() => {
    void stopSpeech();
    releaseMicStream();
    setPhase("processing");
  }, [stopSpeech, releaseMicStream]);

  const handleCancelRecording = useCallback(() => {
    abortSpeech();
    releaseMicStream();
    resetSpeech();
    setPhase("ready");
  }, [abortSpeech, releaseMicStream, resetSpeech]);

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
      void syncCEFRAtSessionEnd();
    } else {
      nextWord();
      setPhase("ready");
    }
  }, [resetForNext, nextWord, currentIndex, totalWords, isDynamic, activeStage, sessionAccuracy, advanceOffset, setStageMastery, syncCEFRAtSessionEnd]);

  const handleRetry = useCallback(() => {
    resetForNext();
    retryWord();
    setPhase("ready");
  }, [resetForNext, retryWord]);

  const handleSkip = useCallback(() => {
    if (!currentWord) return;
    resetForNext();
    skipWord(currentWord.word);
    if (currentIndex + 1 >= totalWords) {
      setPhase("complete");
      void syncCEFRAtSessionEnd();
    }
    else setPhase("ready");
  }, [resetForNext, currentWord, currentIndex, totalWords, skipWord, syncCEFRAtSessionEnd]);

  const handleMarkKnown = useCallback(() => {
    if (!currentWord) return;
    resetForNext();
    markKnown(currentWord.word, currentIndex);
    if (currentIndex >= totalWords - 1) {
      setPhase("complete");
      void syncCEFRAtSessionEnd();
    }
    else setPhase("ready");
  }, [resetForNext, currentWord, currentIndex, totalWords, markKnown, syncCEFRAtSessionEnd]);

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
    isRecording: speechState === "listening",
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
