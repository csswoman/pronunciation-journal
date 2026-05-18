"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { useRecorder } from "@/hooks/useRecorder";
import { analyzePhonemes, ARPABET_TO_IPA } from "@/lib/phonemes";
import { saveAIWord } from "@/lib/ai-db";
import { pickUSPhonetic, stripIPASlashes } from "@/lib/ai-practice/modes/pronunciation";
import PronunciationProgress from "./pronunciation/PronunciationProgress";
import PhraseCard from "./pronunciation/PhraseCard";
import RecordingControls from "./pronunciation/RecordingControls";
import CoachPanel from "./pronunciation/CoachPanel";
import type { WordIPA, SoundProgress } from "./pronunciation/types";

// ---------------------------------------------------------------------------
// Phrase pool
// ---------------------------------------------------------------------------

const DEFAULT_PHRASES = [
  "I would appreciate the opportunity",
  "Could you please repeat that?",
  "I'm looking forward to working with you",
  "That sounds like a great idea",
  "I completely understand your point",
  "Would you mind helping me with this?",
  "Let me think about that for a moment",
  "I really enjoyed our conversation today",
  "The weather has been wonderful lately",
  "She works really hard every single day",
  "They were thrilled with the results",
  "We should probably leave a little earlier",
  "I thought the presentation went really well",
  "He finally finished the project last Thursday",
  "This is exactly what I was looking for",
  "I appreciate you taking the time to explain",
  "Would you rather meet in the morning?",
  "The third Thursday of the month works for me",
  "I've been practicing every day this week",
  "Nothing worthwhile ever comes without effort",
];

const BATCH_SIZE = 5;

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

const LS_QUEUE    = "pronunciation_queue";
const LS_MASTERED = "pronunciation_mastered";
const LS_SEEN     = "pronunciation_seen";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadQueue(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_QUEUE) ?? "[]"); } catch { return []; }
}
function saveQueue(q: string[]) { localStorage.setItem(LS_QUEUE, JSON.stringify(q)); }
function loadMastered(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_MASTERED) ?? "[]")); } catch { return new Set(); }
}
function saveMastered(s: Set<string>) { localStorage.setItem(LS_MASTERED, JSON.stringify([...s])); }
function loadSeen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_SEEN) ?? "[]")); } catch { return new Set(); }
}
function saveSeen(s: Set<string>) { localStorage.setItem(LS_SEEN, JSON.stringify([...s])); }

function pickBatch(exclude: Set<string>): string[] {
  const pool = shuffle(DEFAULT_PHRASES.filter(p => !exclude.has(p)));
  return pool.slice(0, BATCH_SIZE);
}

function initQueue(): string[] {
  const stored = loadQueue();
  if (stored.length > 0) return stored;
  const mastered = loadMastered();
  const batch = pickBatch(mastered);
  saveQueue(batch);
  return batch;
}

// ---------------------------------------------------------------------------
// Phoneme tips
// ---------------------------------------------------------------------------

const PHONEME_TIPS: Record<string, string> = {
  DH: "Vibrate your tongue lightly between your teeth — it should buzz.",
  TH: "Touch the tip of your tongue to the back of your upper teeth. No buzzing.",
  R:  "Curl your tongue back slightly, don't touch the roof of your mouth.",
  W:  "Round your lips before you start. Like blowing out a candle.",
  V:  "Your top teeth lightly touch your bottom lip. Make it vibrate.",
  F:  "Same as V but no vibration — just air through the teeth and lip.",
  NG: "Let the sound finish in the back of your throat. No hard 'g'.",
  SH: "Push your lips forward, tongue up behind your teeth. Shhhh.",
  ZH: "Like SH but with your voice on — like the 's' in 'measure'.",
  AE: "Open your mouth wide and spread your lips. Like the 'a' in 'cat'.",
  IY: "Stretch your lips into a smile. The vowel is long and tense.",
  UW: "Round your lips tightly. The vowel is long and pushed forward.",
  ER: "Curl your tongue slightly back as you say it — the American 'r' vowel.",
  AH: "Relax your jaw fully. Short, open, like a sigh.",
  AO: "Round your lips slightly. Longer and more open than 'AH'.",
};

// ---------------------------------------------------------------------------
// IPA fetch
// ---------------------------------------------------------------------------

