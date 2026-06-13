"use client";

import Button from "@/components/ui/Button";
import { H2 } from "@/components/ui/Typography";
import { RATING_CONFIG } from "./study-utils";
import type { DifficultyKey } from "./StudyDifficultyButtons";
import type { SessionStats } from "./hooks/useStudySession";
import { WordCarousel } from "@/components/practice/session/WordCarousel";
import { useLoadingWords } from "@/hooks/useLoadingWords";

// ── Shared layout ────────────────────────────────────────────────────────────

function CenteredOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      {children}
    </div>
  );
}

// ── Loading ──────────────────────────────────────────────────────────────────

export function StudyLoadingScreen() {
  const words = useLoadingWords();
  return (
    <CenteredOverlay>
      <WordCarousel words={words} />
    </CenteredOverlay>
  );
}

// ── Empty ────────────────────────────────────────────────────────────────────

interface StudyEmptyScreenProps {
  label: string;
  onClose: () => void;
}

export function StudyEmptyScreen({ label, onClose }: StudyEmptyScreenProps) {
  return (
    <CenteredOverlay>
      <div className="max-w-sm w-full rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-8 text-center space-y-5">
        <div className="text-5xl">🎉</div>
        <H2 className="text-h4">All caught up!</H2>
        <p className="text-sm text-fg-muted">
          No cards due in <strong>{label}</strong>.
        </p>
        <Button variant="primary" fullWidth onClick={onClose}>Done</Button>
      </div>
    </CenteredOverlay>
  );
}

// ── Done ─────────────────────────────────────────────────────────────────────

const STAT_LABELS: Record<DifficultyKey, string> = {
  again: "hard",
  hard: "medium",
  easy: "easy",
};

const STAT_KEYS: DifficultyKey[] = ["again", "hard", "easy"];

interface StudyDoneScreenProps {
  stats: SessionStats;
  label: string;
  onClose: () => void;
  onStudyAgain: () => void;
}

export function StudyDoneScreen({ stats, label, onClose, onStudyAgain }: StudyDoneScreenProps) {
  return (
    <CenteredOverlay>
      <div className="max-w-sm w-full rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-8 text-center space-y-5">
        <div className="text-5xl">🎉</div>
        <div>
          <H2 className="text-h2">Session complete!</H2>
          <p className="text-sm mt-1 text-fg-muted">
            You reviewed <strong>{stats.seen}</strong> card{stats.seen !== 1 ? "s" : ""} from{" "}
            <strong>{label}</strong>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {STAT_KEYS.map(key => {
            const cfg = RATING_CONFIG[key];
            const val = stats[key];
            return (
              <div
                key={key}
                className="rounded-xl p-3"
                style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <div className="text-lg font-bold" style={{ color: cfg.color }}>{val}</div>
                <div className="text-xs" style={{ color: cfg.color }}>{STAT_LABELS[key]}</div>
              </div>
            );
          })}
        </div>
        {stats.newlyMastered > 0 && (
          <p className="text-sm text-fg-muted">
            ⭐ {stats.newlyMastered} card{stats.newlyMastered !== 1 ? "s" : ""} mastered
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="primary" className="flex-1 py-2.5" onClick={onStudyAgain}>
            Study again
          </Button>
          <Button variant="outline" className="flex-1 py-2.5" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </CenteredOverlay>
  );
}
