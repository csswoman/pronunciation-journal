"use client";

import Link from "next/link";
import { BarChart2, ArrowUpRight } from "lucide-react";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

interface HomeProgressCardProps {
  lessonsThisWeek?: number;
  weeklyChange?: number;
  barData?: number[];
}

export default function HomeProgressCard({
  lessonsThisWeek = 0,
  weeklyChange = 0,
  barData = [0.3, 0.5, 0.4, 0.8, 1, 0.6, 0.2],
}: HomeProgressCardProps) {
  const isPositive = weeklyChange >= 0;

  return (
    <div className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={17} className="text-[var(--primary)]" />
          <span className="text-base font-semibold text-[var(--deep-text)]">Your Progress</span>
        </div>
        <Link href="/progress" className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors">
          This week
        </Link>
      </div>

      <div className="flex items-end gap-5">
        {/* Count */}
        <div className="shrink-0">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">Lessons Completed</p>
          <p className="text-4xl font-bold text-[var(--deep-text)] leading-none">{lessonsThisWeek}</p>
          <div
            className="flex items-center gap-1 mt-1.5 text-sm font-medium"
            style={{ color: isPositive ? "oklch(.6 .15 150)" : "oklch(.55 .18 25)" }}
          >
            <ArrowUpRight size={13} style={{ transform: isPositive ? "none" : "rotate(90deg)" }} />
            {isPositive ? `+${weeklyChange}` : weeklyChange} from last week
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-1.5 flex-1 h-16">
          {barData.map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className="w-full rounded-sm transition-all duration-500"
                style={{
                  height: `${Math.max(4, Math.round(v * 52))}px`,
                  background: v >= 0.8 ? "var(--primary)" : "var(--btn-regular-bg)",
                  opacity: v === 0 ? 0.3 : 1,
                }}
              />
              <span className="text-[10px] text-[var(--text-tertiary)]">{DAYS[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
