"use client";

import Link from "next/link";
import { Trophy, Check, ChevronRight } from "lucide-react";
import type { Achievement } from "@/lib/home-stats";

interface HomeAchievementsCardProps {
  achievements?: Achievement[];
}

export default function HomeAchievementsCard({ achievements = [] }: HomeAchievementsCardProps) {
  const displayAchievements = achievements.slice(0, 3);
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
        {displayAchievements.length > 0 ? (
          displayAchievements.map((a) => {
            const isUnlocked = !!a.unlockedAt;
            const progressPercent = a.progress && a.target ? (a.progress / a.target) * 100 : 0;
            return (
              <div key={a.id} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                  style={{
                    background: isUnlocked ? "color-mix(in oklch, var(--primary) 15%, transparent)" : "var(--btn-regular-bg)",
                  }}
                >
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--deep-text)]">{a.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{a.description}</p>
                  {!isUnlocked && a.progress !== undefined && a.target && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-[var(--btn-regular-bg)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
                          style={{ width: `${Math.round(progressPercent)}%` }}
                        />
                      </div>
                      <span className="text-[11px] tabular-nums font-medium text-[var(--text-tertiary)]">
                        {a.progress}/{a.target}
                      </span>
                    </div>
                  )}
                </div>
                {isUnlocked && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--primary)] shrink-0">
                    <Check size={12} strokeWidth={3} className="text-white" />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
            Start learning to unlock achievements!
          </p>
        )}
      </div>

      {achievements.length > 3 && (
        <Link
          href="/progress"
          className="flex items-center justify-between text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors border-t border-[var(--line-divider)] pt-3"
        >
          <span>+{achievements.length - 3} more achievements</span>
          <ChevronRight size={15} />
        </Link>
      )}
    </div>
  );
}
