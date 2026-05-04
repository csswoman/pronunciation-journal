"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import type { AnalyticsEventName } from "@/lib/db";

// ── Data layer ────────────────────────────────────────────────────────────────

interface Counts {
  exercise_shown:       number;
  exercise_answered:    number;
  next_clicked:         number;
  retry_clicked:        number;
  exercise_abandoned:   number;
  auto_next_triggered:  number;
  time_to_first_exercise_total: number;
  time_to_first_exercise_count: number;
}

async function loadCounts(): Promise<Counts> {
  const relevant: AnalyticsEventName[] = [
    "exercise_shown",
    "exercise_answered",
    "next_clicked",
    "retry_clicked",
    "exercise_abandoned",
    "auto_next_triggered",
    "time_to_first_exercise",
  ];

  const rows = await db.analyticsEvents
    .where("name")
    .anyOf(relevant)
    .toArray();

  const counts: Counts = {
    exercise_shown: 0,
    exercise_answered: 0,
    next_clicked: 0,
    retry_clicked: 0,
    exercise_abandoned: 0,
    auto_next_triggered: 0,
    time_to_first_exercise_total: 0,
    time_to_first_exercise_count: 0,
  };

  for (const row of rows) {
    switch (row.name) {
      case "exercise_shown":       counts.exercise_shown++;       break;
      case "exercise_answered":    counts.exercise_answered++;    break;
      case "next_clicked":         counts.next_clicked++;         break;
      case "retry_clicked":        counts.retry_clicked++;        break;
      case "exercise_abandoned":   counts.exercise_abandoned++;   break;
      case "auto_next_triggered":  counts.auto_next_triggered++;  break;
      case "time_to_first_exercise": {
        const ms = (row.payload as { timeMs?: number }).timeMs ?? 0;
        counts.time_to_first_exercise_total += ms;
        counts.time_to_first_exercise_count++;
        break;
      }
    }
  }

  return counts;
}

function derive(c: Counts) {
  const pct = (num: number, den: number) =>
    den === 0 ? null : Math.round((num / den) * 100);

  const avgFirstMs =
    c.time_to_first_exercise_count === 0
      ? null
      : Math.round(c.time_to_first_exercise_total / c.time_to_first_exercise_count / 1000);

  return {
    engagement:     pct(c.next_clicked, c.exercise_answered),
    difficulty:     pct(c.retry_clicked, c.exercise_answered),
    friction:       pct(c.exercise_abandoned, c.exercise_shown),
    naturalFlow:    pct(c.auto_next_triggered, c.next_clicked + c.auto_next_triggered),
    onboardingSec:  avgFirstMs,
  };
}

// ── Metric tile ───────────────────────────────────────────────────────────────

interface TileConfig {
  label:       string;
  value:       number | null;  // percentage, or seconds for onboarding
  unit:        "%" | "s";
  barColor:    string;
  invert:      boolean;        // true = lower is better
  empty:       string;         // shown when value is null
  hint:        (v: number) => string;
}

function statusColor(value: number, invert: boolean): string {
  const good    = "var(--score-excellent)";
  const neutral = "var(--primary)";
  const warn    = "var(--score-acceptable)";
  const bad     = "var(--score-poor)";

  if (!invert) {
    if (value >= 70) return good;
    if (value >= 40) return neutral;
    if (value >= 20) return warn;
    return bad;
  } else {
    if (value <= 10) return good;
    if (value <= 25) return neutral;
    if (value <= 40) return warn;
    return bad;
  }
}

