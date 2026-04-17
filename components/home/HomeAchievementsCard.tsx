"use client";

import Link from "next/link";
import { Trophy, Check, ChevronRight, Star, Flame, BookOpen } from "lucide-react";

interface Achievement {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  progress?: number;
  completed?: boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-steps",
    icon: <Star size={16} />,
    title: "First Steps",
    description: "Complete your first lesson",
    completed: true,
  },
  {
    id: "consistent-learner",
    icon: <Flame size={16} />,
    title: "Consistent Learner",
    description: "Reach a 7-day streak",
    completed: true,
  },
  {
    id: "lesson-master",
    icon: <BookOpen size={16} />,
    title: "Lesson Master",
    description: "Complete 20 lessons",
    progress: 0.6,
  },
];

export default function HomeAchievementsCard() {
  return (
    <div className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={17} className="text-amber-400" />
          <span className="text-base font-semibold text-[var(--deep-text)]">Achievements</span>
        </div>
        <Link href="/progress" className="text-sm font-medium text-[var(--primary)] hover:underline">
          View all
        </Link>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.id} className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: a.completed ? "color-mix(in oklch, var(--primary) 15%, transparent)" : "var(--btn-regular-bg)",
                color: a.completed ? "var(--primary)" : "var(--text-tertiary)",
              }}
            >
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--deep-text)]">{a.title}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{a.description}</p>
              {!a.completed && typeof a.progress === "number" && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-[var(--btn-regular-bg)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
                      style={{ width: `${Math.round(a.progress * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] tabular-nums font-medium text-[var(--text-tertiary)]">
                    {Math.round(a.progress * 100)}%
                  </span>
                </div>
              )}
            </div>
            {a.completed && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--primary)] shrink-0">
                <Check size={12} strokeWidth={3} className="text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      <Link
        href="/progress"
        className="flex items-center justify-between text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors border-t border-[var(--line-divider)] pt-3"
      >
        <span>+3 more achievements</span>
        <ChevronRight size={15} />
      </Link>
    </div>
  );
}
