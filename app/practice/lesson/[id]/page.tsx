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
import type { LessonStageId, LessonStageMasteryMap } from "@/components/lesson/LessonLobby";
import type { Lesson } from "@/lib/types";

type Phase = "ready" | "recording" | "processing" | "feedback" | "no-audio" | "complete";

export default function ActiveLessonPage() {
  const params = useParams();
  const lessonId = params.id as string;
  const staticLesson = getLessonById(lessonId);
  // undefined = loading, null = not found, Lesson = found
  const isDynamic = !staticLesson && (lessonId.startsWith("pattern-") || lessonId.startsWith("sound-"));
  const [dynamicLesson, setDynamicLesson] = useState<import("@/lib/types").Lesson | null | undefined>(
    isDynamic ? undefined : null
  );

  useEffect(() => {
    if (!isDynamic) return;
    import("@/lib/lesson-generator-db").then(({ getDbLessonById }) =>
      getDbLessonById(lessonId).then(setDynamicLesson)
    );
  }, [lessonId, isDynamic]);

  const fullLesson = staticLesson ?? dynamicLesson;

  // ── Lobby / stage state ────────────────────────────────────────────────────
  // Dynamic lessons: "lobby" → stage picker; static lessons: "difficulty" → easy/hard
  const [view, setView] = useState<"lobby" | "difficulty" | "session">(
    isDynamic ? "lobby" : "difficulty"
  );
  const [activeStage, setActiveStage] = useState<LessonStageId>("guided");
  const [stageMastery, setStageMastery] = useState<LessonStageMasteryMap>(emptyLessonMastery());
  // The sliced lesson shown in the current session
  const [lessonData, setLessonData] = useState<Lesson | null | undefined>(
    isDynamic ? undefined : undefined  // wait for difficulty pick
  );
  const [sessionOffset, setSessionOffset] = useState(0);

  // When full lesson resolves, either wait for lobby (dynamic) or difficulty pick (static)
  useEffect(() => {
    if (!fullLesson) return;
    if (isDynamic) {
      getLessonOffset(lessonId).then((offset) => {
        setSessionOffset(offset);
        // Don't set lessonData yet — user picks stage first from the lobby
      });
    }
    // Static: stay on difficulty picker — lessonData set when user picks
  }, [fullLesson, isDynamic, lessonId]);

  function handleSelectDifficulty(difficulty: "easy" | "hard") {
    if (!fullLesson) return;
    setScoringThreshold(difficulty === "hard" ? 85 : 65);
    setLessonData({ ...fullLesson });
    setView("session");
  }

  function handleSelectStage(stageId: LessonStageId) {
    if (!fullLesson) return;
    import("@/lib/lesson-generator-db").then(({ sliceLessonWords }) => {
      const sliced = sliceLessonWords(fullLesson, sessionOffset, LESSON_SESSION_SIZE);
      // Apply stage modifiers
      const stageWords = sliced.words.map((w) => ({
        ...w,
        ipa: stageId === "pronunciation" || stageId === "speed" ? "" : w.ipa,
        hint: stageId === "speed" ? undefined : w.hint,
        audioUrl: stageId === "speed" ? undefined : w.audioUrl,
      }));
      setScoringThreshold(stageId === "speed" ? 85 : stageId === "pronunciation" ? 75 : 65);
      setLessonData({ ...sliced, words: stageWords });
      setActiveStage(stageId);
      setView("session");
    });
  }

  async function handleBackToLobby() {
    setView(isDynamic ? "lobby" : "difficulty");
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

  // Keep refs so async callbacks always see the latest values
  const currentWordRef = useRef(currentWord);
  useEffect(() => { currentWordRef.current = currentWord; }, [currentWord]);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  const lessonIdRef = useRef(lessonId);
  const scoringThresholdRef = useRef(scoringThreshold);
  useEffect(() => { scoringThresholdRef.current = scoringThreshold; }, [scoringThreshold]);
  const geminiInFlightRef = useRef(false);

  // Shared scoring logic
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

  // When audioUrl is set and phase is "processing", transcribe with Gemini directly
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
      .then((data) => {
        const transcript = String(data.transcript ?? "").trim();
        return processSpeechResult(transcript);
      })
      .catch((err) => {
        console.warn("[STT/Gemini] failed:", err);
        return processSpeechResult("");
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        geminiInFlightRef.current = false;
      });
  }, [audioUrl, phase, processSpeechResult]);

  // Fetch audio + favorite state when the current word changes
  useEffect(() => {
    if (!currentWord) return;
    setWordAudioUrl(currentWord.audioUrl ?? null);
    setIsFav(false);

    // Fetch audio from dictionary API if not in lesson data
    if (!currentWord.audioUrl) {
      fetchPronunciation(currentWord.word)
        .then((data) => { if (data.audioUrl) setWordAudioUrl(data.audioUrl); })
        .catch(() => {/* no audio available */});
    }

    // Load favorite state
    isFavorite(currentWord.word).then(setIsFav);
  }, [currentWord]);

  const handleToggleFavorite = useCallback(async () => {
    if (!currentWord) return;
    const nowFav = await toggleFavorite(currentWord.word, lessonIdRef.current, currentWord.ipa);
    setIsFav(nowFav);
  }, [currentWord]);

  // Initialize (or re-initialize) lesson when lessonData changes
  useEffect(() => {
    if (!lessonData) return;
    resetLesson();
    startLesson(lessonData);
    setPhase("ready");
  }, [lessonData]);

  // Warm phoneme dictionary/cache in background to reduce scoring latency.
  useEffect(() => {
    if (!lessonData) return;
    import("@/lib/phonemes")
      .then(({ warmupPhonemeEngine }) => warmupPhonemeEngine(lessonData.words.map((w) => w.word)))
      .catch(() => {
        // Non-critical: scoring still works without warmup.
      });
  }, [lessonData]);

  // ── Handlers ──────────────────────────────────────────────────────────────

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
      // Advance word chunk offset for next session (dynamic lessons only)
      if (isDynamic && fullLesson && fullLesson.words.length > LESSON_SESSION_SIZE) {
        advanceLessonOffset(lessonId, fullLesson.words.length).then(setSessionOffset);
      }
      // Update stage mastery with session accuracy
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
    // totalWords decreases by 1 after markKnown — check against updated count
    const isLast = currentIndex >= totalWords - 1;
    if (isLast) setPhase("complete");
    else setPhase("ready");
  }, [currentWord, currentIndex, totalWords, markKnown, resetScoring, resetRecording]);

  // ── Render ────────────────────────────────────────────────────────────────

  // Loading full lesson from DB
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

  // Difficulty picker for static lessons
  if (view === "difficulty" && fullLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="w-full max-w-sm space-y-4">
          <Link
            href="/practice"
            className="text-sm transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            ← Back
          </Link>

          <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--line-divider)' }}>
            <h1 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{fullLesson.title}</h1>
            <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>{fullLesson.words.length} words</p>

            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>Choose difficulty</p>

            <div className="space-y-3">
              <button
                onClick={() => handleSelectDifficulty("easy")}
                className="w-full text-left rounded-xl border px-4 py-4 flex items-center gap-4 transition-colors"
                style={{ backgroundColor: 'var(--btn-regular-bg)', borderColor: 'var(--admonitions-color-tip)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--admonitions-color-tip) 10%, transparent)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg)')}
              >
                <span className="text-2xl">🎧</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Chill</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Pass at 65% · IPA shown · ×1 XP</div>
                </div>
              </button>

              <button
                onClick={() => handleSelectDifficulty("hard")}
                className="w-full text-left rounded-xl border px-4 py-4 flex items-center gap-4 transition-colors"
                style={{ backgroundColor: 'var(--btn-regular-bg)', borderColor: 'var(--admonitions-color-caution)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--admonitions-color-caution) 10%, transparent)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg)')}
              >
                <span className="text-2xl">🎯</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Master</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Pass at 85% · IPA shown · ×1.5 XP</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lobby view for dynamic lessons
  if (view === "lobby" && fullLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="w-full max-w-md space-y-4">
          <Link
            href="/practice"
            className="text-sm transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            ← Back
          </Link>
          <LessonLobby
            lesson={fullLesson}
            totalWords={fullLesson.words.length}
            sessionChunk={sessionChunk}
            totalChunks={totalChunks}
            mastery={stageMastery}
            onSelectStage={handleSelectStage}
          />
        </div>
      </div>
    );
  }

  // Session loading (after stage selected, slicing words)
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Lesson not found</h1>
          <Link href="/practice" className="" style={{color: 'var(--primary)'}} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--btn-regular-bg-hover)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--primary)')}>← Back to practice</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={handleBackToLobby} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{lessonData.title}</h1>
              <p className="text-xs text-gray-500">
                {phase !== "complete" ? `${currentIndex + 1} / ${totalWords}` : "Complete"}
              </p>
            </div>
            <div className="w-9" />
          </div>
          {phase !== "complete" && (
            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ backgroundColor: 'var(--primary)', width: `${((currentIndex + (phase === "feedback" ? 1 : 0)) / totalWords) * 100}%` }}
              />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Complete */}
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
              <Link href="/practice" className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                ← All Lessons
              </Link>
            </div>
          </div>
        )}

        {/* Active Word */}
        {phase !== "complete" && currentWord && (
          <div className="flex flex-col items-center space-y-8">
            {/* Target */}
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{currentWord.word}</h2>
              <p className="text-lg font-mono" style={{color: 'var(--primary)'}}>{currentWord.ipa}</p>
              {currentWord.hint && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic max-w-md">💡 {currentWord.hint}</p>
              )}
            </div>

            {/* Reference audio + favorite buttons */}
            <div className="flex items-center gap-2">
              {wordAudioUrl && (
                <button
                  onClick={() => new Audio(wordAudioUrl).play()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:opacity-90 transition-colors"
                  style={{
                    backgroundColor: 'var(--primary)',
                  }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Listen
                </button>
              )}
              <button
                onClick={handleToggleFavorite}
                aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isFav ? (
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Waveform */}
            <div className="w-full max-w-md">
              <AudioWaveform isRecording={isRecording} stream={stream} />
            </div>

            {/* Record button + skip/known actions */}
            {phase === "ready" && (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleStartRecording}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 transition-all flex items-center justify-center"
                  aria-label="Start recording"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleSkip}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-tertiary)', backgroundColor: 'var(--btn-regular-bg)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >
                    Skip →
                  </button>
                  <button
                    onClick={handleMarkKnown}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-tertiary)', backgroundColor: 'var(--btn-regular-bg)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >
                    I know this ✓
                  </button>
                </div>
              </div>
            )}

            {/* Stop / Cancel buttons */}
            {phase === "recording" && (
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCancelRecording}
                  aria-label="Cancel recording"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar
                </button>
                <button
                  onClick={handleStopRecording}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-lg hover:scale-105 transition-all flex items-center justify-center animate-pulse"
                  aria-label="Stop recording"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              </div>
            )}

            {/* Processing */}
            {phase === "processing" && (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{backgroundColor: 'var(--btn-regular-bg)'}}>
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" style={{color: 'var(--primary)'}}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing pronunciation...</p>
              </div>
            )}

            {/* No audio detected */}
            {phase === "no-audio" && (
              <div className="w-full max-w-md text-center space-y-4">
                <div className="text-4xl">🎙️</div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  I didn&apos;t catch that
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Try speaking a bit louder or closer to the mic.
                </p>
                <button
                  onClick={handleRetry}
                  className="px-5 py-2.5 rounded-xl text-white font-medium transition-colors"
                  style={{ backgroundColor: 'var(--primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
                >
                  Try again
                </button>
              </div>
            )}

            {/* Feedback */}
            {phase === "feedback" && scoringResult && feedback && (
              <div className="w-full max-w-md space-y-6">
                <PronunciationFeedback
                  wordResults={scoringResult.wordResults}
                  accuracy={scoringResult.accuracy}
                  feedback={feedback}
                  xpEarned={xpEarned}
                />
                <p className="text-center text-xs text-gray-400">
                  Heard: &ldquo;{scoringResult.transcript}&rdquo;
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleRetry}
                    className="px-5 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    🔄 Retry
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 rounded-xl text-white font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--primary)',
                    }}
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
    </div>
  );
}
