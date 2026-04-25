"use client";

import Link from "next/link";
import { Flame, Check, TrendingUp } from "lucide-react";
import Card from "@/components/layout/Card";
import CardHeader from "@/components/ui/CardHeader";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

interface HomeStreakCardProps {
  streak?: number;
  activeDays?: boolean[];
}

export default function HomeStreakCard({
  streak = 0,
  activeDays = [false, false, false, false, false, false, false],
}: HomeStreakCardProps) {
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ * (1 - Math.min(streak / 7, 1));

  return (
    <Card variant="compact" className="gap-5">
      <CardHeader
        icon={<Flame size={18} className="text-orange-400" />}
        title="Your Streak"
        right={
          <Link href="/progress" className="text-sm font-medium text-[var(--primary)] hover:underline">
            Keep it up!
          </Link>
        }
      />

      {/* Ring + days */}
      <div className="flex items-center gap-6">
        {/* Circular ring */}
        <div className="relative shrink-0 w-[100px] h-[100px]">
          <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
            <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--btn-regular-bg)" strokeWidth="8" />
            <circle
              cx="48" cy="48" r={radius} fill="none"
              stroke="var(--primary)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-[var(--deep-text)] leading-none">{streak}</span>
            <span className="text-xs text-[var(--text-tertiary)] mt-0.5">days</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <TrendingUp size={14} className="text-[var(--primary)] shrink-0" />
          {streak >= 7
            ? `${streak} days strong! You're building an amazing habit.`
            : streak > 0
              ? `${streak} day${streak > 1 ? "s" : ""} going — keep the momentum!`
              : "Start your streak today!"}
        </div>
      </div>

      <div className="flex gap-2 flex-1 justify-between">
        {DAYS.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-medium text-[var(--text-tertiary)]">{d}</span>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                activeDays[i] ? "bg-[var(--primary)] text-white" : "bg-[var(--btn-regular-bg)] text-[var(--text-tertiary)]"
              }`}
            >
              {activeDays[i] && <Check size={13} strokeWidth={3} />}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
