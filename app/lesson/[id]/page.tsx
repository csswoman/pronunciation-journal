"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getLessonById } from "@/lib/lesson-generator";
import { audioToFloat32, dataURLToBlob } from "@/lib/audio-utils";
import { useWhisper } from "@/hooks/useWhisper";
import { useScoring } from "@/hooks/useScoring";
import { useLesson } from "@/hooks/useLesson";
import { useRecorder } from "@/hooks/useRecorder";
import { calculateXP } from "@/lib/scoring";
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

  const {
    lesson,
    currentWord,
    currentIndex,
    totalWords,
    results,
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

  // Wire useWhisper with an onResult callback — no state chain!
  const { isModelLoaded, isModelLoading, loadProgress, loadModel, transcribe, reset: resetWhisper } = useWhisper({
    onResult: useCallback(async (text: string) => {
      console.log(`[Transcription] Result: "${text}"`);
      const word = currentWordRef.current;
      if (!word) return;

      try {
        const result = await scoreAndSave(text, word.word, lessonIdRef.current);
        console.log(`[Scoring] Accuracy: ${result.accuracy}%, Correct: ${result.isCorrect}`);
        const xp = calculateXP(result.accuracy);
        addResult(result, xp);
        setPhase("feedback");
      } catch (err) {
        console.error("Scoring error:", err);
        setPhase("ready");
      }
    }, [addResult, scoreAndSave]),
  });

  const { isRecording, audioUrl, startRecording, stopRecording, resetRecording } = useRecorder();

  // Track the last processed audioUrl so we don't process the same blob twice
  const lastProcessedUrl = useRef<string | null>(null);

  // When a new audioUrl is set AND phase is "processing", start the pipeline
  useEffect(() => {
    if (phase !== "processing") return;
    if (!audioUrl) return;
    if (!isModelLoaded) return;
    if (audioUrl === lastProcessedUrl.current) return; // already handled

    lastProcessedUrl.current = audioUrl;

    const runPipeline = async () => {
      try {
        const blob = dataURLToBlob(audioUrl);
        const float32 = await audioToFloat32(blob);
        transcribe(float32); // result delivered via onResult callback above
      } catch (err) {
        console.error("Audio conversion error:", err);
        setPhase("ready");
      }
    };

    runPipeline();
  }, [audioUrl, phase, isModelLoaded, transcribe]);

  // Initialize lesson and load model
  useEffect(() => {
    if (lessonData && !lesson) startLesson(lessonData);
  }, [lessonData, lesson, startLesson]);

  useEffect(() => {
    if (!isModelLoaded && !isModelLoading) loadModel();
  }, [isModelLoaded, isModelLoading, loadModel]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStartRecording = useCallback(async () => {
    if (!isModelLoaded) return;
    resetWhisper();
    resetScoring();
    resetRecording();
    lastProcessedUrl.current = null;

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
  }, [isModelLoaded, resetWhisper, resetScoring, resetRecording, startRecording]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setPhase("processing");
  }, [stopRecording, stream]);

  const handleNext = useCallback(() => {
    resetWhisper();
    resetScoring();
    resetRecording();
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
          <Link href="/lesson" className="text-indigo-600 hover:text-indigo-700">← Back to lessons</Link>
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
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentIndex + (phase === "feedback" ? 1 : 0)) / totalWords) * 100}%` }}
              />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Model loading */}
        {!isModelLoaded && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading AI Model...</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This happens once and is cached (~75MB)</p>
            <div className="w-64 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${loadProgress}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">{loadProgress}%</p>
          </div>
        )}

        {/* Complete */}
        {isModelLoaded && phase === "complete" && (
          <div className="space-y-6">
            <ScoreDisplay results={results} sessionAccuracy={sessionAccuracy} totalXP={totalXP} totalWords={totalWords} />
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { resetLesson(); startLesson(lessonData); setPhase("ready"); }}
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
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
        {isModelLoaded && phase !== "complete" && currentWord && (
          <div className="flex flex-col items-center space-y-8">
            {/* Target */}
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{currentWord.word}</h2>
              <p className="text-lg text-indigo-600 dark:text-indigo-400 font-mono">{currentWord.ipa}</p>
              {currentWord.hint && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic max-w-md">💡 {currentWord.hint}</p>
              )}
            </div>

            {/* Reference audio button */}
            {currentWord.audioUrl && (
              <button
                onClick={() => new Audio(currentWord.audioUrl).play()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                Listen
              </button>
            )}

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

            {/* Stop button */}
            {phase === "recording" && (
              <button
                onClick={handleStopRecording}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-lg hover:scale-105 transition-all flex items-center justify-center animate-pulse"
                aria-label="Stop recording"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            )}

            {/* Processing */}
            {phase === "processing" && (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
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
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
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
