"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Play, Turtle, CheckCircle, Sparkles, Trophy } from "lucide-react";
import { useRecorder } from "@/hooks/useRecorder";
import { analyzePhonemes, ARPABET_TO_IPA } from "@/lib/phonemes";
import { saveAIWord } from "@/lib/ai-db";
import { pickUSPhonetic, stripIPASlashes } from "@/lib/ai-practice/modes/pronunciation";
import PhraseCard from "./pronunciation/PhraseCard";
import CoachPanel from "./pronunciation/CoachPanel";
import WaveformIdle from "./pronunciation/WaveformIdle";
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

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

const LS_QUEUE = "pronunciation_queue";
const LS_MASTERED = "pronunciation_mastered";
const LS_SEEN = "pronunciation_seen";

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
function saveQueue(q: string[]) {
  localStorage.setItem(LS_QUEUE, JSON.stringify(q));
}
function loadMastered(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_MASTERED) ?? "[]")); } catch { return new Set(); }
}
function saveMastered(s: Set<string>) {
  localStorage.setItem(LS_MASTERED, JSON.stringify([...s]));
}
function loadSeen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_SEEN) ?? "[]")); } catch { return new Set(); }
}
function saveSeen(s: Set<string>) {
  localStorage.setItem(LS_SEEN, JSON.stringify([...s]));
}

