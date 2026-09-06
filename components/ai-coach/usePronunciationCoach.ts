"use client";

import { useCallback, useEffect, useState } from "react";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { useSharedMicStream } from "@/hooks/useSharedMicStream";
import { useAuth } from "@/components/auth/AuthProvider";
import { persistSaveable } from "@/lib/ai-coach/saveables/persist";
import {
  PHONEME_TIPS,
  fetchWordIPA,
  getStaticWordIPA,
  loadMasteredFromDexie,
  loadQueueFromDexie,
  loadSeenFromDexie,
  pickBatch,
  saveQueueToDexie,
  saveSeenToDexie,
  speakPhrase,
} from "@/lib/ai-coach/pronunciation";
import type { WordIPA, SoundProgress } from "@/components/ai-coach/pronunciation/types";
import type { ScoringResult } from "@/lib/types";
import { canonicalFocusFromScoring } from "@/components/ai-coach/pronunciation/canonical-focus";
import { analyzePronunciationRecording } from "@/components/ai-coach/pronunciation-coach-analyze";
import {
  fetchMoreWithAI as fetchMoreWithAIHelper,
  loadMoreFromPool as loadMoreFromPoolHelper,
} from "@/components/ai-coach/pronunciation-coach-queue";

export function usePronunciationCoach() {
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

  const loadMoreFromPool = useCallback(
    (currentSeen: Set<string>, currentMastered: Set<string>) => {
      loadMoreFromPoolHelper(currentSeen, currentMastered, {
        setQueue,
        setBatchCount,
        setWordIPAs,
        setLatestScoring,
        setFetchingPhrases,
        reset,
        userId,
      });
    },
    [reset, userId],
  );

  const fetchMoreWithAI = useCallback(
    async (currentSeen: Set<string>) => {
      await fetchMoreWithAIHelper(currentSeen, mastered, {
        setQueue,
        setBatchCount,
        setWordIPAs,
        setLatestScoring,
        setFetchingPhrases,
        reset,
        userId,
      });
    },
    [mastered, reset, userId],
  );

  useEffect(() => {
    if (!activePhrase) return;

    const words = activePhrase.split(/\s+/).filter(Boolean);
    const clean = (word: string) => word.replace(/[^a-zA-Z']/g, "").toLowerCase();

    const initialWordIPAs: WordIPA[] = [];
    const missingIndices: number[] = [];

    words.forEach((word, index) => {
      const staticIpa = getStaticWordIPA(word);
      initialWordIPAs.push({
        word,
        ipa: staticIpa,
        alignment: null,
      });
      if (!staticIpa) {
        missingIndices.push(index);
      }
    });

    setWordIPAs(initialWordIPAs);

    if (missingIndices.length === 0) {
      setIpaLoading(false);
      return;
    }

    setIpaLoading(true);
    void Promise.all(
      missingIndices.map((index) => fetchWordIPA(clean(words[index]))),
    ).then((fetchedIpas) => {
      setWordIPAs((prev) => {
        if (prev.length !== words.length) return prev;
        const next = [...prev];
        missingIndices.forEach((wordIdx, i) => {
          if (fetchedIpas[i]) {
            next[wordIdx] = { ...next[wordIdx], ipa: fetchedIpas[i] };
          }
        });
        return next;
      });
      setIpaLoading(false);
    });
  }, [activePhrase]);

  const analyzeRecording = useCallback(
    async (transcript: string) => {
      setAnalyzing(true);
      try {
        await analyzePronunciationRecording({
          transcript,
          activePhrase,
          userId,
          setLatestScoring,
          setWordIPAs,
          setSoundProgress,
          setMastered,
        });
      } finally {
        setAnalyzing(false);
      }
    },
    [activePhrase, userId],
  );

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
    // CoachPanel calls this fire-and-forget, so a rejection here would surface
    // as an unhandled promise. Only mark the word saved when the write lands.
    try {
      await persistSaveable(userId, {
        type: "word",
        text: word.toLowerCase(),
        meaning: "",
        ...(activePhrase ? { example: activePhrase } : {}),
      });
      setSavedWords((prev) => new Set(prev).add(word.toLowerCase()));
    } catch (err) {
      console.error("[usePronunciationCoach] save failed", err);
    }
  };

  const hasAnalysis = wordIPAs.some((word) => word.alignment !== null);
  const hasMistakes = wordIPAs.some((word) =>
    word.alignment?.some((alignment) => alignment.status !== "correct"),
  );
  const focus = hasAnalysis && hasMistakes ? canonicalFocusFromScoring(latestScoring) : null;
  const focusTip = focus ? (PHONEME_TIPS[focus.phoneme] ?? null) : null;
  const focusProgress = focus ? (soundProgress[focus.phoneme] ?? null) : null;
  const doneInBatch = batchCount - queue.length;
  const progressPct = batchCount > 0 ? (doneInBatch / batchCount) * 100 : 0;

  return {
    activePhrase,
    analyzing,
    batchCount,
    doneInBatch,
    fetchingPhrases,
    focus,
    focusProgress,
    focusTip,
    handleMicClick,
    handleSavePractice,
    hasAnalysis,
    hasMistakes,
    ipaLoading,
    isRecording,
    loadMoreFromPool: () => loadMoreFromPool(seen, mastered),
    fetchMoreWithAI: () => fetchMoreWithAI(seen),
    masteredCount: mastered.size,
    progressPct,
    savedWords,
    sessionDone,
    speakPhrase,
    advanceQueue,
    wordIPAs,
  };
}
