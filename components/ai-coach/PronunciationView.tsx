"use client";

import { useCallback, useEffect, useState } from "react";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { useSharedMicStream } from "@/hooks/useSharedMicStream";
import { useAuth } from "@/components/auth/AuthProvider";
import { ARPABET_TO_IPA } from "@/lib/pronunciation/phonemes";
import { scorePronunciation } from "@/lib/pronunciation/scoring";
import { feedbackFromScoringResult } from '@/lib/pronunciation/feedback/from-scoring';
import { persistPronunciationFeedbackEvidence } from '@/lib/pronunciation/feedback/persistence';
import { saveAIWord } from "@/lib/db/ai";
import { savePracticeAnswer } from "@/lib/practice/queries";
import { recordActivitySession } from "@/lib/progress/activity-hub";
import { buildSessionResult } from "@/lib/practice/session-result";
import type { PracticeAnswer } from "@/lib/practice/types";
import {
  BATCH_SIZE,
  PHONEME_TIPS,
  fetchWordIPA,
  loadMasteredFromDexie,
  loadQueueFromDexie,
  loadSeenFromDexie,
  pickBatch,
  saveMasteredToDexie,
  saveQueueToDexie,
  saveSeenToDexie,
  shuffle,
  speakPhrase,
} from "@/lib/ai-coach/pronunciation";
import PronunciationProgress from "./pronunciation/PronunciationProgress";
import PhraseCard from "./pronunciation/PhraseCard";
import RecordingControls from "./pronunciation/RecordingControls";
import CoachPanel from "./pronunciation/CoachPanel";
import type { WordIPA, SoundProgress } from "./pronunciation/types";
import type { ScoringResult } from '@/lib/types';
import SessionComplete from "./pronunciation/SessionComplete";

function canonicalFocusFromScoring(scoring: ScoringResult | null) {
  if (!scoring) return null;
  const feedback = feedbackFromScoringResult({
    accuracy: scoring.accuracy,
    transcript: scoring.transcript,
    wordResults: scoring.wordResults,
    evaluatorVersion: 'coach-stt-v1',
  });
  const expected = feedback.priority?.expected?.replace(/^\/+|\/+$/g, '');
  if (!expected) return null;

  for (const word of scoring.wordResults) {
    for (const alignment of word.phonemes?.alignment ?? []) {
      const alignedIpa = alignment.ipa ?? ARPABET_TO_IPA[alignment.phoneme];
      if (alignment.status !== 'correct' && alignedIpa === expected) {
        return {
          word: word.expected,
          phoneme: alignment.phoneme,
          ipa: alignedIpa ?? alignment.phoneme,
        };
      }
    }
  }
  return null;
}