async function fetchWordIPA(word: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data[0]) return null;
    const phonetics = (data[0] as { phonetics?: Array<{ text?: string; audio?: string }> }).phonetics ?? [];
    const raw = pickUSPhonetic(phonetics);
    return raw ? stripIPASlashes(raw) : null;
  } catch { return null; }
}

function firstBadPhoneme(wordIPAs: WordIPA[]) {
  for (const entry of wordIPAs) {
    if (!entry.alignment) continue;
    for (const a of entry.alignment) {
      if (a.status !== "correct" && a.phoneme) {
        return {
          word: entry.word,
          phoneme: a.phoneme,
          ipa: a.ipa ?? ARPABET_TO_IPA[a.phoneme] ?? a.phoneme,
        };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Session complete screen
// ---------------------------------------------------------------------------

function SessionComplete({
  mastered,
  batchSize,
  onMore,
  onMoreAI,
  loadingMore,
}: {
  mastered: number;
  batchSize: number;
  onMore: () => void;
  onMoreAI: () => void;
  loadingMore: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "color-mix(in oklch, var(--score-excellent) 15%, transparent)" }}
      >
        <RotateCcw size={20} style={{ color: "var(--score-excellent)" }} />
      </div>
      <div>
        <p className="text-base font-semibold mb-1" style={{ color: "var(--fg)" }}>
          Session complete
        </p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {batchSize} phrases done · {mastered} mastered total
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-[220px]">
        <button
          onClick={onMoreAI}
          disabled={loadingMore}
          className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-medium transition-colors cursor-pointer border-none disabled:opacity-60"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          {loadingMore
            ? <><Sparkles size={13} className="animate-pulse" /> Generating…</>
            : <><Sparkles size={13} /> 5 more with AI</>
          }
        </button>
        <button
          onClick={onMore}
          disabled={loadingMore}
          className="flex items-center justify-center w-full rounded-xl py-2.5 text-sm font-medium transition-colors cursor-pointer border-none disabled:opacity-60"
          style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-secondary)" }}
        >
          5 more phrases
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PronunciationView() {
  const [queue, setQueue]       = useState<string[]>([]);
  const [mastered, setMastered] = useState<Set<string>>(new Set());
  const [seen, setSeen]         = useState<Set<string>>(new Set());
  const [batchCount, setBatchCount] = useState(0);
  const [fetchingPhrases, setFetchingPhrases] = useState(false);

  const { startRecording, stopRecording, audioUrl, isRecording, resetRecording } = useRecorder();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const q = initQueue();
    setQueue(q);
    setMastered(loadMastered());
    setSeen(loadSeen());
    setBatchCount(q.length);
  }, []);

  const activePhrase = queue[0] ?? "";
  const sessionDone  = queue.length === 0;

  const [wordIPAs, setWordIPAs]           = useState<WordIPA[]>([]);
  const [ipaLoading, setIpaLoading]       = useState(false);
  const [analyzing, setAnalyzing]         = useState(false);
  const [soundProgress, setSoundProgress] = useState<SoundProgress>({});
  const [savedWords, setSavedWords]       = useState<Set<string>>(new Set());

  const loadMoreFromPool = useCallback((currentSeen: Set<string>, currentMastered: Set<string>) => {
    const exclude = new Set([...currentSeen, ...currentMastered]);
    const batch = pickBatch(exclude);
    const fallback = batch.length === 0 ? pickBatch(currentMastered) : batch;
    setQueue(fallback);
    saveQueue(fallback);
    setBatchCount(fallback.length);
    resetRecording();
    setWordIPAs([]);
  }, [resetRecording]);

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
      if (!Array.isArray(phrases) || phrases.length === 0) { loadMoreFromPool(currentSeen, mastered); return; }
      const batch = shuffle(phrases).slice(0, BATCH_SIZE);
      setQueue(batch);
      saveQueue(batch);
      setBatchCount(batch.length);
      resetRecording();
      setWordIPAs([]);
    } catch {
      loadMoreFromPool(currentSeen, mastered);
    } finally {
      setFetchingPhrases(false);
    }
  }, [mastered, loadMoreFromPool, resetRecording]);

  // Fetch IPA for active phrase
  useEffect(() => {
    if (!activePhrase) return;
    setWordIPAs([]);
    setIpaLoading(true);
    const words = activePhrase.split(/\s+/).filter(Boolean);
    const clean = (w: string) => w.replace(/[^a-zA-Z']/g, "").toLowerCase();
    Promise.all(words.map(w => fetchWordIPA(clean(w)))).then(ipas => {
      setWordIPAs(words.map((w, i) => ({ word: w, ipa: ipas[i], alignment: null })));
      setIpaLoading(false);
    });
  }, [activePhrase]);

  const analyzeRecording = useCallback(async (url: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/gemini/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioDataUrl: url }),
      });
      if (!res.ok) return;
      const { transcript } = await res.json() as { transcript?: string };
      if (!transcript) return;

      const phraseWords     = activePhrase.split(/\s+/).filter(Boolean);
      const transcriptWords = transcript.trim().split(/\s+/).filter(Boolean);
      const results = await Promise.all(
        phraseWords.map((w, i) => analyzePhonemes(w, transcriptWords[i] ?? ""))
      );

      setWordIPAs(prev =>
        prev.map((entry, i) => ({ ...entry, alignment: results[i]?.alignment ?? null }))
      );

      setSoundProgress(prev => {
        const next = { ...prev };
        for (const r of results) {
          for (const a of r.alignment) {
            const key = a.phoneme;
            if (!next[key]) next[key] = { correct: 0, total: 0 };
            next[key].total += 1;
            if (a.status === "correct") next[key].correct += 1;
          }
        }
        return next;
      });

      const allCorrect = results.every(r => r.alignment.every(a => a.status === "correct"));
      if (allCorrect && activePhrase) {
        setMastered(prev => {
          const next = new Set(prev).add(activePhrase);
          saveMastered(next);
          return next;
        });
      }
    } catch {
      // non-critical
    } finally {
      setAnalyzing(false);
    }
  }, [activePhrase]);

  useEffect(() => {
    if (audioUrl) analyzeRecording(audioUrl);
  }, [audioUrl, analyzeRecording]);

  const advanceQueue = useCallback(() => {
    setSeen(prev => {
      const next = new Set(prev).add(activePhrase);
      saveSeen(next);
      return next;
    });
    setQueue(prev => {
      const next = prev.slice(1);
      saveQueue(next);
      return next;
    });
    resetRecording();
    setWordIPAs([]);
  }, [activePhrase, resetRecording]);

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      resetRecording();
      setWordIPAs(prev => prev.map(e => ({ ...e, alignment: null })));
      startRecording();
    }
  };

  const handleListenModel = (rate = 0.85) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(activePhrase);
    u.lang = "en-US";
    u.rate = rate;
    window.speechSynthesis.speak(u);
  };

  const handleSavePractice = async (word: string) => {
    await saveAIWord({
      word: word.toLowerCase(),
      meaning: "",
      difficulty: "medium",
      context: activePhrase,
      conversationId: 0,
      savedAt: new Date().toISOString(),
    });
    setSavedWords(prev => new Set(prev).add(word.toLowerCase()));
  };

  const hasAnalysis   = wordIPAs.some(w => w.alignment !== null);
  const hasMistakes   = wordIPAs.some(w => w.alignment?.some(a => a.status !== "correct"));
  const focus         = hasAnalysis && hasMistakes ? firstBadPhoneme(wordIPAs) : null;
  const focusTip      = focus ? PHONEME_TIPS[focus.phoneme] ?? null : null;
  const focusProgress = focus ? soundProgress[focus.phoneme] ?? null : null;

  const doneInBatch   = batchCount - queue.length;
  const progressPct   = batchCount > 0 ? (doneInBatch / batchCount) * 100 : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      <PronunciationProgress
        current={doneInBatch}
        total={batchCount}
        mastered={mastered.size}
        pct={progressPct}
      />

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
            onListen={() => handleListenModel()}
            onSlow={() => handleListenModel(0.55)}
          />

          {focus && !analyzing && (
            <div className="px-4 pb-4 shrink-0">
              <CoachPanel
                focus={focus}
                focusTip={focusTip}
                focusProgress={focusProgress}
                savedWords={savedWords}
                onSave={handleSavePractice}
              />
            </div>
          )}
        </div>
      )}

      {!sessionDone && (
        <RecordingControls
          isRecording={isRecording}
          onMicClick={handleMicClick}
          onSkip={advanceQueue}
        />
      )}

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
