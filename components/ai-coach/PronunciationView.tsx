"use client";

import { useCallback, useEffect, useState } from "react";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { useSharedMicStream } from "@/hooks/useSharedMicStream";
import { useAuth } from "@/components/auth/AuthProvider";
import { analyzePhonemes, ARPABET_TO_IPA } from "@/lib/pronunciation/phonemes";
import { saveAIWord } from "@/lib/db/ai";
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
import SessionComplete from "./pronunciation/SessionComplete";

function firstBadPhoneme(wordIPAs: WordIPA[]) {
  for (const entry of wordIPAs) {
    if (!entry.alignment) continue;
    for (const alignment of entry.alignment) {
      if (alignment.status !== "correct" && alignment.phoneme) {
        return {
          word: entry.word,
          phoneme: alignment.phoneme,
          ipa: alignment.ipa ?? ARPABET_TO_IPA[alignment.phoneme] ?? alignment.phoneme,
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
      if (!transcript) return;
      const phraseWords = activePhrase.split(/\s+/).filter(Boolean);
      const transcriptWords = transcript.trim().split(/\s+/).filter(Boolean);
      const results = await Promise.all(
        phraseWords.map((word, index) => analyzePhonemes(word, transcriptWords[index] ?? "")),
      );

      setWordIPAs((prev) => prev.map((entry, index) => ({
        ...entry,
        alignment: results[index]?.alignment ?? null,
      })));

      setSoundProgress((prev) => {
        const next = { ...prev };
        for (const result of results) {
          for (const alignment of result.alignment) {
            const key = alignment.phoneme;
            if (!next[key]) next[key] = { correct: 0, total: 0 };
            next[key].total += 1;
            if (alignment.status === "correct") next[key].correct += 1;
          }
        }
        return next;
      });

      if (results.every((item) => item.alignment.every((alignment) => alignment.status === "correct")) && activePhrase) {
        setMastered((prev) => {
          const next = new Set(prev).add(activePhrase);
          if (userId) void saveMasteredToDexie(userId, next);
          return next;
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
  const focus = hasAnalysis && hasMistakes ? firstBadPhoneme(wordIPAs) : null;
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
