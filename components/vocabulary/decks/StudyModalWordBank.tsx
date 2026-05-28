"use client";

// Planned structure:
// <StudyModalWordBank>
//   <StudyLoadingScreen />   — while loading cards
//   <StudyEmptyScreen />     — no cards due
//   <StudyDoneScreen />      — session complete
//   <StudySessionHeader />   — back button + progress bar
//   <StudySessionCard />     — flashcard with 3D flip
//   <StudyRatingBar />       — rate again / hard / easy
// </StudyModalWordBank>

import { StudySessionHeader } from "./StudySessionHeader";
import { StudySessionCard } from "./StudySessionCard";
import { StudyRatingBar } from "./StudyRatingBar";
import { StudyLoadingScreen, StudyEmptyScreen, StudyDoneScreen } from "./StudySessionScreens";
import { useStudySession, toProgressCompat } from "./hooks/useStudySession";
import type { StudySource } from "@/lib/decks/study-source";

interface StudyModalWordBankProps {
  source: StudySource;
  onClose: () => void;
}

export function StudyModalWordBank({ source, onClose }: StudyModalWordBankProps) {
  const {
    phase, queue, currentIndex, currentCard, flipped, stats, progress,
    setFlipped, handleRate, advanceCard, resetSession,
  } = useStudySession(source);

  if (phase === "loading") return <StudyLoadingScreen />;
  if (phase === "studying" && queue.length === 0) {
    return <StudyEmptyScreen label={source.label} onClose={onClose} />;
  }
  if (phase === "done") {
    return (
      <StudyDoneScreen
        stats={stats}
        label={source.label}
        onClose={onClose}
        onStudyAgain={resetSession}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)]">
      <StudySessionHeader
        label={source.label}
        currentIndex={currentIndex}
        total={queue.length}
        progress={progress}
        onClose={onClose}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-2 min-h-0">
        {currentCard && (
          <StudySessionCard
            card={currentCard}
            flipped={flipped}
            onFlip={() => setFlipped(f => !f)}
            onSkip={advanceCard}
          />
        )}
        {!flipped && (
          <p className="mt-3 text-xs text-fg-subtle">
            Hint: Press{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-[var(--btn-regular-bg)] text-tiny font-mono">
              SPACE
            </kbd>
            {" "}to flip
          </p>
        )}
      </div>

      <StudyRatingBar
        flipped={flipped}
        progress={toProgressCompat(currentCard?.progress ?? null)}
        onRate={key => void handleRate(key)}
      />
    </div>
  );
}