export default function PronunciationView() {
  const { user } = useAuth();
  const userId = user?.id;
  const [queue, setQueue] = useState<string[]>([]);
  const [mastered, setMastered] = useState<Set<string>>(new Set());
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [batchCount, setBatchCount] = useState(0);
  const [fetchingPhrases, setFetchingPhrases] = useState(false);
  const [wordIPAs, setWordIPAs] = useState<WordIPA[]>([]);
  const [ipaLoading, setIpaLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [soundProgress, setSoundProgress] = useState<SoundProgress>({});
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [latestScoring, setLatestScoring] = useState<ScoringResult | null>(null);

  const { getStream } = useSharedMicStream();
  const { state, result, start, stop, reset } = useSpeechInput({ prefer: "gemini", getStream });

  const isRecording = state === "listening";
  const activePhrase = queue[0] ?? "";
  const sessionDone = queue.length === 0;

  useEffect(() => {
    let cancelled = false;

    if (!userId) return;
    void Promise.all([
      loadMasteredFromDexie(userId),
      loadQueueFromDexie(userId),
      loadSeenFromDexie(userId),
    ]).then(([storedMastered, storedQueue, storedSeen]) => {
      if (cancelled) return;
      const initialQueue = storedQueue.length > 0 ? storedQueue : pickBatch(storedMastered);
      if (storedQueue.length === 0) void saveQueueToDexie(userId, initialQueue);
      setQueue(initialQueue);
      setMastered(storedMastered);
      setSeen(storedSeen);
      setBatchCount(initialQueue.length);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loadMoreFromPool = useCallback((currentSeen: Set<string>, currentMastered: Set<string>) => {
    const exclude = new Set([...currentSeen, ...currentMastered]);
    const batch = pickBatch(exclude);
    const fallback = batch.length === 0 ? pickBatch(currentMastered) : batch;
    setQueue(fallback);
      if (userId) void saveQueueToDexie(userId, fallback);
    setBatchCount(fallback.length);
    reset();
    setWordIPAs([]);
    setLatestScoring(null);
  }, [reset, userId]);

  const fetchMoreWithAI = useCallback(async (currentSeen: Set<string>) => {
    setFetchingPhrases(true);
    try {
      const res = await fetch("/api/gemini/phrases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exclude: [...currentSeen].slice(-30), count: BATCH_SIZE }),
      });
      if (!res.ok) { loadMoreFromPool(currentSeen, mastered); return; }

      const { phrases } = await res.json() as { phrases?: string[] };
      if (!Array.isArray(phrases) || phrases.length === 0) {
        loadMoreFromPool(currentSeen, mastered);
        return;
      }

      const batch = shuffle(phrases).slice(0, BATCH_SIZE);
      setQueue(batch);
      if (userId) void saveQueueToDexie(userId, batch);
      setBatchCount(batch.length);
      reset();
      setWordIPAs([]);
    } catch {
      loadMoreFromPool(currentSeen, mastered);
    } finally {
      setFetchingPhrases(false);
    }
  }, [mastered, loadMoreFromPool, reset, userId]);

  useEffect(() => {
    if (!activePhrase) return;

    setWordIPAs([]);
    setIpaLoading(true);
    const words = activePhrase.split(/\s+/).filter(Boolean);
    const clean = (word: string) => word.replace(/[^a-zA-Z']/g, "").toLowerCase();

    void Promise.all(words.map((word) => fetchWordIPA(clean(word)))).then((ipas) => {
      setWordIPAs(words.map((word, index) => ({
        word,
        ipa: ipas[index],
        alignment: null,
      })));
      setIpaLoading(false);
    });
  }, [activePhrase]);

  const analyzeRecording = useCallback(async (transcript: string) => {
    setAnalyzing(true);
    try {
      if (!transcript || !activePhrase) return;

      // Shared sequence alignment (lib/pronunciation/scoring.ts) instead of
      // index-zipping phrase words against transcript words — an omitted
      // word no longer shifts every later word's feedback.
      const scoring = await scorePronunciation(transcript, activePhrase);
      setLatestScoring(scoring);
      if (userId) {
        const feedback = feedbackFromScoringResult({
          accuracy: scoring.accuracy, transcript: scoring.transcript, wordResults: scoring.wordResults,
          evaluatorVersion: 'coach-stt-v1',
        });
        void persistPronunciationFeedbackEvidence(userId, feedback).catch(() => undefined);
      }

      // Map results back onto the original phrase's words by matching
      // expected text (skip "extra" entries — they have no expected word).
      const byExpected = new Map(
        scoring.wordResults
          .filter((r) => r.status !== "extra")
          .map((r) => [r.expected.toLowerCase(), r] as const),
      );

      setWordIPAs((prev) => prev.map((entry) => {
        const clean = entry.word.replace(/[^a-zA-Z']/g, "").toLowerCase();
        const match = byExpected.get(clean);
        return { ...entry, alignment: match?.phonemes?.alignment ?? null };
      }));

      setSoundProgress((prev) => {
        const next = { ...prev };
        for (const result of scoring.wordResults) {
          for (const alignment of result.phonemes?.alignment ?? []) {
            const key = alignment.phoneme;
            if (!next[key]) next[key] = { correct: 0, total: 0 };
            next[key].total += 1;
            if (alignment.status === "correct") next[key].correct += 1;
          }
        }
        return next;
      });

      if (scoring.isCorrect) {
        setMastered((prev) => {
          const next = new Set(prev).add(activePhrase);
          if (userId) void saveMasteredToDexie(userId, next);
          return next;
        });
      }

      if (userId) {
        const contentId = `ai_coach:pronunciation:${activePhrase.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const answer: PracticeAnswer = {
          exerciseId: contentId,
          slug: "speak_word",
          exerciseTypeId: 10,
          isCorrect: scoring.isCorrect,
          userAnswer: transcript,
          score: scoring.accuracy,
          contentId,
          context: "ai_coach",
          timeMs: 0,
          exercisePayload: { targetWord: activePhrase },
        };
        await savePracticeAnswer(userId, answer);
        await recordActivitySession(userId, {
          practiceContext: "ai_coach",
          sessionResult: buildSessionResult([{ ...answer, completedAt: new Date() }]),
          metadata: { coachTool: "pronunciation_coach" },
        });
      }
    } finally {
      setAnalyzing(false);
    }
  }, [activePhrase, userId]);

  useEffect(() => {
    if (result?.transcript) void analyzeRecording(result.transcript);
  }, [result, analyzeRecording]);

  const advanceQueue = useCallback(() => {
    setSeen((prev) => {
      const next = new Set(prev).add(activePhrase);
      if (userId) void saveSeenToDexie(userId, next);
      return next;
    });
    setQueue((prev) => {
      const next = prev.slice(1);
      if (userId) void saveQueueToDexie(userId, next);
      return next;
    });
    reset();
    setWordIPAs([]);
  }, [activePhrase, reset, userId]);

  const handleMicClick = () => {
    if (isRecording) {
      void stop();
      return;
    }

    reset();
    setWordIPAs((prev) => prev.map((entry) => ({ ...entry, alignment: null })));
    setLatestScoring(null);
    void start();
  };

  const handleSavePractice = async (word: string) => {
    if (!userId) return;
    await saveAIWord(userId, {
      word: word.toLowerCase(),
      meaning: "",
      difficulty: "medium",
      context: activePhrase,
      conversationId: 0,
      savedAt: new Date().toISOString(),
    });
    setSavedWords((prev) => new Set(prev).add(word.toLowerCase()));
  };

  const hasAnalysis = wordIPAs.some((word) => word.alignment !== null);
  const hasMistakes = wordIPAs.some((word) => word.alignment?.some((alignment) => alignment.status !== "correct"));
  const focus = hasAnalysis && hasMistakes ? canonicalFocusFromScoring(latestScoring) : null;
  const focusTip = focus ? PHONEME_TIPS[focus.phoneme] ?? null : null;
  const focusProgress = focus ? soundProgress[focus.phoneme] ?? null : null;
  const doneInBatch = batchCount - queue.length;
  const progressPct = batchCount > 0 ? (doneInBatch / batchCount) * 100 : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PronunciationProgress current={doneInBatch} total={batchCount} mastered={mastered.size} pct={progressPct} />

      {sessionDone ? (
        <SessionComplete
          mastered={mastered.size}
          batchSize={batchCount}
          onMore={() => loadMoreFromPool(seen, mastered)}
          onMoreAI={() => fetchMoreWithAI(seen)}
          loadingMore={fetchingPhrases}
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <PhraseCard
            phrase={activePhrase}
            wordIPAs={wordIPAs}
            ipaLoading={ipaLoading}
            analyzing={analyzing}
            hasAnalysis={hasAnalysis}
            hasMistakes={hasMistakes}
            onListen={() => speakPhrase(activePhrase)}
            onSlow={() => speakPhrase(activePhrase, 0.55)}
          />

          {focus && !analyzing && (
            <div className="px-4 pb-4 shrink-0">
              <CoachPanel
                focus={focus}
                focusTip={focusTip}
                focusProgress={focusProgress}
                savedWords={savedWords}
                onListen={(word) => speakPhrase(word, 0.75)}
                onSave={handleSavePractice}
              />
            </div>
          )}
        </div>
      )}

      {!sessionDone && <RecordingControls isRecording={isRecording} onMicClick={handleMicClick} onSkip={advanceQueue} />}
    </div>
  );
}
