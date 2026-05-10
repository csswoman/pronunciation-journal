"use client";

import { User, Laptop, Layers, Star } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Scenario = "hr" | "frontend" | "system-design" | "behavioral";
export type Level = "beginner" | "intermediate" | "advanced";
export type Difficulty = "guided" | "challenge";

// ── Data ──────────────────────────────────────────────────────────────────────

const INTERVIEW_TYPES: { id: Scenario; label: string; sub: string; Icon: React.ElementType }[] = [
  { id: "hr",            label: "HR / General",  sub: "Tell me about yourself…",  Icon: User },
  { id: "frontend",      label: "Frontend Dev",  sub: "React, CSS, JS concepts",  Icon: Laptop },
  { id: "system-design", label: "System Design", sub: "Architecture, trade-offs", Icon: Layers },
  { id: "behavioral",    label: "Behavioral",    sub: "STAR method",              Icon: Star },
];

const LEVELS: { id: Level; label: string; sub: string }[] = [
  { id: "beginner",     label: "Beginner",     sub: "Simple vocabulary" },
  { id: "intermediate", label: "Intermediate", sub: "Professional language" },
  { id: "advanced",     label: "Advanced",     sub: "Native-level fluency" },
];

const SCORING: { id: Difficulty; label: string; badge: string; badgeStyle: string; sub: string }[] = [
  {
    id: "guided",
    label: "Guided",
    badge: "Easier",
    badgeStyle: "bg-[color-mix(in_oklch,var(--success)_15%,transparent)] text-[var(--success)]",
    sub: "Lenient — build confidence",
  },
  {
    id: "challenge",
    label: "Challenge",
    badge: "Harder",
    badgeStyle: "bg-[color-mix(in_oklch,var(--warning)_15%,transparent)] text-[var(--warning)]",
    sub: "Strict — push your limits",
  },
];

// ── Shared class strings ──────────────────────────────────────────────────────

const cardBase =
  "p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-left cursor-pointer transition-[border-color,background] duration-150 flex flex-col gap-1.5";
const cardInactive = "hover:border-[var(--border-default)]";
const cardActive   = "bg-[var(--accent-dim)] border-[var(--accent-border)]";

// ── Props ─────────────────────────────────────────────────────────────────────

interface InterviewConfigProps {
  scenario: Scenario;
  level: Level;
  difficulty: Difficulty;
  onScenarioChange: (v: Scenario) => void;
  onLevelChange: (v: Level) => void;
  onDifficultyChange: (v: Difficulty) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InterviewConfig({
  scenario,
  level,
  difficulty,
  onScenarioChange,
  onLevelChange,
  onDifficultyChange,
}: InterviewConfigProps) {
  return (
    <div className="px-6 pt-4 pb-6 flex flex-col gap-6">

      {/* Interview Type */}
      <div className="flex flex-col gap-2.5">
        <p className="text-tiny font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          Interview Type
        </p>
        <div className="grid grid-cols-2 gap-2">
          {INTERVIEW_TYPES.map(({ id, label, sub, Icon }) => (
            <button
              key={id}
              onClick={() => onScenarioChange(id)}
              className={`${cardBase} ${scenario === id ? cardActive : cardInactive}`}
            >
              <Icon
                size={16}
                strokeWidth={1.8}
                style={{ color: scenario === id ? "var(--primary)" : "var(--text-tertiary)" }}
              />
              <span className="text-caption font-semibold text-[var(--text-primary)] leading-[1.2]">{label}</span>
              <span className="text-tiny text-[var(--text-tertiary)]">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Level */}
      <div className="flex flex-col gap-2.5">
        <p className="text-tiny font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          Your English Level
        </p>
        <div className="flex gap-2">
          {LEVELS.map(({ id, label, sub }) => (
            <button
              key={id}
              onClick={() => onLevelChange(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border cursor-pointer transition-[background,border-color] duration-150 ${
                level === id
                  ? "bg-[var(--accent-dim)] border-[var(--accent-border)]"
                  : "bg-[var(--surface-raised)] border-[var(--border-subtle)] hover:bg-[var(--surface-sunken)]"
              }`}
            >
              <span className={`text-caption font-semibold leading-none ${level === id ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                {label}
              </span>
              <span className="text-tiny text-[var(--text-tertiary)] text-center">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scoring Mode */}
      <div className="flex flex-col gap-2.5">
        <p className="text-tiny font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          Scoring Mode
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SCORING.map(({ id, label, badge, badgeStyle, sub }) => (
            <button
              key={id}
              onClick={() => onDifficultyChange(id)}
              className={`${cardBase} ${difficulty === id ? cardActive : cardInactive}`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-caption font-semibold text-[var(--text-primary)] leading-[1.2]">{label}</span>
                <span className={`text-tiny font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${badgeStyle}`}>
                  {badge}
                </span>
              </div>
              <span className="text-tiny text-[var(--text-tertiary)]">{sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
