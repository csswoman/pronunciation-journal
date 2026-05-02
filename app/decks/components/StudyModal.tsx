"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ChevronLeft, Lightbulb } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Tables } from "@/lib/supabase/types";
import { DIFFICULTY_CONFIG, type DifficultyKey } from "./StudyDifficultyButtons";
import { sm2, LEVEL_LABELS, RATING_CONFIG } from "./study-utils";
import { StudyCard } from "./StudyCard";
import { StudyLeftPanel } from "./StudyLeftPanel";
import { StudyRightPanel } from "./StudyRightPanel";
import { StudyRatingBar } from "./StudyRatingBar";

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

const EMPTY_STATS: SessionStats = { seen: 0, again: 0, hard: 0, easy: 0, newlyMastered: 0 };

export function StudyModal({ deck, onClose }: StudyModalProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<"loading" | "studying" | "done">("loading");
  const [queue, setQueue] = useState<CardWithProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState<SessionStats>(EMPTY_STATS);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [tipIndex] = useState(() => Math.floor(Math.random() * 4));

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

  const advanceCard = useCallback(() => {
    if (currentIndex + 1 >= queue.length) {
      setPhase("done");
    } else {
      setCurrentIndex((p) => p + 1);
      setFlipped(false);
    }
  }, [currentIndex, queue.length]);

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
    advanceCard();
  }, [user, currentCard, advanceCard]);

  const handleSkip = useCallback(() => advanceCard(), [advanceCard]);

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
            { val: stats.again, label: "hard",   cfg: RATING_CONFIG.again },
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
            onClick={() => { setCurrentIndex(0); setFlipped(false); setStats(EMPTY_STATS); setPhase("studying"); }}
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
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: "var(--warning)" }} />
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
        <StudyLeftPanel
          imageUrl={imageUrl}
          imageLoading={imageLoading}
          word={currentCard?.word}
          levelLabel={levelLabel}
          partOfSpeech={firstMeaning?.partOfSpeech}
          tags={currentCard?.tags}
          showTip={showTip}
          tipIndex={tipIndex}
          onToggleTip={() => setShowTip((v) => !v)}
          onUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
        />

        {/* Center */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0">
          {currentCard && (
            <StudyCard
              word={currentCard.word}
              ipa={currentCard.ipa}
              levelLabel={levelLabel}
              firstMeaning={firstMeaning}
              firstDef={firstDef}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
              onSkip={handleSkip}
            />
          )}
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

        <StudyRightPanel stats={stats} upcomingCards={upcomingCards} />
      </div>

      <StudyRatingBar
        flipped={flipped}
        progress={currentCard?.progress ?? null}
        onRate={handleDifficulty}
      />
    </div>
  );
}
