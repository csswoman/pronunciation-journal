"use client";

import { ArrowRight } from "lucide-react";
import type { UserSoundProgressWithSound } from "@/lib/phoneme-practice/types";

type Priority = "HIGH" | "MED" | "LOW";

const PRIORITY_COLORS: Record<Priority, string> = {
  HIGH: "oklch(0.65 0.18 30)",
  MED: "oklch(0.72 0.16 70)",
  LOW: "oklch(0.68 0.14 140)",
};

function getPriority(accuracy: number): Priority {
  if (accuracy < 50) return "HIGH";
  if (accuracy < 75) return "MED";
  return "LOW";
}

function getPracticeMinutes(priority: Priority): number {
  return priority === "HIGH" ? 15 : priority === "MED" ? 10 : 8;
}

function AttentionItem({
  rank,
  title,
  sub,
  priority,
  minutes,
}: {
  rank: number;
  title: string;
  sub: string;
  priority: Priority;
  minutes: number;
}) {
  const color = PRIORITY_COLORS[priority];
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid var(--line-divider)" }}>
      <span className="mt-0.5 w-5 shrink-0 text-xs font-bold tabular-nums" style={{ color: "var(--text-tertiary)" }}>
        {String(rank).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--deep-text)" }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{sub}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ background: `color-mix(in oklch, ${color} 15%, transparent)`, color }}
        >
          {priority}
        </span>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{minutes} min</span>
        <ArrowRight size={14} style={{ color: "var(--text-tertiary)" }} />
      </div>
    </div>
  );
}

interface Props {
  progressList: UserSoundProgressWithSound[];
  weeklyAccuracy: number;
}

export function NeedsAttention({ progressList, weeklyAccuracy }: Props) {
  // Derive weak sounds: practiced at least once, not mastered, sorted by accuracy asc
  const weakSounds = progressList
    .filter((p) => p.total_attempts > 0 && p.status !== "mastered")
    .map((p) => ({
      ...p,
      accuracy: p.total_attempts > 0 ? Math.round((p.correct_answers / p.total_attempts) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4);

  const hasData = weakSounds.length > 0;

  return (
    <div
      className="rounded-[26px] p-5"
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--line-divider)",
        boxShadow: "0 1px 3px var(--line-divider), 0 8px 20px var(--line-divider)",
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.26em]" style={{ color: "var(--primary)" }}>
        ✦ Needs Your Attention
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
        {hasData ? "Based on your sound practice history" : "Practice sounds to see insights here"}
      </p>
      <h3 className="mt-3 text-lg font-black" style={{ color: "var(--deep-text)" }}>
        {!hasData
          ? "Nothing to review yet."
          : weeklyAccuracy < 70
          ? "A few sounds are slowing you down."
          : "You're on the right track!"}
      </h3>

      {hasData ? (
        <div className="mt-1">
          {weakSounds.map((sound, i) => {
            const priority = getPriority(sound.accuracy);
            return (
              <AttentionItem
                key={sound.sound_id}
                rank={i + 1}
                title={`/${sound.sounds.ipa}/ sound`}
                sub={`${sound.sounds.example ?? ""} · ${sound.accuracy}% correct over ${sound.total_attempts} attempts`}
                priority={priority}
                minutes={getPracticeMinutes(priority)}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Complete phoneme exercises to get personalized attention items based on your weak spots.
          </p>
        </div>
      )}
    </div>
  );
}
