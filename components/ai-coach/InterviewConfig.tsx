"use client";

import { User, Laptop, Layers, Star, BrainCircuit, Check } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Scenario = "hr" | "frontend" | "system-design" | "behavioral" | "ai-developer";
export type Level = "beginner" | "intermediate" | "advanced";
export type Difficulty = "guided" | "challenge";

export const CURATED_SCENARIOS = new Set<Scenario>(["hr", "frontend", "system-design", "ai-developer"]);

// ── Data ──────────────────────────────────────────────────────────────────────

const INTERVIEW_TYPES: { id: Scenario; label: string; sub: string; Icon: React.ElementType }[] = [
  { id: "hr",            label: "HR / General",  sub: "Tell me about yourself…",  Icon: User },
  { id: "frontend",      label: "Frontend Dev",  sub: "React, CSS, JS concepts",  Icon: Laptop },
  { id: "system-design", label: "System Design", sub: "Architecture, trade-offs", Icon: Layers },
  { id: "behavioral",    label: "Behavioral",    sub: "STAR method",              Icon: Star },
  { id: "ai-developer",  label: "AI Developer",  sub: "LLMs, agents, evals",      Icon: BrainCircuit },
];

const LEVELS: { id: Level; label: string }[] = [
  { id: "beginner",     label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced",     label: "Advanced" },
];

const SCORING: { id: Difficulty; label: string; badge: string }[] = [
  { id: "guided",    label: "Guided",    badge: "Easier" },
  { id: "challenge", label: "Challenge", badge: "Harder" },
];

const sectionLabel =
  "text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)] text-center";

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
    <div className="flex flex-col gap-5 px-5 pt-4 pb-6">

      <div className="flex flex-col gap-4">
        <div>
          <p className={sectionLabel}>Level</p>
          <div className="mt-2.5 flex flex-wrap gap-2 justify-center">
            {LEVELS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onLevelChange(id)}
                className={`text-sm font-semibold px-3.5 py-1.5 rounded-full border cursor-pointer transition-[background,color,border-color] duration-150 ${
                  level === id
                    ? "bg-[var(--primary)] text-[var(--on-primary)] border-transparent"
                    : "bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--accent-border)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={sectionLabel}>Scoring</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {SCORING.map(({ id, label, badge }) => {
              const active = difficulty === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onDifficultyChange(id)}
                  className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left cursor-pointer transition-[border-color,background] duration-150 ${
                    active
                      ? "bg-[var(--accent-dim)] border-[var(--accent-border)]"
                      : "bg-[var(--surface-raised)] border-[var(--border-subtle)] hover:border-[var(--accent-border)]"
                  }`}
                >
                  <span className="text-base font-semibold text-[var(--text-primary)] leading-none">
                    {label}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      id === "guided"
                        ? "bg-[color-mix(in_oklch,var(--success)_15%,transparent)] text-[var(--success)]"
                        : "bg-[color-mix(in_oklch,var(--warning)_15%,transparent)] text-[var(--warning)]"
                    }`}
                  >
                    {badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className={sectionLabel}>Scenario</p>
        <div className="flex flex-col gap-2" role="listbox" aria-label="Interview scenarios">
          {INTERVIEW_TYPES.map(({ id, label, sub, Icon }) => {
            const selected = scenario === id;
            return (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onScenarioChange(id)}
                className={`flex items-center gap-3 w-full min-h-0 py-3 px-3 rounded-2xl border text-left cursor-pointer transition-[border-color,background] duration-150 ${
                  selected
                    ? "bg-[var(--accent-dim)] border-[var(--accent-border)]"
                    : "bg-[var(--surface-raised)] border-[var(--border-subtle)] hover:border-[var(--accent-border)]"
                }`}
              >
                <span
                  className="w-10 h-10 flex-shrink-0 rounded-md flex items-center justify-center"
                  style={{
                    backgroundColor: selected
                      ? "color-mix(in srgb, var(--primary) 14%, transparent)"
                      : "var(--surface-sunken)",
                  }}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.9}
                    className={selected ? "text-[var(--primary)]" : "text-[var(--text-tertiary)]"}
                  />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-[var(--text-primary)] leading-snug">
                    {label}
                  </span>
                  <span className="block text-sm text-[var(--text-tertiary)] mt-0.5 leading-snug">
                    {sub}
                  </span>
                </span>
                <Check
                  size={17}
                  strokeWidth={2.5}
                  className={`flex-shrink-0 text-[var(--primary)] ${selected ? "opacity-100" : "opacity-0"}`}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
