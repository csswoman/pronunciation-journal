"use client";

import Button from "@/components/ui/Button";
import { H2 } from "@/components/ui/Typography";
import { RATING_CONFIG } from "./study-utils";

interface SessionStats {
  seen: number;
  again: number;
  hard: number;
  easy: number;
  newlyMastered: number;
}

interface StudySessionCompleteProps {
  stats: SessionStats;
  deckName: string;
  onStudyAgain: () => void;
  onDone: () => void;
}

export function StudySessionComplete({
  stats,
  deckName,
  onStudyAgain,
  onDone,
}: StudySessionCompleteProps) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      <div
        className="max-w-sm w-full rounded-2xl border p-8 text-center space-y-5"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--line-divider)" }}
      >
        <div className="text-5xl">🎉</div>
        <div>
          <H2 className="text-h2">Session complete!</H2>
          <p className="text-sm mt-1 text-fg-muted">
            You reviewed <strong>{stats.seen}</strong> card{stats.seen !== 1 ? "s" : ""} from{" "}
            <strong>{deckName}</strong>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            { val: stats.again, label: "hard", cfg: RATING_CONFIG.again },
            { val: stats.hard, label: "medium", cfg: RATING_CONFIG.hard },
            { val: stats.easy, label: "easy", cfg: RATING_CONFIG.easy },
          ].map(({ val, label, cfg }) => (
            <div
              key={label}
              className="rounded-xl p-3"
              style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <div className="text-lg font-bold" style={{ color: cfg.color }}>
                {val}
              </div>
              <div className="text-xs" style={{ color: cfg.color }}>
                {label}
              </div>
            </div>
          ))}
        </div>
        {stats.newlyMastered > 0 && (
          <p className="text-sm text-fg-muted">
            ⭐ {stats.newlyMastered} card{stats.newlyMastered !== 1 ? "s" : ""} mastered
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="primary"
            className="flex-1 py-2.5"
            onClick={onStudyAgain}
          >
            Study again
          </Button>
          <Button variant="outline" className="flex-1 py-2.5" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