function initQueue(): string[] {
  const stored = loadQueue();
  if (stored.length > 0) return stored;
  const mastered = loadMastered();
  const fresh = shuffle(DEFAULT_PHRASES.filter(p => !mastered.has(p)));
  saveQueue(fresh);
  return fresh;
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
// Component
// ---------------------------------------------------------------------------

interface PronunciationViewProps {
  onSubmit?: (audioUrl: string, phrase: string) => void;
}

export default function PronunciationView({ onSubmit }: PronunciationViewProps) {
  const [queue, setQueue] = useState<string[]>([]);
  const [mastered, setMastered] = useState<Set<string>>(new Set());
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [customPhrase, setCustomPhrase] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [fetchingPhrases, setFetchingPhrases] = useState(false);

  const { startRecording, stopRecording, audioUrl, isRecording, resetRecording } = useRecorder();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setQueue(initQueue());
    setMastered(loadMastered());
    setSeen(loadSeen());
  }, []);

  const activePhrase = customPhrase || queue[0] || "";

  const [wordIPAs, setWordIPAs] = useState<WordIPA[]>([]);
  const [ipaLoading, setIpaLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [soundProgress, setSoundProgress] = useState<SoundProgress>({});
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [justMastered, setJustMastered] = useState(false);

  // Fetch new phrases from Gemini when queue is empty
  const fetchNewPhrases = useCallback(async (currentSeen: Set<string>) => {
    setFetchingPhrases(true);
    try {
      const res = await fetch("/api/gemini/phrases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exclude: [...currentSeen].slice(-30) }),
      });
      if (!res.ok) return;
      const { phrases } = await res.json() as { phrases?: string[] };
      if (!Array.isArray(phrases) || phrases.length === 0) return;
      const newQueue = shuffle(phrases);
      setQueue(newQueue);
      saveQueue(newQueue);
    } catch {
      // non-critical — user can still type custom phrases
    } finally {
      setFetchingPhrases(false);
    }
  }, []);

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
    setJustMastered(false);
    try {
      const res = await fetch("/api/gemini/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioDataUrl: url }),
      });
      if (!res.ok) return;
      const { transcript } = await res.json() as { transcript?: string };
      if (!transcript) return;

      const phraseWords = activePhrase.split(/\s+/).filter(Boolean);
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

      // Mastery: all phonemes correct
      const allCorrect = results.every(r => r.alignment.every(a => a.status === "correct"));
      if (allCorrect && !customPhrase && activePhrase) {
        setJustMastered(true);
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
  }, [activePhrase, customPhrase]);

  useEffect(() => {
    if (audioUrl) analyzeRecording(audioUrl);
  }, [audioUrl, analyzeRecording]);

  const advanceQueue = useCallback(() => {
    if (customPhrase) {
      setCustomPhrase("");
      return;
    }
    setQueue(prev => {
      const next = prev.slice(1);
      saveQueue(next);
      if (next.length === 0) {
        // All local phrases done — fetch new ones from AI
        fetchNewPhrases(seen);
      }
      return next;
    });
    setSeen(prev => {
      const next = new Set(prev).add(activePhrase);
      saveSeen(next);
      return next;
    });
  }, [customPhrase, activePhrase, seen, fetchNewPhrases]);

  const handleSend = () => {
    if (!audioUrl) return;
    onSubmit?.(audioUrl, activePhrase);
    resetRecording();
    setWordIPAs(prev => prev.map(e => ({ ...e, alignment: null })));
    setJustMastered(false);
    advanceQueue();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setCustomPhrase(inputValue.trim());
    setInputValue("");
    resetRecording();
    setWordIPAs([]);
    setJustMastered(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      resetRecording();
      setWordIPAs(prev => prev.map(e => ({ ...e, alignment: null })));
      setJustMastered(false);
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

  const hasAnalysis = wordIPAs.some(w => w.alignment !== null);
  const hasMistakes = wordIPAs.some(w => w.alignment?.some(a => a.status !== "correct"));
  const focus = hasAnalysis && hasMistakes ? firstBadPhoneme(wordIPAs) : null;
  const focusTip = focus ? PHONEME_TIPS[focus.phoneme] ?? null : null;
  const focusProgress = focus ? soundProgress[focus.phoneme] ?? null : null;
  const focusPct = focusProgress && focusProgress.total > 0
    ? Math.round((focusProgress.correct / focusProgress.total) * 100)
    : null;

  const totalSeen = seen.size;
  const totalMastered = mastered.size;
  const remaining = queue.length;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8">

        {/* Counter bar */}
        <div className="w-full max-w-sm flex items-center justify-between">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-tertiary)" }}
          >
            Active pronunciation
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>
              <Trophy size={10} />
              {totalMastered} mastered
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              {totalSeen} seen
            </span>
            {remaining > 0 && (
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                {remaining} left
              </span>
            )}
          </div>
        </div>

        {/* Fetching new phrases state */}
        {fetchingPhrases && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
            <Sparkles size={12} className="animate-pulse" />
            Generating new phrases...
          </div>
        )}

        {/* Mastered banner */}
        {justMastered && !analyzing && (
          <div
            className="w-full max-w-sm flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: "color-mix(in oklch, var(--primary) 12%, transparent)", color: "var(--primary)" }}
          >
            <Trophy size={14} />
            Phrase mastered! Send to move to the next one.
          </div>
        )}

        <PhraseCard
          phrase={activePhrase}
          wordIPAs={wordIPAs}
          ipaLoading={ipaLoading}
          analyzing={analyzing}
          hasAnalysis={hasAnalysis}
          hasMistakes={hasMistakes}
        />

        {focus && !analyzing && (
          <CoachPanel
            focus={focus}
            focusTip={focusTip}
            focusProgress={focusProgress}
            focusPct={focusPct}
            savedWords={savedWords}
            onSave={handleSavePractice}
          />
        )}

        <button
          onClick={handleMicClick}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all focus:outline-none"
          style={{
            backgroundColor: isRecording ? "transparent" : "var(--card-bg)",
            border: `3px solid ${isRecording ? "#ef4444" : "var(--line-divider)"}`,
            boxShadow: isRecording
              ? "0 0 0 6px rgba(239,68,68,0.15), 0 0 0 12px rgba(239,68,68,0.06)"
              : "0 2px 8px rgba(0,0,0,0.08)",
          }}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          <Mic size={22} style={{ color: isRecording ? "#ef4444" : "var(--text-secondary)" }} />
        </button>

        <div
          className="w-full max-w-sm h-14 rounded-xl border flex items-center justify-center overflow-hidden"
          style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)" }}
        >
          {audioUrl ? (
            <audio ref={audioRef} src={audioUrl} controls className="w-full h-full opacity-80" />
          ) : (
            <WaveformIdle isRecording={isRecording} />
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={() => handleListenModel()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-medium transition-all hover:opacity-80"
            style={{ borderColor: "var(--line-divider)", color: "var(--text-secondary)" }}
          >
            <Play size={12} />
            Listen
          </button>

          <button
            onClick={() => handleListenModel(0.55)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-medium transition-all hover:opacity-80"
            style={{ borderColor: "var(--line-divider)", color: "var(--text-secondary)" }}
          >
            <Turtle size={12} />
            Slow
          </button>

          {audioUrl && (
            <button
              onClick={handleSend}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-medium transition-all hover:opacity-80"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              <CheckCircle size={12} />
              Send recording
            </button>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: "var(--line-divider)" }}>
        <form
          onSubmit={handleCustomSubmit}
          className="flex items-center gap-2 p-3 rounded-xl border transition-all focus-within:shadow-md"
          style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--line-divider)" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget))
              e.currentTarget.style.borderColor = "var(--line-divider)";
          }}
        >
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="or type the phrase to practice..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-lg text-white transition-colors flex items-center justify-center disabled:opacity-40"
            style={{ backgroundColor: "var(--primary)" }}
            aria-label="Practice phrase"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
