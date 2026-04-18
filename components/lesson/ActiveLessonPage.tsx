"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getLessonById } from "@/lib/lesson-generator";
import { useScoring } from "@/hooks/useScoring";
import { useLesson } from "@/hooks/useLesson";
import { useRecorder } from "@/hooks/useRecorder";
import { calculateXP } from "@/lib/scoring";
import { fetchPronunciation } from "@/lib/dictionary";
import { isFavorite, toggleFavorite, getLessonOffset, advanceLessonOffset, LESSON_SESSION_SIZE } from "@/lib/db";
import PronunciationFeedback from "@/components/lesson/PronunciationFeedback";
import AudioWaveform from "@/components/lesson/AudioWaveform";
import ScoreDisplay from "@/components/lesson/ScoreDisplay";
import { LessonLobby, emptyLessonMastery } from "@/components/lesson/LessonLobby";
import type { LessonStageId, LessonStageMasteryMap, DifficultyMode } from "@/components/lesson/LessonLobby";
import type { Lesson } from "@/lib/types";
import PageLayout from "@/components/layout/PageLayout";

type Phase = "ready" | "recording" | "processing" | "feedback" | "no-audio" | "complete";

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

  const totalChunks = fullLesson
    ? Math.ceil(fullLesson.words.length / LESSON_SESSION_SIZE)
    : 1;
  const sessionChunk = fullLesson
    ? Math.floor(sessionOffset / LESSON_SESSION_SIZE) + 1
    : 1;

  const [phase, setPhase] = useState<Phase>("ready");
  const [scoringThreshold, setScoringThreshold] = useState(70);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [wordAudioUrl, setWordAudioUrl] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  const {
    currentWord,
    currentIndex,
    totalWords,
    wordAttempts,
    sessionAccuracy,
    totalXP,
    startLesson,
    addResult,
    nextWord,
    skipWord,
    markKnown,
    retryWord,
    resetLesson,
  } = useLesson();

  const { result: scoringResult, xpEarned, feedback, scoreAndSave, reset: resetScoring } = useScoring();

  const currentWordRef = useRef(currentWord);
  useEffect(() => { currentWordRef.current = currentWord; }, [currentWord]);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  const lessonIdRef = useRef(lessonId);
  const scoringThresholdRef = useRef(scoringThreshold);
  useEffect(() => { scoringThresholdRef.current = scoringThreshold; }, [scoringThreshold]);
  const geminiInFlightRef = useRef(false);

  const processSpeechResult = useCallback(async (text: string) => {
    const word = currentWordRef.current;
    if (!word) return;
    if (!text.trim()) {
      setPhase("no-audio");
      return;
    }
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

  useEffect(() => {
    if (phase !== "processing") return;
    if (!audioUrl) return;
    if (geminiInFlightRef.current) return;

    geminiInFlightRef.current = true;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);
    const word = currentWordRef.current?.word ?? "";

    fetch("/api/gemini/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ audioDataUrl: audioUrl, targetWord: word }),
    })
      .then((res) => res.ok ? res.json() : res.json().then((d) => Promise.reject(d.error || "transcribe failed")))
      .then((data) => processSpeechResult(String(data.transcript ?? "").trim()))
      .catch((err) => {
        console.warn("[STT/Gemini] failed:", err);
        return processSpeechResult("");
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        geminiInFlightRef.current = false;
      });
  }, [audioUrl, phase, processSpeechResult]);

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

  const handleStartRecording = useCallback(async () => {
    resetScoring();
    resetRecording();
    geminiInFlightRef.current = false;
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
  }, [resetScoring, resetRecording, startRecording]);

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
  }, [stopRecording, stream, resetRecording]);

  const handleNext = useCallback(() => {
    resetScoring();
    resetRecording();
    geminiInFlightRef.current = false;
    const isLast = currentIndex + 1 >= totalWords;
    if (isLast) {
      if (isDynamic && fullLesson && fullLesson.words.length > LESSON_SESSION_SIZE) {
        advanceLessonOffset(lessonId, fullLesson.words.length).then(setSessionOffset);
      }
      if (isDynamic) {
        setStageMastery((prev) => ({
          ...prev,
          [activeStage]: {
            pct: Math.round(sessionAccuracy),
            attempts: prev[activeStage].attempts + 1,
          },
        }));
      }
      setPhase("complete");
    } else {
      nextWord();
      setPhase("ready");
    }
  }, [nextWord, resetScoring, resetRecording, currentIndex, totalWords,
      isDynamic, fullLesson, lessonId, activeStage, sessionAccuracy]);

  const handleRetry = useCallback(() => {
    resetScoring();
    resetRecording();
    geminiInFlightRef.current = false;
    retryWord();
    setPhase("ready");
  }, [retryWord, resetScoring, resetRecording]);

  const handleSkip = useCallback(() => {
    if (!currentWord) return;
    resetScoring();
    resetRecording();
    geminiInFlightRef.current = false;
    const isLast = currentIndex + 1 >= totalWords;
    skipWord(currentWord.word);
    if (isLast) setPhase("complete");
    else setPhase("ready");
  }, [currentWord, currentIndex, totalWords, skipWord, resetScoring, resetRecording]);

  const handleMarkKnown = useCallback(() => {
    if (!currentWord) return;
    resetScoring();
    resetRecording();
    geminiInFlightRef.current = false;
    markKnown(currentWord.word, currentIndex);
    const isLast = currentIndex >= totalWords - 1;
    if (isLast) setPhase("complete");
    else setPhase("ready");
  }, [currentWord, currentIndex, totalWords, markKnown, resetScoring, resetRecording]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (fullLesson === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--primary)' }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

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

  if (lessonData === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--primary)' }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--deep-text)' }}>Lesson not found</h1>
          <Link href={backHref} style={{ color: 'var(--primary)' }}>← Back</Link>
        </div>
      </div>
    );
  }

  const sessionHeader = (
    <header
      className="sticky top-0 z-10 border-b"
      style={{
        background: 'linear-gradient(180deg, color-mix(in_oklch,var(--card-bg)_92%,white), var(--card-bg))',
        borderColor: 'var(--line-divider)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="px-6 py-4 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handleBackToLobby}
            className="rounded-xl p-2.5 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="text-[18px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--deep-text)' }}>{lessonData.title}</h1>
            <p className="text-[13px] leading-5" style={{ color: 'var(--text-secondary)' }}>
              {phase !== "complete" ? `${currentIndex + 1} / ${totalWords}` : "Complete"}
            </p>
          </div>
          <div className="w-10" />
        </div>
        {phase !== "complete" && (
          <div className="mt-4 w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: 'var(--line-divider)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ backgroundColor: 'var(--primary)', width: `${((currentIndex + (phase === "feedback" ? 1 : 0)) / totalWords) * 100}%` }}
            />
          </div>
        )}
      </div>
    </header>
  );

  return (
    <PageLayout variant="lesson" hero={sessionHeader}>
      <main className="py-10 px-6 w-full lg:px-8">
        {phase === "complete" && (
          <div className="space-y-6">
            <ScoreDisplay wordAttempts={wordAttempts} sessionAccuracy={sessionAccuracy} totalXP={totalXP} totalWords={totalWords} />
            <div className="flex gap-3 justify-center">
              {isDynamic ? (
                <button
                  onClick={handleBackToLobby}
                  className="px-6 py-3 rounded-xl text-white font-medium transition-colors"
                  style={{ backgroundColor: 'var(--primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
                >
                  ← Back to Stages
                </button>
              ) : (
                <button
                  onClick={() => { resetLesson(); startLesson(lessonData); setPhase("ready"); }}
                  className="px-6 py-3 rounded-xl text-white font-medium transition-colors"
                  style={{ backgroundColor: 'var(--primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
                >
                  🔄 Retry Lesson
                </button>
              )}
              <Link href={backHref} className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                ← All Lessons
              </Link>
            </div>
          </div>
        )}

        {phase !== "complete" && currentWord && (
          <div className="flex flex-col items-center space-y-10">
            <div className="text-center space-y-4">
              <h2 className="text-[clamp(2.8rem,8vw,4.25rem)] font-semibold leading-none tracking-tight" style={{ color: 'var(--deep-text)' }}>{currentWord.word}</h2>
              <p className="text-[clamp(1.25rem,3vw,1.75rem)] font-mono" style={{ color: 'var(--primary)' }}>{currentWord.ipa}</p>
              {currentWord.hint && (
                <p className="mx-auto max-w-lg text-[15px] leading-6 italic" style={{ color: 'var(--text-secondary)' }}>💡 {currentWord.hint}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {wordAudioUrl && (
                <button
                  onClick={() => new Audio(wordAudioUrl).play()}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-white hover:opacity-90 transition-colors text-base"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Listen
                </button>
              )}
              <button
                onClick={handleToggleFavorite}
                aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                className="p-3 rounded-xl transition-colors"
                style={{ backgroundColor: 'var(--btn-regular-bg)' }}
              >
                {isFav ? (
                  <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-tertiary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="w-full">
              <AudioWaveform isRecording={isRecording} stream={stream} />
            </div>

            {phase === "ready" && (
              <div className="flex flex-col items-center gap-6">
                <button
                  onClick={handleStartRecording}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 transition-all flex items-center justify-center"
                  aria-label="Start recording"
                >
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleSkip}
                    className="text-sm px-4 py-2 rounded-lg transition-colors"
                    style={{ color: 'var(--text-tertiary)', backgroundColor: 'var(--btn-regular-bg)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >
                    Skip →
                  </button>
                  <button
                    onClick={handleMarkKnown}
                    className="text-sm px-4 py-2 rounded-lg transition-colors"
                    style={{ color: 'var(--text-tertiary)', backgroundColor: 'var(--btn-regular-bg)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >
                    I know this ✓
                  </button>
                </div>
              </div>
            )}

            {phase === "recording" && (
              <div className="flex items-center gap-6">
                <button
                  onClick={handleCancelRecording}
                  aria-label="Cancel recording"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-base font-medium transition-colors"
                  style={{ backgroundColor: 'var(--btn-regular-bg)', color: 'var(--text-secondary)' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button
                  onClick={handleStopRecording}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-lg hover:scale-105 transition-all flex items-center justify-center animate-pulse"
                  aria-label="Stop recording"
                >
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              </div>
            )}

            {phase === "processing" && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--btn-regular-bg)' }}>
                  <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--primary)' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Analyzing pronunciation...</p>
              </div>
            )}

            {phase === "no-audio" && (
              <div className="w-full text-center space-y-5">
                <div className="text-5xl">🎙️</div>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>I didn&apos;t catch that</p>
                <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                  Try speaking a bit louder or closer to the mic.
                </p>
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 rounded-xl text-white font-medium transition-colors"
                  style={{ backgroundColor: 'var(--primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
                >
                  Try again
                </button>
              </div>
            )}

            {phase === "feedback" && scoringResult && feedback && (
              <div className="w-full space-y-6">
                <PronunciationFeedback
                  wordResults={scoringResult.wordResults}
                  accuracy={scoringResult.accuracy}
                  feedback={feedback}
                  xpEarned={xpEarned}
                />
                <p className="text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Heard: &ldquo;{scoringResult.transcript}&rdquo;
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 rounded-xl font-medium transition-colors"
                    style={{ backgroundColor: 'var(--btn-regular-bg)', color: 'var(--text-primary)' }}
                  >
                    🔄 Retry
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 rounded-xl text-white font-medium transition-colors"
                    style={{ backgroundColor: 'var(--primary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
                  >
                    {currentIndex + 1 < totalWords ? "➡️ Next" : "🎉 Finish"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </PageLayout>
  );
}
