"use client";

import Link from "next/link";
import { Trophy, Check, ChevronRight } from "lucide-react";
import Card from "@/components/layout/Card";
import CardHeader from "@/components/ui/CardHeader";
import ProgressBar from "@/components/ui/ProgressBar";
import type { Achievement } from "@/lib/home-stats";

interface HomeAchievementsCardProps {
  achievements?: Achievement[];
}

export default function HomeAchievementsCard({ achievements = [] }: HomeAchievementsCardProps) {
  const displayAchievements = achievements.slice(0, 3);
  return (
    <Card variant="compact" className="gap-4">
      <CardHeader
        icon={<Trophy size={17} className="text-warning" />}
        title="Achievements"
        right={
          <Link href="/progress" className="text-sm font-medium text-[var(--primary)] hover:underline">
            View all
          </Link>
        }
      />

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
                      <ProgressBar value={progressPercent} height="xs" className="flex-1" />
                      <span className="text-tiny tabular-nums font-medium text-[var(--text-tertiary)]">
                        {a.progress}/{a.target}
                      </span>
                    </div>
                  )}
                </div>
                {isUnlocked && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--primary)] shrink-0">
                    <Check size={12} strokeWidth={3} className="text-on-primary" />
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
    </Card>
  );
}

