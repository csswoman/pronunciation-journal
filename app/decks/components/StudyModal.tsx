"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Tables } from "@/lib/supabase/types";
import { StudyProgressBar } from "./StudyProgressBar";
import { StudyCardImage } from "./StudyCardImage";
import { StudyCardContent } from "./StudyCardContent";
import { StudyDifficultyButtons, type DifficultyKey, DIFFICULTY_CONFIG } from "./StudyDifficultyButtons";

type Deck = Tables<"decks">;
type Entry = Tables<"entries">;
type Progress = Tables<"deck_entry_progress">;
type DeckEntryRow = { entries: Entry | null };

interface CardWithProgress extends Entry {
  progress: Progress | null;
}

interface SessionStats {
  total: number;
  again: number;
  hard: number;
  easy: number;
  newlyMastered: number;
}

interface StudyModalProps {
  deck: Deck;
  onClose: () => void;
}

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
    interval_days > 21 ? "mastered" :
    repetitions > 0 ? "review" : "learning";

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

export function StudyModal({ deck, onClose }: StudyModalProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<"loading" | "studying" | "done">("loading");
  const [queue, setQueue] = useState<CardWithProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showAllMeanings, setShowAllMeanings] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [stats, setStats] = useState<SessionStats>({ total: 0, again: 0, hard: 0, easy: 0, newlyMastered: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadEntries = async () => {
      if (!user) return;
      const supabase = getSupabaseBrowserClient();

      const { data: deckEntries } = await supabase
        .from("deck_entries")
        .select("entry_id, entries(*)")
        .eq("deck_id", deck.id);

      const entries = ((deckEntries ?? []) as DeckEntryRow[])
        .map((r) => r.entries)
        .filter(Boolean) as Entry[];

      if (!entries.length) { setPhase("studying"); return; }

      const entryIds = entries.map((e) => e.id);
      const { data: progressRows } = await supabase
        .from("deck_entry_progress")
        .select("*")
        .eq("user_id", user.id)
        .in("entry_id", entryIds);

      const progressMap = new Map<string, Progress>(
        (progressRows ?? []).map((p) => [p.entry_id, p as Progress])
      );

      const now = new Date();
      const due: CardWithProgress[] = entries
        .map((e) => ({ ...e, progress: progressMap.get(e.id) ?? null }))
        .filter((c) => {
          if (!c.progress) return true; // new card, always due
          return new Date(c.progress.next_review_at) <= now;
        })
        .sort(() => Math.random() - 0.5);

      setQueue(due);
      setStats({ total: due.length, again: 0, hard: 0, easy: 0, newlyMastered: 0 });
      setPhase("studying");
    };
    loadEntries();
  }, [deck.id, user]);

  const currentCard = queue[currentIndex];

  useEffect(() => {
    if (!currentCard) return;
    setImageUrl(currentCard.image_url ?? null);
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
      console.error("[word-image] upload failed:", err);
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

  const handleDifficulty = useCallback(
    async (difficulty: DifficultyKey) => {
      if (!user || !currentCard) return;

      const q = DIFFICULTY_CONFIG[difficulty].q;
      const existingProgress = currentCard.progress ?? {
        id: "",
        user_id: user.id,
        entry_id: currentCard.id,
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 0,
        next_review_at: new Date().toISOString(),
        status: "new" as const,
        last_reviewed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updated = sm2(existingProgress, q);
      const supabase = getSupabaseBrowserClient();

      await supabase.from("deck_entry_progress").upsert({
        user_id: user.id,
        entry_id: currentCard.id,
        ...updated,
      }, { onConflict: "user_id,entry_id" });

      setStats((s) => ({
        ...s,
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
        setShowAllMeanings(false);
      }
    },
    [user, currentCard, currentIndex, queue.length]
  );

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

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--page-bg)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-[var(--text-secondary)]">Loading cards…</p>
        </div>
      </div>
    );
  }

  if (phase === "studying" && queue.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--page-bg)] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] p-8 text-center space-y-5">
          <div className="text-5xl">🎉</div>
          <div>
            <h2 className="text-xl font-bold text-[var(--deep-text)]">All caught up!</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              No cards due for review in <strong>{deck.name}</strong>. Come back later!
            </p>
          </div>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
            Done
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const reviewed = stats.total;
    return (
      <div className="fixed inset-0 z-50 bg-[var(--page-bg)] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] p-8 text-center space-y-5">
          <div className="text-5xl">🎉</div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--deep-text)]">Session Complete!</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              You reviewed <strong>{reviewed}</strong> card{reviewed !== 1 ? "s" : ""} from <strong>{deck.name}</strong>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-3">
              <div className="text-lg font-bold text-rose-700 dark:text-rose-300">{stats.again}</div>
              <div className="text-xs text-rose-600 dark:text-rose-400">Again</div>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
              <div className="text-lg font-bold text-amber-700 dark:text-amber-300">{stats.hard}</div>
              <div className="text-xs text-amber-600 dark:text-amber-400">Hard</div>
            </div>
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
              <div className="text-lg font-bold text-green-700 dark:text-green-300">{stats.easy}</div>
              <div className="text-xs text-green-600 dark:text-green-400">Easy</div>
            </div>
          </div>
          {stats.newlyMastered > 0 && (
            <p className="text-sm text-[var(--text-secondary)]">
              ⭐ {stats.newlyMastered} card{stats.newlyMastered !== 1 ? "s" : ""} mastered!
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setCurrentIndex(0); setFlipped(false); setShowAllMeanings(false); setPhase("studying"); }}
              className="flex-1 py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Study Again
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--line-divider)] text-[var(--deep-text)] font-semibold text-sm hover:bg-[var(--btn-regular-bg)] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--page-bg)] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--deep-text)] transition-colors"
        >
          <ChevronLeft size={18} />
          <span className="font-medium">{deck.name}</span>
        </button>
        <p className="text-sm text-[var(--text-tertiary)] font-mono">
          {currentIndex + 1} / {queue.length}
        </p>
      </div>

      <StudyProgressBar queue={queue} currentIndex={currentIndex} />

      <div
        className="flex-1 flex items-stretch mx-4 mb-4 cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
      >
        <div className="w-full bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] overflow-hidden flex flex-col md:flex-row shadow-sm">
          <StudyCardImage
            imageUrl={imageUrl}
            imageLoading={imageLoading}
            word={currentCard?.word}
            fileInputRef={fileInputRef}
            onUpload={handleImageUpload}
            onRemove={handleRemoveImage}
          />
          {currentCard && (
            <StudyCardContent
              entry={currentCard}
              flipped={flipped}
              showAllMeanings={showAllMeanings}
              onToggleAllMeanings={() => setShowAllMeanings((s) => !s)}
            />
          )}
        </div>
      </div>

      <StudyDifficultyButtons onDifficulty={handleDifficulty} visible={flipped} />
    </div>
  );
}
