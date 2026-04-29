"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, SkipForward, Volume2, ImagePlus, Lightbulb, ChevronDown, Lock, Bookmark } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Tables } from "@/lib/supabase/types";
import { DIFFICULTY_CONFIG, type DifficultyKey } from "./StudyDifficultyButtons";

type Deck = Tables<"decks">;
type Entry = Tables<"entries">;
type Progress = Tables<"deck_entry_progress">;
type DeckEntryRow = { entries: Entry | null };

interface CardWithProgress extends Entry {
  progress: Progress | null;
}

interface SessionStats {
  seen: number;
  again: number;
  hard: number;
  easy: number;
  newlyMastered: number;
}

interface StudyModalProps {
  deck: Deck;
  onClose: () => void;
}

const LEVEL_LABELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_NAMES: Record<string, string> = {
  A1: "Beginner", A2: "Elementary", B1: "Intermediate",
  B2: "Upper-Intermediate", C1: "Advanced", C2: "Proficient",
};
const DOT_COLORS = ["#a78bfa", "#fb923c", "#4ade80", "#60a5fa", "#f472b6"];
const STUDY_TIPS = [
  "Try to use the word in a sentence before checking the answer.",
  "Visualize the word in an everyday context to remember it better.",
  "Connect this word to something you already know.",
  "Say the word out loud — it helps lock it into memory.",
];

const RATING_CONFIG = {
  again: {
    label: "Hard",
    sublabel: "Didn't remember",
    q: 1,
    bg: "var(--error-soft)",
    border: "var(--error)",
    color: "var(--error)",
  },
  hard: {
    label: "Medium",
    sublabel: "Remembered with effort",
    q: 3,
    bg: "var(--warning-soft)",
    border: "var(--warning)",
    color: "var(--warning)",
  },
  easy: {
    label: "Easy",
    sublabel: "Remembered it well",
    q: 5,
    bg: "var(--success-soft)",
    border: "var(--success)",
    color: "var(--success)",
  },
} as const;

function sm2(progress: Progress, q: number): Omit<Progress, "id" | "user_id" | "entry_id" | "created_at"> {
  const now = new Date().toISOString();
  let { ease_factor, interval_days, repetitions } = progress;
  if (q < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
    repetitions += 1;
  }
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval_days);
  const status: Progress["status"] =
    interval_days > 21 ? "mastered" : repetitions > 0 ? "review" : "learning";
  return {
    ease_factor: Math.round(ease_factor * 100) / 100,
    interval_days,
    repetitions,
    next_review_at: nextReview.toISOString(),
    status,
    last_reviewed_at: now,
    updated_at: now,
  };
}

function previewInterval(progress: Progress | null, q: number): string {
  if (q < 3) return "in 10 min";
  let ease_factor = progress?.ease_factor ?? 2.5;
  let interval_days = progress?.interval_days ?? 1;
  let repetitions = progress?.repetitions ?? 0;
  ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  if (repetitions === 0) interval_days = 1;
  else if (repetitions === 1) interval_days = 6;
  else interval_days = Math.round(interval_days * ease_factor);
  if (interval_days <= 1) return "in 1 day";
  if (interval_days < 7) return `in ${interval_days} days`;
  const weeks = Math.round(interval_days / 7);
  return weeks === 1 ? "in 1 week" : `in ${weeks} weeks`;
}

function timeUntil(isoDate: string | undefined | null): string {
  if (!isoDate) return "new";
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return "now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ${days} days`;
}

