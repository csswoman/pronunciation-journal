"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getDeckCardsWithProgress, upsertCardProgress, type DeckListItem } from "@/lib/decks/queries";
import { DIFFICULTY_CONFIG, type DifficultyKey } from "./StudyDifficultyButtons";
import { sm2, LEVEL_LABELS } from "./study-utils";
import { StudyLeftPanel } from "./StudyLeftPanel";
import { StudyRightPanel } from "./StudyRightPanel";
import { StudyRatingBar } from "./StudyRatingBar";
import { StudySessionComplete } from "./StudySessionComplete";
import { StudyEmptyStates } from "./StudyEmptyStates";
import { StudyHeader } from "./StudyHeader";
import { StudyCenterCard } from "./StudyCenterCard";

interface SessionStats {
  seen: number;
  again: number;
  hard: number;
  easy: number;
  newlyMastered: number;
}

interface StudyModalProps {
  deck: DeckListItem;
  onClose: () => void;
}

const EMPTY_STATS: SessionStats = { seen: 0, again: 0, hard: 0, easy: 0, newlyMastered: 0 };

export function StudyModal({ deck, onClose }: StudyModalProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<"loading" | "studying" | "done">("loading");
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof getDeckCardsWithProgress>>>([]);
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
      const due = await getDeckCardsWithProgress(deck.id, user.id);
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
    await upsertCardProgress(user.id, currentCard.id, updated);
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

  const emptyState = (
    <StudyEmptyStates
      phase={phase}
      deckName={deck.name}
      queueLength={queue.length}
      onClose={onClose}
    />
  );

  if (phase === "loading") {
    return emptyState;
  }

  if (phase === "studying" && queue.length === 0) {
    return emptyState;
  }

  if (phase === "done") {
    return (
      <StudySessionComplete
        stats={stats}
        deckName={deck.name}
        onStudyAgain={() => {
          setCurrentIndex(0);
          setFlipped(false);
          setStats(EMPTY_STATS);
          setPhase("studying");
        }}
        onDone={onClose}
      />
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Study session: ${deck.name}`}
      className="flex flex-col min-h-[calc(100vh-10rem)]"
    >

      <StudyHeader
        deckName={deck.name}
        progress={progress}
        currentIndex={currentIndex}
        queueLength={queue.length}
        showTip={showTip}
        onClose={onClose}
        onToggleTip={() => setShowTip((v) => !v)}
      />

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

        <StudyCenterCard
          currentCard={currentCard}
          levelLabel={levelLabel}
          firstMeaning={firstMeaning}
          firstDef={firstDef}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          onSkip={handleSkip}
        />

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
