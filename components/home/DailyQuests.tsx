"use client";

import { useEffect, useState } from "react";
import { getTodayProgress } from "@/lib/db";
import type { DailyProgress } from "@/lib/types";

// ── Quest definitions ──────────────────────────────────────────────────────────

interface QuestDef {
  id: string;
  icon: string;
  label: string;
  description: string;
  target: number;
  getValue: (p: DailyProgress | undefined, stats: SessionStats) => number;
  unit?: string;
}

interface SessionStats {
  minutesLearned: number;
  streakInRow: number;
  lessonsCompleted: number;
}

const QUEST_POOL: QuestDef[] = [
  {
    id: "earn-xp-50",
    icon: "⚡",
    label: "Earn 50 XP",
    description: "Earn 50 XP today through any activity",
    target: 50,
    getValue: (p) => Math.min(p?.xp ?? 0, 50),
  },
  {
    id: "time-15min",
    icon: "⏱️",
    label: "Spend 15 minutes learning",
    description: "Study for at least 15 minutes today",
    target: 15,
    getValue: (_p, s) => Math.min(s.minutesLearned, 15),
    unit: "min",
  },
  {
    id: "streak-5-lessons",
    icon: "🎯",
    label: "5-in-a-row in 5 lessons",
    description: "Get 5 correct answers in a row across 5 lessons",
    target: 5,
    getValue: (_p, s) => Math.min(s.streakInRow, 5),
  },
  {
    id: "attempts-10",
    icon: "🔁",
    label: "10 pronunciation attempts",
    description: "Record your pronunciation 10 times today",
    target: 10,
    getValue: (p) => Math.min(p?.totalAttempts ?? 0, 10),
  },
  {
    id: "accuracy-80",
    icon: "🏆",
    label: "Reach 80% accuracy",
    description: "Maintain an average accuracy above 80%",
    target: 80,
    getValue: (p) => Math.min(p?.averageAccuracy ?? 0, 80),
    unit: "%",
  },
  {
    id: "words-5",
    icon: "📖",
    label: "Study 5 new words",
    description: "Practice 5 different words today",
    target: 5,
    getValue: (p) => Math.min(p?.wordsStudied?.length ?? 0, 5),
  },
  {
    id: "correct-8",
    icon: "✅",
    label: "8 correct answers",
    description: "Get 8 correct pronunciation answers today",
    target: 8,
    getValue: (p) => Math.min(p?.correctAttempts ?? 0, 8),
  },
  {
    id: "lessons-3",
    icon: "📚",
    label: "Complete 3 lessons",
    description: "Finish at least 3 practice lessons today",
    target: 3,
    getValue: (_p, s) => Math.min(s.lessonsCompleted, 3),
  },
  {
    id: "earn-xp-100",
    icon: "🚀",
    label: "Earn 100 XP",
    description: "Push hard and earn 100 XP in a single day",
    target: 100,
    getValue: (p) => Math.min(p?.xp ?? 0, 100),
  },
  {
    id: "words-10",
    icon: "🌟",
    label: "Study 10 different words",
    description: "Explore 10 distinct words in your sessions",
    target: 10,
    getValue: (p) => Math.min(p?.wordsStudied?.length ?? 0, 10),
  },
];

// ── Daily rotation (seeded by date) ───────────────────────────────────────────

function getDailyQuests(): QuestDef[] {
  const today = new Date().toISOString().split("T")[0]; // "2026-04-10"
  // Simple numeric hash from the date string
  let seed = 0;
  for (let i = 0; i < today.length; i++) {
    seed = (seed * 31 + today.charCodeAt(i)) >>> 0;
  }

  // Always include the 3 "required" quests (indices 0-2) and pick 2 random ones
  const required = QUEST_POOL.slice(0, 3);
  const optional = QUEST_POOL.slice(3);

  const picked: QuestDef[] = [];
  const available = [...optional];
  let s = seed;
  while (picked.length < 2 && available.length > 0) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const idx = s % available.length;
    picked.push(available[idx]);
    available.splice(idx, 1);
  }

  return [...required, ...picked];
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function DailyQuests() {
  const [progress, setProgress] = useState<DailyProgress | undefined>();
  const [sessionStats] = useState<SessionStats>({
    minutesLearned: 0,
    streakInRow: 0,
    lessonsCompleted: 0,
  });
  const [quests] = useState<QuestDef[]>(() => getDailyQuests());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getTodayProgress().then((p) => {
      setProgress(p);
      setLoaded(true);
    });
  }, []);

  const completed = quests.filter(
    (q) => q.getValue(progress, sessionStats) >= q.target
  ).length;

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg font-bold text-[var(--deep-text)] tracking-tight">
          Daily Quests
        </h2>
        <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--surface-raised)] text-[var(--mid-text)]">
          {loaded ? `${completed}/${quests.length}` : "–"} done
        </span>
      </div>

      {/* Quest list */}
      <div className="flex flex-col gap-2.5">
        {quests.map((quest) => {
          const current = loaded ? quest.getValue(progress, sessionStats) : 0;
          const pct = Math.min((current / quest.target) * 100, 100);
          const done = pct >= 100;

          return (
            <div
              key={quest.id}
              className={`relative overflow-hidden rounded-2xl px-4 py-3.5 transition-all duration-300 ${
                done
                  ? "bg-[var(--surface-raised)] opacity-80"
                  : "bg-[var(--surface-raised)]"
              }`}
              style={{
                boxShadow: done
                  ? "none"
                  : "0 1px 3px var(--line-divider)",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Icon / checkmark */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-all duration-300 ${
                    done
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--surface-base)] text-[var(--mid-text)]"
                  }`}
                >
                  {done ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    quest.icon
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[13px] font-semibold leading-snug ${
                      done
                        ? "line-through text-[var(--mid-text)]"
                        : "text-[var(--deep-text)]"
                    }`}
                  >
                    {quest.label}
                  </p>

                  {/* Progress bar */}
                  {!done && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--line-divider)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-[var(--mid-text)] tabular-nums flex-shrink-0">
                        {loaded ? current : 0}
                        {quest.unit ?? ""} / {quest.target}
                        {quest.unit ?? ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* XP reward badge */}
                {done && (
                  <span className="text-[11px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    Done!
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer reset note */}
      <p className="mt-3 text-[11px] text-[var(--mid-text)] text-right">
        Resets at midnight · New quests tomorrow
      </p>
    </section>
  );
}
