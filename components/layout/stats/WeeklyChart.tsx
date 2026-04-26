"use client";

import { useState } from "react";
import type { DailyProgress } from "@/lib/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKLY_GOAL = 5;

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

interface Props {
  progressHistory: DailyProgress[];
}

export function WeeklyChart({ progressHistory }: Props) {
  const [chartMetric, setChartMetric] = useState<"attempts" | "accuracy" | "xp">("attempts");

  const today = new Date().toISOString().split("T")[0];
  const last7Days = getLast7Days();
  const progressMap = new Map(progressHistory.map((p) => [p.date, p]));

  const barData = last7Days.map((date) => {
    const day = progressMap.get(date);
    return {
      date,
      label: DAY_LABELS[new Date(`${date}T12:00:00`).getDay()],
      dayNum: new Date(`${date}T12:00:00`).getDate(),
      attempts: day?.totalAttempts ?? 0,
      accuracy: day?.averageAccuracy ?? 0,
      xp: day?.xp ?? 0,
      isToday: date === today,
    };
  });

  const daysPracticed = barData.filter((d) => d.attempts > 0).length;
  const weeklyAttempts = barData.reduce((s, d) => s + d.attempts, 0);
  const weeklyXp = barData.reduce((s, d) => s + d.xp, 0);
  const weeklyAccuracyDays = barData.filter((d) => d.attempts > 0);
  const weeklyAccuracy = weeklyAccuracyDays.length
    ? Math.round(weeklyAccuracyDays.reduce((s, d) => s + d.accuracy, 0) / weeklyAccuracyDays.length)
    : 0;

  const metricValues = barData.map((d) =>
    chartMetric === "attempts" ? d.attempts : chartMetric === "accuracy" ? d.accuracy : d.xp
  );
  const maxMetric = Math.max(...metricValues, 1);

  const isEmpty = weeklyAttempts === 0;

  return (
    <div
      className="rounded-[26px] p-5"
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--line-divider)",
        boxShadow: "0 1px 3px var(--line-divider), 0 8px 20px var(--line-divider)",
      }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-base font-bold" style={{ color: "var(--deep-text)" }}>Your weekly progress</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {chartMetric === "attempts" ? "Attempts per day" : chartMetric === "accuracy" ? "Accuracy % per day" : "XP per day"}
          </p>
        </div>
        <div
          className="inline-flex rounded-xl p-1 gap-1"
          style={{ background: "var(--btn-regular-bg)" }}
        >
          {(["attempts", "accuracy", "xp"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setChartMetric(m)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all"
              style={{
                background: chartMetric === m ? "var(--card-bg)" : "transparent",
                color: chartMetric === m ? "var(--deep-text)" : "var(--text-secondary)",
                boxShadow: chartMetric === m ? "0 1px 3px var(--line-divider)" : "none",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="mt-5 flex flex-col items-center justify-center py-10 text-center gap-2">
          <p className="text-sm font-semibold" style={{ color: "var(--deep-text)" }}>No practice this week yet</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Complete a lesson or phoneme exercise to see your chart.
          </p>
        </div>
      ) : (
        <>
          {/* Bars */}
          <div className="mt-5 grid grid-cols-7 gap-2 items-end" style={{ height: 120 }}>
            {barData.map((day, i) => {
              const val = metricValues[i];
              const barH = val > 0 ? Math.max((val / maxMetric) * 96, 12) : 6;
              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold tabular-nums" style={{ color: day.isToday ? "var(--primary)" : "var(--text-tertiary)" }}>
                    {val > 0 ? (chartMetric === "accuracy" ? `${val}%` : val) : ""}
                  </span>
                  <div className="w-full flex items-end" style={{ height: 96 }}>
                    <div
                      className="w-full rounded-[10px] animate-stat-rise"
                      style={{
                        height: barH,
                        animationDelay: `${i * 60}ms`,
                        background: val > 0
                          ? day.isToday
                            ? "linear-gradient(180deg, color-mix(in oklch, var(--primary) 70%, white), var(--primary))"
                            : "color-mix(in oklch, var(--primary) 35%, transparent)"
                          : "var(--line-divider)",
                        boxShadow: day.isToday && val > 0 ? "0 4px 14px color-mix(in oklch, var(--primary) 28%, transparent)" : "none",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day labels */}
          <div className="mt-2 grid grid-cols-7 gap-2">
            {barData.map((day) => (
              <div key={day.date} className="flex flex-col items-center">
                <span className="text-[11px] font-semibold" style={{ color: day.isToday ? "var(--primary)" : "var(--text-secondary)" }}>
                  {day.label}
                </span>
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  {day.dayNum}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Bottom summary row */}
      <div
        className="mt-4 grid grid-cols-4 divide-x rounded-2xl overflow-hidden"
        style={{ background: "var(--btn-regular-bg)", borderColor: "var(--line-divider)" }}
      >
        {[
          { label: "Weekly Attempts", value: weeklyAttempts || "—" },
          { label: "Weekly Accuracy", value: weeklyAccuracy ? `${weeklyAccuracy}%` : "—" },
          { label: "Days Practiced", value: `${daysPracticed} / ${WEEKLY_GOAL}` },
          { label: "Weekly XP", value: weeklyXp ? formatCompact(weeklyXp) : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center py-3 px-2" style={{ borderColor: "var(--line-divider)" }}>
            <span className="text-[10px] font-medium text-center" style={{ color: "var(--text-secondary)" }}>{label}</span>
            <span className="text-base font-black mt-0.5" style={{ color: "var(--deep-text)" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { getLast7Days };
export type { BarDay };

type BarDay = {
  date: string;
  label: string;
  dayNum: number;
  attempts: number;
  accuracy: number;
  xp: number;
  isToday: boolean;
};

export function deriveWeeklySummary(progressHistory: DailyProgress[]) {
  const today = new Date().toISOString().split("T")[0];
  const last7Days = getLast7Days();
  const progressMap = new Map(progressHistory.map((p) => [p.date, p]));

  const barData: BarDay[] = last7Days.map((date) => {
    const day = progressMap.get(date);
    return {
      date,
      label: DAY_LABELS[new Date(`${date}T12:00:00`).getDay()],
      dayNum: new Date(`${date}T12:00:00`).getDate(),
      attempts: day?.totalAttempts ?? 0,
      accuracy: day?.averageAccuracy ?? 0,
      xp: day?.xp ?? 0,
      isToday: date === today,
    };
  });

  const daysPracticed = barData.filter((d) => d.attempts > 0).length;
  const weeklyAttempts = barData.reduce((s, d) => s + d.attempts, 0);
  const weeklyXp = barData.reduce((s, d) => s + d.xp, 0);
  const weeklyAccuracyDays = barData.filter((d) => d.attempts > 0);
  const weeklyAccuracy = weeklyAccuracyDays.length
    ? Math.round(weeklyAccuracyDays.reduce((s, d) => s + d.accuracy, 0) / weeklyAccuracyDays.length)
    : 0;
  const consistencyScore = Math.round(
    Math.min(daysPracticed / WEEKLY_GOAL, 1) * 60 + Math.min(weeklyAccuracy, 100) * 0.4
  );

  return { barData, daysPracticed, weeklyAttempts, weeklyXp, weeklyAccuracy, consistencyScore };
}
