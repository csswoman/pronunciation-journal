"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getLessonById } from "@/lib/lesson-generator";
import { audioToFloat32, dataURLToBlob } from "@/lib/audio-utils";
import { useWhisper } from "@/hooks/useWhisper";
import { useWebSpeech } from "@/hooks/useWebSpeech";
import { useScoring } from "@/hooks/useScoring";
import { useLesson } from "@/hooks/useLesson";
import { useRecorder } from "@/hooks/useRecorder";
import { calculateXP } from "@/lib/scoring";
import { fetchPronunciation } from "@/lib/dictionary";
import { isFavorite, toggleFavorite } from "@/lib/db";
import PronunciationFeedback from "@/components/lesson/PronunciationFeedback";
import AudioWaveform from "@/components/lesson/AudioWaveform";
import ScoreDisplay from "@/components/lesson/ScoreDisplay";

type Phase = "ready" | "recording" | "processing" | "feedback" | "complete";

export default function ActiveLessonPage() {
  const params = useParams();
  const lessonId = params.id as string;
  const lessonData = getLessonById(lessonId);

  const [phase, setPhase] = useState<Phase>("ready");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [wordAudioUrl, setWordAudioUrl] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  const {
    lesson,
    currentWord,
    currentIndex,
    totalWords,
    wordAttempts,
    sessionAccuracy,
    totalXP,
    startLesson,
    addResult,
    nextWord,
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

  // First engine to deliver a result wins
  const resultDeliveredRef = useRef(false);

  // Shared scoring logic
  const processSpeechResult = useCallback(async (text: string) => {
    const word = currentWordRef.current;
    if (!word) return;
    try {
      const result = await scoreAndSave(text, word.word, lessonIdRef.current);
      console.log(`[Scoring] Accuracy: ${result.accuracy}%, Correct: ${result.isCorrect}`);
      addResult(result, calculateXP(result.accuracy), word.word);
      setPhase("feedback");
    } catch (err) {
      console.error("Scoring error:", err);
      setPhase("ready");
    }
  }, [addResult, scoreAndSave]);

  // Web Speech: skip empty results (Whisper will handle them as fallback)
  const handleWebSpeechResult = useCallback(async (text: string) => {
    if (phaseRef.current !== "processing") return;
    if (resultDeliveredRef.current) return;
    if (!text.trim()) return; // empty → wait for Whisper
    resultDeliveredRef.current = true;
    console.log(`[STT/WebSpeech] Result: "${text}"`);
    await processSpeechResult(text);
  }, [processSpeechResult]);

  // Whisper: always proceed — it's the final fallback, empty = 0% score
  const handleWhisperResult = useCallback(async (text: string) => {
    if (phaseRef.current !== "processing") return;
    if (resultDeliveredRef.current) return;
    resultDeliveredRef.current = true;
    console.log(`[STT/Whisper] Result: "${text}"`);
    await processSpeechResult(text);
  }, [processSpeechResult]);

  const { isModelLoaded, isModelLoading, loadProgress, loadModel, transcribe, reset: resetWhisper } = useWhisper({
    onResult: handleWhisperResult,
  });

  const { isSupported: isWebSpeechSupported, startListening, stopListening } = useWebSpeech({
    onResult: handleWebSpeechResult,
  });

  const { isRecording, audioUrl, startRecording, stopRecording, resetRecording } = useRecorder();

  // Track the last processed audioUrl so we don't process the same blob twice
  const lastProcessedUrl = useRef<string | null>(null);

  // When a new audioUrl is set AND phase is "processing", run Whisper as fallback
  useEffect(() => {
    if (phase !== "processing") return;
    if (!audioUrl) return;
    if (!isModelLoaded) return;
    if (audioUrl === lastProcessedUrl.current) return;
    if (resultDeliveredRef.current) return; // Web Speech already handled this

    lastProcessedUrl.current = audioUrl;

    const runPipeline = async () => {
      if (resultDeliveredRef.current) return; // double-check after async gap
      try {
        const blob = dataURLToBlob(audioUrl);
        const float32 = await audioToFloat32(blob);
        transcribe(float32);
      } catch (err) {
        console.error("Audio conversion error:", err);
        setPhase("ready");
      }
    };

    runPipeline();
  }, [audioUrl, phase, isModelLoaded, transcribe]);

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

  // Initialize lesson and load model
  useEffect(() => {
    if (lessonData && !lesson) startLesson(lessonData);
  }, [lessonData, lesson, startLesson]);

  useEffect(() => {
    if (!isModelLoaded && !isModelLoading) loadModel();
  }, [isModelLoaded, isModelLoading, loadModel]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStartRecording = useCallback(async () => {
    resetWhisper();
    resetScoring();
    resetRecording();
    resultDeliveredRef.current = false;
    lastProcessedUrl.current = null;

    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setStream(ms);
      await startRecording();
      if (isWebSpeechSupported) startListening();
      setPhase("recording");
    } catch (err) {
      console.error("Mic error:", err);
    }
  }, [resetWhisper, resetScoring, resetRecording, startRecording, isWebSpeechSupported, startListening]);

  const handleStopRecording = useCallback(() => {
    if (isWebSpeechSupported) stopListening();
    stopRecording();
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setPhase("processing");
  }, [stopRecording, stream, isWebSpeechSupported, stopListening]);

  const handleCancelRecording = useCallback(() => {
    if (isWebSpeechSupported) stopListening();
    stopRecording();
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    resetWhisper();
    resetRecording();
    resultDeliveredRef.current = false;
    lastProcessedUrl.current = null;
    setPhase("ready");
  }, [stopRecording, stream, isWebSpeechSupported, stopListening, resetWhisper, resetRecording]);

  const handleNext = useCallback(() => {
    resetWhisper();
    resetScoring();
    resetRecording();
    resultDeliveredRef.current = false;
    lastProcessedUrl.current = null;
    const isLast = currentIndex + 1 >= totalWords;
    if (isLast) {
      setPhase("complete");
    } else {
      nextWord();
      setPhase("ready");
    }
  }, [nextWord, resetWhisper, resetScoring, resetRecording, currentIndex, totalWords]);

  const handleRetry = useCallback(() => {
    resetWhisper();
    resetScoring();
    resetRecording();
    resultDeliveredRef.current = false;
    lastProcessedUrl.current = null;
    retryWord();
    setPhase("ready");
  }, [retryWord, resetWhisper, resetScoring, resetRecording]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (!lessonData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Lesson not found</h1>
          <Link href="/lesson" className="" style={{color: 'var(--primary)'}} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--btn-regular-bg-hover)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--primary)')}>← Back to lessons</Link>
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
            <Link href="/lesson" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
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
        {/* Whisper loading — small banner, doesn't block recording */}
        {!isModelLoaded && (
          <div className="flex items-center justify-center gap-2 mb-4 text-xs text-gray-400 dark:text-gray-500">
            <svg className="w-3 h-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading AI fallback… {loadProgress}%</span>
          </div>
        )}

        {/* Complete */}
        {phase === "complete" && (
          <div className="space-y-6">
            <ScoreDisplay wordAttempts={wordAttempts} sessionAccuracy={sessionAccuracy} totalXP={totalXP} totalWords={totalWords} />
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { resetLesson(); startLesson(lessonData); setPhase("ready"); }}
                className="px-6 py-3 rounded-xl text-white font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--primary)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
              >
                🔄 Retry Lesson
              </button>
              <Link href="/lesson" className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
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

            {/* Record button */}
            {phase === "ready" && (
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
                  {scoringResult.transcript.length > 0 
                    ? `Heard: "${scoringResult.transcript}"`
                    : "I didn't hear anything. Try speaking louder or closer to the mic."}
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
