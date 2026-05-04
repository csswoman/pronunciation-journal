"use client";

import Link from "next/link";
import { BarChart2, ArrowUpRight } from "lucide-react";
import Card from "@/components/layout/Card";
import CardHeader from "@/components/ui/CardHeader";

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
    <Card variant="compact" className="gap-4">
      <CardHeader
        icon={<BarChart2 size={17} className="text-[var(--primary)]" />}
        title="Your Progress"
        right={
          <Link href="/progress" className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors">
            This week
          </Link>
        }
      />

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
              <span className="text-tiny text-[var(--text-tertiary)]">{DAYS[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
