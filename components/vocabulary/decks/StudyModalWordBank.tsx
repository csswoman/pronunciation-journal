"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ChevronLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import { H2 } from "@/components/ui/Typography";
import { RATING_CONFIG, previewInterval, blankOutWord, speakWord } from "./study-utils";
import type { DifficultyKey } from "./StudyDifficultyButtons";
import type { StudySource, StudyCardData, SM2Progress } from "@/lib/decks/study-source";

// previewInterval expects deck_entry_progress shape — we satisfy it structurally
function toProgressCompat(p: SM2Progress | null) {
  if (!p) return null;
  return {
    ease_factor: p.ease_factor,
    interval_days: p.interval_days,
    repetitions: p.repetitions,
    next_review_at: p.next_review_at ?? new Date().toISOString(),
    status: p.status as "new" | "learning" | "review" | "mastered",
    last_reviewed_at: p.last_reviewed_at,
    // required by Progress type but not used by previewInterval
    id: "", user_id: "", entry_id: "", created_at: "", updated_at: "",
  };
}

interface SessionStats {
  seen: number;
  again: number;
  hard: number;
  easy: number;
  newlyMastered: number;
}

const EMPTY_STATS: SessionStats = { seen: 0, again: 0, hard: 0, easy: 0, newlyMastered: 0 };

interface StudyModalWordBankProps {
  source: StudySource;
  onClose: () => void;
}

