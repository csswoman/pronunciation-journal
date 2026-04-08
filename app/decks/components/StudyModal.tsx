"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, Volume2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;
type Entry = Tables<"entries">;

interface StudyModalProps {
  deck: Deck;
  onClose: () => void;
}

export function StudyModal({ deck, onClose }: StudyModalProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<"loading" | "studying" | "done">("loading");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [queue, setQueue] = useState<Entry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Fetch entries on mount
  useEffect(() => {
    const loadEntries = async () => {
      if (!user) return;
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("deck_entries")
        .select("entry_id, entries(*)")
        .eq("deck_id", deck.id);

      const loaded = (data ?? []).map((r: any) => r.entries).filter(Boolean) as Entry[];
      setEntries(loaded);

      // Shuffle queue
      const shuffled = [...loaded].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
      setPhase("studying");
    };

    loadEntries();
  }, [deck.id, user]);

  const currentEntry = queue[currentIndex];
  const progress = currentIndex + 1;
  const total = queue.length;

  const handleDifficulty = useCallback(
    async (difficulty: "again" | "hard" | "good" | "easy") => {
      if (!user || !currentEntry) return;

      const supabase = getSupabaseBrowserClient();

      // Record answer in answer_history (using a placeholder exercise_type_id of 1)
      await supabase.from("answer_history").insert({
        user_id: user.id,
        sound_id: currentEntry.sound_id ?? undefined,
        exercise_type_id: 1, // placeholder: deck flashcard
        is_correct: difficulty === "good" || difficulty === "easy",
        user_answer: currentEntry.word,
        target_word: currentEntry.word,
        time_ms: 0,
        answered_at: new Date().toISOString(),
      });

      // Advance to next card
      if (currentIndex + 1 >= queue.length) {
        setPhase("done");
      } else {
        setCurrentIndex(prev => prev + 1);
        setFlipped(false);
      }
    },
    [user, currentEntry, currentIndex, queue.length]
  );

  const handlePlayAudio = () => {
    // Placeholder for audio playback
    // In full implementation, use Web Audio API or TTS
    console.log("Play audio for:", currentEntry?.word);
  };

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--page-bg)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[var(--btn-regular-bg)] animate-pulse mx-auto" />
          <p className="text-sm text-[var(--text-secondary)]">Loading words…</p>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--page-bg)] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] p-6 text-center space-y-4">
          <h2 className="text-2xl font-bold text-[var(--deep-text)]">Session Complete! 🎉</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            You studied {total} word{total !== 1 ? "s" : ""} from <strong>{deck.name}</strong>
          </p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setFlipped(false);
                setPhase("studying");
              }}
              className="flex-1 py-2.5 bg-[var(--primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-colors"
            >
              Study Again
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-[var(--btn-regular-bg)] text-[var(--deep-text)] font-semibold rounded-xl hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line-divider)]">
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--deep-text)]">{deck.name}</p>
          <p className="text-xs text-[var(--text-tertiary)]">
            {progress} / {total}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--line-divider)]">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-300"
          style={{ width: `${(progress / total) * 100}%` }}
        />
      </div>

      {/* Flashcard area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {currentEntry && (
          <div
            className="w-full max-w-sm cursor-pointer perspective"
            onClick={() => setFlipped(!flipped)}
            style={{
              perspective: "1000px",
            }}
          >
            <div
              className="relative w-full aspect-[3/4] bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] p-6 flex flex-col items-center justify-center shadow-lg transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front */}
              {!flipped && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center">
                  <div>
                    <p className="text-4xl font-bold text-[var(--deep-text)] mb-2">{currentEntry.word}</p>
                    {currentEntry.ipa && (
                      <p className="text-lg text-[var(--text-secondary)]">/{currentEntry.ipa}/</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAudio();
                    }}
                    className="p-3 rounded-full bg-[var(--btn-regular-bg)] text-[var(--primary)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
                  >
                    <Volume2 size={24} />
                  </button>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">Click to reveal meaning</p>
                </div>
              )}

              {/* Back */}
              {flipped && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center" style={{ transform: "rotateY(180deg)" }}>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">{currentEntry.word}</p>
                  {currentEntry.meanings && Array.isArray(currentEntry.meanings) && currentEntry.meanings.length > 0 && (
                    <div>
                      {typeof currentEntry.meanings[0] === "object" && currentEntry.meanings[0] !== null && "definitions" in currentEntry.meanings[0] && Array.isArray((currentEntry.meanings[0] as any).definitions) && (
                        <>
                          <p className="text-base font-semibold text-[var(--deep-text)]">
                            {(currentEntry.meanings[0] as any).definitions[0]?.definition || "No definition"}
                          </p>
                          {(currentEntry.meanings[0] as any).definitions[0]?.example && (
                            <p className="text-xs text-[var(--text-tertiary)] mt-2 italic">
                              "{(currentEntry.meanings[0] as any).definitions[0].example}"
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {currentEntry.phrases && currentEntry.phrases.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Phrases:</p>
                      {currentEntry.phrases.slice(0, 2).map((phrase, i) => (
                        <p key={i} className="text-sm text-[var(--deep-text)] italic mb-1">
                          "{phrase}"
                        </p>
                      ))}
                      {currentEntry.phrases.length > 2 && (
                        <p className="text-xs text-[var(--text-tertiary)]">
                          +{currentEntry.phrases.length - 2} more
                        </p>
                      )}
                    </div>
                  )}
                  {currentEntry.ipa && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-2">/{currentEntry.ipa}/</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Difficulty buttons */}
      <div className="px-4 py-4 border-t border-[var(--line-divider)] flex gap-2">
        <button
          onClick={() => handleDifficulty("again")}
          className="flex-1 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold rounded-xl hover:opacity-90 transition-colors text-sm"
        >
          Again
        </button>
        <button
          onClick={() => handleDifficulty("hard")}
          className="flex-1 py-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold rounded-xl hover:opacity-90 transition-colors text-sm"
        >
          Hard
        </button>
        <button
          onClick={() => handleDifficulty("good")}
          className="flex-1 py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold rounded-xl hover:opacity-90 transition-colors text-sm"
        >
          Good
        </button>
        <button
          onClick={() => handleDifficulty("easy")}
          className="flex-1 py-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold rounded-xl hover:opacity-90 transition-colors text-sm"
        >
          Easy
        </button>
      </div>
    </div>
  );
}