function speakWord(word: string) {
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = "en-US";
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

function blankOutWord(sentence: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return sentence.replace(new RegExp(escaped, "gi"), "___");
}

export function StudyModal({ deck, onClose }: StudyModalProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<"loading" | "studying" | "done">("loading");
  const [queue, setQueue] = useState<CardWithProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState<SessionStats>({ seen: 0, again: 0, hard: 0, easy: 0, newlyMastered: 0 });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [tipIndex] = useState(() => Math.floor(Math.random() * STUDY_TIPS.length));
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const supabase = getSupabaseBrowserClient();
      const { data: deckEntries } = await supabase
        .from("deck_entries").select("entry_id, entries(*)").eq("deck_id", deck.id);
      const entries = ((deckEntries ?? []) as DeckEntryRow[])
        .map((r) => r.entries).filter(Boolean) as Entry[];
      if (!entries.length) { setPhase("studying"); return; }
      const { data: progressRows } = await supabase
        .from("deck_entry_progress").select("*").eq("user_id", user.id)
        .in("entry_id", entries.map((e) => e.id));
      const progressMap = new Map<string, Progress>(
        (progressRows ?? []).map((p) => [p.entry_id, p as Progress])
      );
      const now = new Date();
      const due = entries
        .map((e) => ({ ...e, progress: progressMap.get(e.id) ?? null }))
        .filter((c) => !c.progress || new Date(c.progress.next_review_at) <= now)
        .sort(() => Math.random() - 0.5);
      setQueue(due);
      setPhase("studying");
    };
    load();
  }, [deck.id, user]);

  const currentCard = queue[currentIndex];

  useEffect(() => {
    setImageUrl(currentCard?.image_url ?? null);
  }, [currentCard?.id]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!currentCard || imageLoading) return;
    setImageLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("entryId", currentCard.id);
      const res = await fetch("/api/gemini/word-image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.imageUrl) throw new Error(data.error ?? "Upload failed");
      setImageUrl(data.imageUrl);
      setQueue((q) => q.map((e) => e.id === currentCard.id ? { ...e, image_url: data.imageUrl } : e));
    } catch (err) {
      console.error("[word-image]", err);
    } finally {
      setImageLoading(false);
    }
  }, [currentCard, imageLoading]);

  const handleRemoveImage = useCallback(async () => {
    if (!currentCard) return;
    await fetch("/api/gemini/word-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId: currentCard.id }),
    });
    setImageUrl(null);
    setQueue((q) => q.map((e) => e.id === currentCard.id ? { ...e, image_url: null } : e));
  }, [currentCard]);

  const handleDifficulty = useCallback(async (difficulty: DifficultyKey) => {
    if (!user || !currentCard) return;
    const q = DIFFICULTY_CONFIG[difficulty].q;
    const existing = currentCard.progress ?? {
      id: "", user_id: user.id, entry_id: currentCard.id,
      ease_factor: 2.5, interval_days: 1, repetitions: 0,
      next_review_at: new Date().toISOString(), status: "new" as const,
      last_reviewed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    const updated = sm2(existing, q);
    await getSupabaseBrowserClient().from("deck_entry_progress").upsert(
      { user_id: user.id, entry_id: currentCard.id, ...updated },
      { onConflict: "user_id,entry_id" }
    );
    setStats((s) => ({
      seen: s.seen + 1,
      again: difficulty === "again" ? s.again + 1 : s.again,
      hard: difficulty === "hard" ? s.hard + 1 : s.hard,
      easy: difficulty === "easy" ? s.easy + 1 : s.easy,
      newlyMastered: updated.status === "mastered" ? s.newlyMastered + 1 : s.newlyMastered,
    }));
    if (currentIndex + 1 >= queue.length) {
      setPhase("done");
    } else {
      setCurrentIndex((p) => p + 1);
      setFlipped(false);
    }
  }, [user, currentCard, currentIndex, queue.length]);

  const handleSkip = useCallback(() => {
    if (currentIndex + 1 >= queue.length) { setPhase("done"); return; }
    setCurrentIndex((p) => p + 1);
    setFlipped(false);
  }, [currentIndex, queue.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== "studying") return;
      if (e.code === "Space") { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped) {
        if (e.key === "1") handleDifficulty("again");
        if (e.key === "2") handleDifficulty("hard");
        if (e.key === "3") handleDifficulty("easy");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, flipped, handleDifficulty]);

  const meanings = Array.isArray(currentCard?.meanings) ? currentCard.meanings : [];
  const firstMeaning = meanings[0] as { partOfSpeech?: string; definitions?: { definition?: string; example?: string }[] } | undefined;
  const firstDef = firstMeaning?.definitions?.[0];
  const levelLabel = currentCard?.difficulty
    ? LEVEL_LABELS[Math.min((currentCard.difficulty ?? 1) - 1, 5)]
    : null;
  const upcomingCards = queue.slice(currentIndex + 1, currentIndex + 4);
  const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

  const centeredOverlay = (children: React.ReactNode) => (
    <div className="flex flex-col min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      {children}
    </div>
  );

  if (phase === "loading") {
    return centeredOverlay(
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
    );
  }

  if (phase === "studying" && queue.length === 0) {
    return centeredOverlay(
      <div className="max-w-sm w-full rounded-2xl border p-8 text-center space-y-5"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--line-divider)" }}>
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold" style={{ color: "var(--deep-text)" }}>All caught up!</h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          No cards due in <strong>{deck.name}</strong>.
        </p>
        <button onClick={onClose}
          className="w-full py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
          Done
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return centeredOverlay(
      <div className="max-w-sm w-full rounded-2xl border p-8 text-center space-y-5"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--line-divider)" }}>
        <div className="text-5xl">🎉</div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--deep-text)" }}>Session complete!</h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            You reviewed <strong>{stats.seen}</strong> card{stats.seen !== 1 ? "s" : ""} from <strong>{deck.name}</strong>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            { val: stats.again, label: "hard", cfg: RATING_CONFIG.again },
            { val: stats.hard,  label: "medium", cfg: RATING_CONFIG.hard },
            { val: stats.easy,  label: "easy",   cfg: RATING_CONFIG.easy },
          ].map(({ val, label, cfg }) => (
            <div key={label} className="rounded-xl p-3"
              style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="text-lg font-bold" style={{ color: cfg.color }}>{val}</div>
              <div className="text-xs" style={{ color: cfg.color }}>{label}</div>
            </div>
          ))}
        </div>
        {stats.newlyMastered > 0 && (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            ⭐ {stats.newlyMastered} card{stats.newlyMastered !== 1 ? "s" : ""} mastered
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => { setCurrentIndex(0); setFlipped(false); setStats({ seen: 0, again: 0, hard: 0, easy: 0, newlyMastered: 0 }); setPhase("studying"); }}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
            Study again
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            style={{ border: "1px solid var(--line-divider)", color: "var(--deep-text)", backgroundColor: "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)]">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          title="Back"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-semibold text-sm shrink-0" style={{ color: "var(--deep-text)" }}>
          {deck.name}
        </span>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--btn-regular-bg)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: "var(--warning)" }}
          />
        </div>
        <span className="text-xs font-mono shrink-0" style={{ color: "var(--text-tertiary)" }}>
          {currentIndex + 1}/{queue.length}
        </span>
        <button
          onClick={() => setShowTip((v) => !v)}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors shrink-0"
          style={{ borderColor: "var(--line-divider)", color: "var(--text-secondary)" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Lightbulb size={13} />
          {showTip ? "Hide tip" : "View tip"}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-4 px-4 pb-2 min-h-0">

        {/* Left panel */}
        <div className="hidden lg:flex flex-col gap-5 w-56 xl:w-64 shrink-0">

          {/* Reference image */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: "var(--text-tertiary)" }}>Reference</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }}
            />
            <div className="rounded-xl border border-dashed aspect-[4/3] flex items-center justify-center overflow-hidden relative group"
              style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)" }}>
              {imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={currentCard?.word} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 rounded-lg bg-white/90 text-[10px] font-semibold text-gray-800 hover:bg-white">
                      Change
                    </button>
                    <button onClick={handleRemoveImage}
                      className="px-2 py-1 rounded-lg bg-white/90 text-[10px] font-semibold text-red-600 hover:bg-white">
                      Remove
                    </button>
                  </div>
                </>
              ) : imageLoading ? (
                <div className="flex flex-col items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
                  <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
                  <p className="text-[10px]">Uploading…</p>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-4 w-full h-full justify-center transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--deep-text)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}>
                  <ImagePlus size={22} className="opacity-40" />
                  <p className="text-[11px] text-center">Add reference<br />image</p>
                </button>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-3"
              style={{ color: "var(--text-tertiary)" }}>Details</p>
            <div className="space-y-3">
              {levelLabel && (
                <div>
                  <p className="text-[10px] mb-1" style={{ color: "var(--text-tertiary)" }}>Level</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold"
                    style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-soft)", color: "var(--warning)" }}>
                    {levelLabel} · {LEVEL_NAMES[levelLabel] ?? ""}
                  </span>
                </div>
              )}
              {currentCard?.tags && currentCard.tags.length > 0 && (
                <div>
                  <p className="text-[10px] mb-1" style={{ color: "var(--text-tertiary)" }}>Category</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--deep-text)" }}>{currentCard.tags[0]}</p>
                </div>
              )}
              {firstMeaning?.partOfSpeech && (
                <div>
                  <p className="text-[10px] mb-1" style={{ color: "var(--text-tertiary)" }}>Part of speech</p>
                  <p className="text-sm font-semibold capitalize" style={{ color: "var(--deep-text)" }}>{firstMeaning.partOfSpeech}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tip */}
          {showTip && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--line-divider)" }}>
              <button
                onClick={() => setShowTip((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors"
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <span className="text-xs font-semibold" style={{ color: "var(--deep-text)" }}>Tip</span>
                <ChevronDown size={14} style={{ color: "var(--text-tertiary)" }} />
              </button>
              <div className="px-3 pb-3">
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{STUDY_TIPS[tipIndex]}</p>
              </div>
            </div>
          )}
        </div>

        {/* Center — Flashcard with 3D flip */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0">
          <div
            style={{ perspective: "1000px" }}
            className="w-full max-w-sm cursor-pointer select-none"
            onClick={() => setFlipped((f) => !f)}
          >
            <div style={{
              transformStyle: "preserve-3d",
              transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              position: "relative",
              minHeight: "280px",
            }}>

              {/* Front face */}
              <div
                style={{
                  backfaceVisibility: "hidden",
                  backgroundColor: "var(--card-bg)",
                  borderRadius: "16px",
                  border: "1px solid var(--line-divider)",
                  boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                  overflow: "hidden",
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-0">
                  {firstMeaning?.partOfSpeech ? (
                    <span className="px-2.5 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wide"
                      style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-soft)", color: "var(--warning)" }}>
                      {firstMeaning.partOfSpeech}
                    </span>
                  ) : levelLabel ? (
                    <span className="px-2.5 py-0.5 rounded-full border text-xs font-bold"
                      style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-soft)", color: "var(--warning)" }}>
                      {levelLabel}
                    </span>
                  ) : <span />}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSkip(); }}
                      className="p-1.5 rounded-lg border transition-colors"
                      style={{ borderColor: "var(--line-divider)", color: "var(--text-tertiary)" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      title="Skip"
                    >
                      <SkipForward size={13} />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg border transition-colors"
                      style={{ borderColor: "var(--line-divider)", color: "var(--text-tertiary)" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <Bookmark size={13} />
                    </button>
                  </div>
                </div>

                {/* Front body */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center space-y-3">
                  <h2 className="text-5xl font-bold italic leading-none"
                    style={{ fontFamily: "var(--font-serif, serif)", color: "var(--deep-text)" }}>
                    {currentCard?.word}
                  </h2>
                  {currentCard?.ipa && (
                    <div className="flex items-center gap-2 justify-center">
                      <span className="text-base" style={{ color: "var(--text-secondary)" }}>/{currentCard.ipa}/</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (currentCard?.word) speakWord(currentCard.word); }}
                        className="p-1.5 rounded-full border transition-colors"
                        style={{ borderColor: "var(--line-divider)", color: "var(--text-secondary)" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Volume2 size={13} />
                      </button>
                    </div>
                  )}
                  <div className="w-full border-t border-dashed" style={{ borderColor: "var(--line-divider)" }} />
                  {firstDef?.example ? (
                    <div className="rounded-xl border border-dashed p-3 w-full text-left"
                      style={{ borderColor: "var(--line-divider)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                        style={{ color: "var(--text-tertiary)" }}>Fill in the blank</p>
                      <p className="text-xs italic leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}>
                        "{blankOutWord(firstDef.example, currentCard?.word ?? "")}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm italic" style={{ color: "var(--text-tertiary)" }}>
                      Think of the meaning before flipping
                    </p>
                  )}
                </div>
              </div>

              {/* Back face */}
              <div
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  backgroundColor: "var(--card-bg)",
                  borderRadius: "16px",
                  border: "1px solid var(--line-divider)",
                  boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                  overflow: "hidden",
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-0">
                  {firstMeaning?.partOfSpeech ? (
                    <span className="px-2.5 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wide"
                      style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-soft)", color: "var(--warning)" }}>
                      {firstMeaning.partOfSpeech}
                    </span>
                  ) : <span />}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSkip(); }}
                      className="p-1.5 rounded-lg border transition-colors"
                      style={{ borderColor: "var(--line-divider)", color: "var(--text-tertiary)" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <SkipForward size={13} />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg border transition-colors"
                      style={{ borderColor: "var(--line-divider)", color: "var(--text-tertiary)" }}
                    >
                      <Bookmark size={13} />
                    </button>
                  </div>
                </div>

                {/* Back body */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center space-y-3">
                  <h2 className="text-5xl font-bold italic leading-none"
                    style={{ fontFamily: "var(--font-serif, serif)", color: "var(--deep-text)" }}>
                    {currentCard?.word}
                  </h2>
                  {currentCard?.ipa && (
                    <div className="flex items-center gap-2 justify-center">
                      <span className="text-base" style={{ color: "var(--text-secondary)" }}>/{currentCard.ipa}/</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (currentCard?.word) speakWord(currentCard.word); }}
                        className="p-1.5 rounded-full border transition-colors"
                        style={{ borderColor: "var(--line-divider)", color: "var(--text-secondary)" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Volume2 size={13} />
                      </button>
                    </div>
                  )}
                  <div className="w-full border-t border-dashed" style={{ borderColor: "var(--line-divider)" }} />
                  <div className="w-full space-y-3 text-left">
                    {firstDef?.definition && (
                      <p className="text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                        {firstDef.definition}
                      </p>
                    )}
                    {firstDef?.example && (
                      <div className="rounded-xl border border-dashed p-3"
                        style={{ borderColor: "var(--line-divider)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                          style={{ color: "var(--text-tertiary)" }}>Example</p>
                        <p className="text-xs italic leading-relaxed"
                          style={{ color: "var(--text-secondary)" }}>"{firstDef.example}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hint below card */}
          {!flipped && (
            <p className="mt-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Hint: Press{" "}
              <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono"
                style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)" }}>
                SPACE
              </kbd>
              {" "}to flip
            </p>
          )}
        </div>

        {/* Right panel */}
        <div className="hidden lg:flex flex-col gap-5 w-52 xl:w-60 shrink-0">

          {/* Today's progress */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: "var(--text-tertiary)" }}>Today's progress</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: stats.easy,  label: "easy",         color: "var(--success)" },
                { val: stats.again, label: "hard",         color: "var(--error)" },
                { val: stats.hard,  label: "medium",       color: "var(--warning)" },
                { val: stats.seen,  label: "total seen",   color: "var(--deep-text)" },
              ].map(({ val, label, color }) => (
                <div key={label} className="rounded-xl border p-3 text-center"
                  style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--card-bg)" }}>
                  <p className="text-xl font-bold" style={{ color }}>{val}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming cards */}
          {upcomingCards.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-2"
                style={{ color: "var(--text-tertiary)" }}>Upcoming cards</p>
              <div className="space-y-1.5">
                {upcomingCards.map((card, i) => {
                  const cardLevel = card.difficulty
                    ? LEVEL_LABELS[Math.min((card.difficulty ?? 1) - 1, 5)]
                    : null;
                  return (
                    <div key={card.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border"
                      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--card-bg)" }}>
                      <div className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--deep-text)" }}>
                          {card.word}
                        </p>
                        {cardLevel && (
                          <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                            {cardLevel} · {LEVEL_NAMES[cardLevel]}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: "var(--text-tertiary)" }}>
                        {timeUntil(card.progress?.next_review_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom rating section */}
      <div className="border-t px-4 py-3" style={{ borderColor: "var(--line-divider)" }}>
        {!flipped && (
          <p className="text-center text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
            Rate after seeing the answer
          </p>
        )}
        <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto">
          {(Object.entries(RATING_CONFIG) as [DifficultyKey, typeof RATING_CONFIG[DifficultyKey]][]).map(([key, cfg]) => {
            const timeLabel = previewInterval(currentCard?.progress ?? null, cfg.q);
            return (
              <button
                key={key}
                onClick={() => flipped && handleDifficulty(key)}
                disabled={!flipped}
                className="flex flex-col items-center gap-0.5 py-3 px-2 rounded-2xl border transition-all active:scale-95"
                style={flipped ? {
                  backgroundColor: cfg.bg,
                  borderColor: cfg.border,
                  cursor: "pointer",
                  opacity: 1,
                } : {
                  backgroundColor: "var(--btn-regular-bg)",
                  borderColor: "var(--line-divider)",
                  cursor: "not-allowed",
                  opacity: 0.7,
                }}
              >
                {flipped ? (
                  <span className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                ) : (
                  <Lock size={15} style={{ color: "var(--text-tertiary)" }} className="mb-0.5" />
                )}
                <span className="text-xs" style={{ color: flipped ? cfg.color : "var(--text-tertiary)" }}>
                  {cfg.sublabel}
                </span>
                <span className="text-xs font-semibold" style={{ color: flipped ? cfg.color : "var(--text-tertiary)" }}>
                  {flipped ? timeLabel : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