export function StudyModalWordBank({ source, onClose }: StudyModalWordBankProps) {
  const [phase, setPhase] = useState<"loading" | "studying" | "done">("loading");
  const [queue, setQueue] = useState<StudyCardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState<SessionStats>(EMPTY_STATS);

  useEffect(() => {
    source.loadCards().then(cards => {
      setQueue(cards);
      setPhase("studying");
    }).catch(err => {
      console.error("[StudyModalWordBank] load error:", err);
      setPhase("studying");
    });
  }, [source]);

  const currentCard = queue[currentIndex];

  const advanceCard = useCallback(() => {
    if (currentIndex + 1 >= queue.length) {
      setPhase("done");
    } else {
      setCurrentIndex(p => p + 1);
      setFlipped(false);
    }
  }, [currentIndex, queue.length]);

  const handleRate = useCallback(async (difficulty: DifficultyKey) => {
    if (!currentCard) return;
    const q = RATING_CONFIG[difficulty].q;
    const next = await source.saveProgress(currentCard.id, q, currentCard.progress);
    setQueue(prev => prev.map(c => c.id === currentCard.id ? { ...c, progress: next } : c));
    setStats(s => ({
      seen: s.seen + 1,
      again: difficulty === "again" ? s.again + 1 : s.again,
      hard: difficulty === "hard" ? s.hard + 1 : s.hard,
      easy: difficulty === "easy" ? s.easy + 1 : s.easy,
      newlyMastered: next.status === "mastered" ? s.newlyMastered + 1 : s.newlyMastered,
    }));
    advanceCard();
  }, [currentCard, source, advanceCard]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== "studying") return;
      if (e.code === "Space") { e.preventDefault(); setFlipped(f => !f); }
      if (flipped) {
        if (e.key === "1") void handleRate("again");
        if (e.key === "2") void handleRate("hard");
        if (e.key === "3") void handleRate("easy");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, flipped, handleRate]);

  const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

  const centeredOverlay = (children: React.ReactNode) => (
    <div className="flex flex-col min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      {children}
    </div>
  );

  if (phase === "loading") {
    return centeredOverlay(
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
    );
  }

  if (phase === "studying" && queue.length === 0) {
    return centeredOverlay(
      <div className="max-w-sm w-full rounded-2xl border p-8 text-center space-y-5"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--line-divider)" }}>
        <div className="text-5xl">🎉</div>
        <H2 className="text-h4">All caught up!</H2>
        <p className="text-sm text-fg-muted">No cards due in <strong>{source.label}</strong>.</p>
        <Button variant="primary" fullWidth onClick={onClose}>Done</Button>
      </div>
    );
  }

  if (phase === "done") {
    return centeredOverlay(
      <div className="max-w-sm w-full rounded-2xl border p-8 text-center space-y-5"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--line-divider)" }}>
        <div className="text-5xl">🎉</div>
        <div>
          <H2 className="text-h2">Session complete!</H2>
          <p className="text-sm mt-1 text-fg-muted">
            You reviewed <strong>{stats.seen}</strong> card{stats.seen !== 1 ? "s" : ""} from <strong>{source.label}</strong>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {(["again", "hard", "easy"] as DifficultyKey[]).map(key => {
            const cfg = RATING_CONFIG[key];
            const val = stats[key === "again" ? "again" : key === "hard" ? "hard" : "easy"];
            const label = key === "again" ? "hard" : key === "hard" ? "medium" : "easy";
            return (
              <div key={key} className="rounded-xl p-3"
                style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <div className="text-lg font-bold" style={{ color: cfg.color }}>{val}</div>
                <div className="text-xs" style={{ color: cfg.color }}>{label}</div>
              </div>
            );
          })}
        </div>
        {stats.newlyMastered > 0 && (
          <p className="text-sm text-fg-muted">⭐ {stats.newlyMastered} card{stats.newlyMastered !== 1 ? "s" : ""} mastered</p>
        )}
        <div className="flex gap-2">
          <Button variant="primary" className="flex-1 py-2.5"
            onClick={() => { setCurrentIndex(0); setFlipped(false); setStats(EMPTY_STATS); setPhase("studying"); }}>
            Study again
          </Button>
          <Button variant="outline" className="flex-1 py-2.5" onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <Button variant="ghost" size="icon" onClick={onClose} title="Back">
          <ChevronLeft size={20} />
        </Button>
        <span className="font-semibold text-sm shrink-0 text-fg">{source.label}</span>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--btn-regular-bg)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: "var(--warning)" }} />
        </div>
        <span className="text-xs font-mono shrink-0 text-fg-subtle">
          {currentIndex + 1}/{queue.length}
        </span>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-2 min-h-0">
        {currentCard && (
          <WordBankStudyCard
            card={currentCard}
            flipped={flipped}
            onFlip={() => setFlipped(f => !f)}
            onSkip={advanceCard}
          />
        )}
        {!flipped && (
          <p className="mt-3 text-xs text-fg-subtle">
            Hint: Press{" "}
            <kbd className="px-1.5 py-0.5 rounded border text-tiny font-mono"
              style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)" }}>
              SPACE
            </kbd>
            {" "}to flip
          </p>
        )}
      </div>

      {/* Rating bar */}
      <div className="border-t px-4 py-3" style={{ borderColor: "var(--line-divider)" }}>
        {!flipped && (
          <p className="text-center text-xs mb-3 text-fg-subtle">Rate after seeing the answer</p>
        )}
        <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto">
          {(Object.entries(RATING_CONFIG) as [DifficultyKey, typeof RATING_CONFIG[DifficultyKey]][]).map(([key, cfg]) => {
            const timeLabel = previewInterval(toProgressCompat(currentCard?.progress ?? null), cfg.q);
            return (
              <button
                key={key}
                onClick={() => flipped && void handleRate(key)}
                disabled={!flipped}
                className="flex flex-col items-center gap-0.5 py-3 px-2 rounded-2xl border transition-all active:scale-95"
                style={flipped ? {
                  backgroundColor: cfg.bg, borderColor: cfg.border, cursor: "pointer", opacity: 1,
                } : {
                  backgroundColor: "var(--btn-regular-bg)", borderColor: "var(--line-divider)", cursor: "not-allowed", opacity: 0.7,
                }}
              >
                {flipped ? (
                  <span className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                ) : (
                  <span style={{ color: "var(--text-tertiary)", fontSize: 15 }}>🔒</span>
                )}
                <span className="text-xs" style={{ color: flipped ? cfg.color : "var(--text-tertiary)" }}>{cfg.sublabel}</span>
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

// ── Flashcard component ──────────────────────────────────────────────────────

function WordBankStudyCard({
  card, flipped, onFlip, onSkip,
}: {
  card: StudyCardData;
  flipped: boolean;
  onFlip: () => void;
  onSkip: () => void;
}) {
  const cardFace = (content: React.ReactNode, isBack = false) => (
    <div
      style={{
        backfaceVisibility: "hidden",
        transform: isBack ? "rotateY(180deg)" : undefined,
        backgroundColor: "var(--card-bg)",
        borderRadius: 16,
        border: "1px solid var(--line-divider)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="flex items-center justify-end px-4 pt-4 pb-0">
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onSkip(); }}
          title="Skip"
          style={{
            background: "none", border: "1px solid var(--line-divider)", borderRadius: 8,
            padding: "4px 8px", fontSize: 12, color: "var(--text-tertiary)", cursor: "pointer",
          }}
        >
          Skip →
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center space-y-4">
        {content}
      </div>
    </div>
  );

  const wordDisplay = (
    <>
      <H2 className="text-5xl font-bold italic leading-none"
        style={{ fontFamily: "var(--font-serif, serif)", color: "var(--text-primary)" }}>
        {card.front}
      </H2>
      {card.ipa && (
        <div className="flex items-center gap-2 justify-center">
          <span className="text-base text-fg-muted">/{card.ipa}/</span>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); speakWord(card.front); }}
            style={{ background: "none", border: "1px solid var(--line-divider)", borderRadius: 8, padding: "3px 8px", fontSize: 12, cursor: "pointer" }}
          >
            🔊
          </button>
        </div>
      )}
      <div className="w-full border-t border-dashed" style={{ borderColor: "var(--line-divider)" }} />
    </>
  );

  return (
    <button
      type="button"
      style={{ perspective: "1000px" }}
      className="w-full max-w-sm cursor-pointer select-none text-left"
      onClick={onFlip}
      aria-label={flipped ? "Flip card to front" : "Flip card to see answer"}
    >
      <div style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        position: "relative",
        minHeight: 280,
      }}>
        {cardFace(
          <>
            {wordDisplay}
            {card.example ? (
              <div className="rounded-xl border border-dashed p-3 w-full text-left"
                style={{ borderColor: "var(--line-divider)" }}>
                <p className="text-tiny font-semibold uppercase tracking-widest mb-1 text-fg-subtle">Fill in the blank</p>
                <p className="text-xs italic leading-relaxed text-fg-muted">
                  &ldquo;{blankOutWord(card.example, card.front)}&rdquo;
                </p>
              </div>
            ) : (
              <p className="text-sm italic text-fg-subtle">Think of the meaning before flipping</p>
            )}
          </>
        )}
        {cardFace(
          <>
            {wordDisplay}
            <div className="w-full space-y-3 text-left">
              {card.definition && (
                <p className="text-sm leading-snug text-fg">{card.definition}</p>
              )}
              {card.example && (
                <div className="rounded-xl border border-dashed p-3" style={{ borderColor: "var(--line-divider)" }}>
                  <p className="text-tiny font-semibold uppercase tracking-widest mb-1 text-fg-subtle">Example</p>
                  <p className="text-xs italic leading-relaxed text-fg-muted">&ldquo;{card.example}&rdquo;</p>
                </div>
              )}
            </div>
          </>,
          true
        )}
      </div>
    </button>
  );
}