function Tile({ label, value, unit, invert, empty, hint }: TileConfig) {
  const hasData = value !== null;
  const display = hasData ? `${value}${unit}` : "—";
  const color   = hasData ? statusColor(value!, invert) : "var(--text-tertiary)";

  // Bar fill: for "lower is better" metrics, full bar = bad; cap bar at 100 for %
  const barFill = hasData
    ? unit === "s"
      ? Math.min((value! / 30) * 100, 100)   // 30s = full
      : value!
    : 0;

  return (
    <div
      className="flex flex-col gap-2 rounded-2xl p-4 min-w-0"
      style={{
        background: "color-mix(in oklch, var(--btn-regular-bg) 60%, var(--card-bg))",
        border: "1px solid var(--line-divider)",
      }}
    >
      <p
        className="text-tiny font-bold uppercase tracking-[0.2em] truncate"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </p>

      <p
        className="font-heading text-3xl font-black tracking-tight leading-none"
        style={{ color }}
      >
        {display}
      </p>

      {/* Ratio bar */}
      <div
        className="h-1 w-full rounded-full overflow-hidden"
        style={{ background: "var(--line-divider)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${barFill}%`, background: color }}
        />
      </div>

      <p
        className="text-tiny leading-snug"
        style={{ color: "var(--text-secondary)" }}
      >
        {hasData ? hint(value!) : empty}
      </p>
    </div>
  );
}

// ── Widget ────────────────────────────────────────────────────────────────────

export default function AIEngagementWidget() {
  const [metrics, setMetrics] = useState<ReturnType<typeof derive> | null>(null);

  useEffect(() => {
    loadCounts()
      .then(c => setMetrics(derive(c)))
      .catch(() => {});
  }, []);

  // Don't render until loaded — avoids a flash of zeroes
  if (metrics === null) return null;

  // If no data at all yet, skip the widget
  const hasAnyData =
    metrics.engagement !== null ||
    metrics.difficulty !== null ||
    metrics.friction   !== null ||
    metrics.naturalFlow !== null ||
    metrics.onboardingSec !== null;

  if (!hasAnyData) return null;

  const tiles: TileConfig[] = [
    {
      label:    "Engagement",
      value:    metrics.engagement,
      unit:     "%",
      barColor: "var(--primary)",
      invert:   false,
      empty:    "Answer an exercise to see this",
      hint:     v => v >= 70 ? "High — you keep going after answering" : v >= 40 ? "Moderate — room to keep the momentum" : "Low — sessions may be ending too early",
    },
    {
      label:    "Actual difficulty",
      value:    metrics.difficulty,
      unit:     "%",
      barColor: "var(--score-acceptable)",
      invert:   true,
      empty:    "Answer an exercise to see this",
      hint:     v => v <= 10 ? "Low — exercises feel well-calibrated" : v <= 30 ? "Medium — some topics need reinforcement" : "High — content may be too hard right now",
    },
    {
      label:    "Friction",
      value:    metrics.friction,
      unit:     "%",
      barColor: "var(--score-poor)",
      invert:   true,
      empty:    "No exercises shown yet",
      hint:     v => v <= 10 ? "Low — you're engaging with exercises" : v <= 30 ? "Some exercises go unanswered" : "High — many exercises are being skipped",
    },
    {
      label:    "Natural flow",
      value:    metrics.naturalFlow,
      unit:     "%",
      barColor: "var(--score-excellent)",
      invert:   false,
      empty:    "No next events yet",
      hint:     v => v >= 70 ? "Strong — sessions flow automatically" : v >= 40 ? "Mixed — auto-next and manual are balanced" : "Low — you're advancing manually most of the time",
    },
    {
      label:    "Time to first exercise",
      value:    metrics.onboardingSec,
      unit:     "s",
      barColor: "var(--primary)",
      invert:   true,
      empty:    "Start an AI session to track this",
      hint:     v => v <= 5 ? "Instant — exercises appear right away" : v <= 15 ? "Fast — good session start" : "Slow — consider a more direct prompt",
    },
  ];

  return (
    <div
      className="rounded-[26px] p-5"
      style={{
        background: "var(--card-bg)",
        boxShadow: "0 1px 3px var(--line-divider), 0 6px 20px var(--line-divider)",
      }}
    >
      <div className="mb-4">
        <p
          className="text-tiny font-bold uppercase tracking-[0.24em]"
          style={{ color: "var(--primary)" }}
        >
          AI Practice
        </p>
        <h3
          className="mt-1 text-lg font-black tracking-tight"
          style={{ color: "var(--deep-text)" }}
        >
          Engagement signals
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map(t => <Tile key={t.label} {...t} />)}
      </div>
    </div>
  );
}
