"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { ExerciseDifficulty } from "./CandidateRecorder";

export type Scenario = "hr" | "frontend" | "system-design" | "behavioral" | "product";
export type Level = "beginner" | "intermediate" | "advanced";
export type { ExerciseDifficulty };

const SCENARIOS: { id: Scenario; label: string; description: string; emoji: string }[] = [
  { id: "hr",           label: "HR / General",     description: "Tell me about yourself, strengths & goals", emoji: "👤" },
  { id: "frontend",     label: "Frontend Dev",      description: "React, CSS, JS concepts & experience",     emoji: "💻" },
  { id: "system-design",label: "System Design",     description: "Architecture, scalability, trade-offs",    emoji: "🏗️" },
  { id: "behavioral",   label: "Behavioral",        description: "STAR method: situations, actions, results", emoji: "⭐" },
  { id: "product",      label: "Product Manager",   description: "Product thinking, metrics, roadmaps",      emoji: "📊" },
];

const LEVELS: { id: Level; label: string; sub: string }[] = [
  { id: "beginner",     label: "Beginner",     sub: "Simple vocabulary" },
  { id: "intermediate", label: "Intermediate", sub: "Professional language" },
  { id: "advanced",     label: "Advanced",     sub: "Native-level fluency" },
];

const DIFFICULTIES: { id: ExerciseDifficulty; label: string; tag: string; tagColor: string; description: string }[] = [
  {
    id: "guided",
    label: "Guided",
    tag: "Easier",
    tagColor: "var(--word-correct)",
    description: "Lenient scoring — small pronunciation errors are OK. Best for building confidence.",
  },
  {
    id: "challenge",
    label: "Challenge",
    tag: "Harder",
    tagColor: "var(--word-missing)",
    description: "Strict scoring — near-perfect pronunciation required. Push your limits.",
  },
];

interface Props {
  onStart: (scenario: Scenario, level: Level, difficulty: ExerciseDifficulty) => void;
  loading: boolean;
}

export default function ScenarioPicker({ onStart, loading }: Props) {
  const [scenario, setScenario] = useState<Scenario>("hr");
  const [level, setLevel] = useState<Level>("intermediate");
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty>("guided");

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 flex flex-col gap-10">

      {/* Hero */}
      <div>
        <h1 className="font-heading text-3xl font-bold mb-2" style={{ color: "var(--deep-text)" }}>
          Interview Practice
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-text)" }}>
          Gemini generates a realistic interview script. You listen to the interviewer, read the candidate lines aloud, and get instant pronunciation feedback.
        </p>
      </div>

      {/* Scenario */}
      <section className="flex flex-col gap-3">
        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-text)" }}>
          Interview type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SCENARIOS.map((s) => {
            const active = scenario === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setScenario(s.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all duration-150"
                style={{
                  borderColor: active ? "var(--color-accent)" : "var(--line-divider)",
                  background: active ? "var(--color-accent)" : "var(--card-bg)",
                  boxShadow: active ? "0 0 0 1px var(--color-accent)" : undefined,
                }}
              >
                <span className="text-2xl flex-shrink-0">{s.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: active ? "var(--color-text-on-accent)" : "var(--deep-text)" }}>
                    {s.label}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: active ? "var(--color-text-on-accent)" : "var(--muted-text)", opacity: active ? 0.85 : 1 }}>
                    {s.description}
                  </p>
                </div>
                {active && <Check size={16} className="ml-auto flex-shrink-0" style={{ color: "var(--color-text-on-accent)" }} />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Level */}
      <section className="flex flex-col gap-3">
        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-text)" }}>
          Your English level
        </label>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((l) => {
            const active = level === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border transition-all duration-150"
                style={{
                  borderColor: active ? "var(--color-accent)" : "var(--line-divider)",
                  background: active ? "var(--color-accent)" : "var(--card-bg)",
                  boxShadow: active ? "0 0 0 1px var(--color-accent)" : undefined,
                }}
              >
                <span className="text-sm font-semibold" style={{ color: active ? "var(--color-text-on-accent)" : "var(--deep-text)" }}>
                  {l.label}
                </span>
                <span className="text-xs" style={{ color: active ? "var(--color-text-on-accent)" : "var(--muted-text)", opacity: active ? 0.8 : 1 }}>
                  {l.sub}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Difficulty */}
      <section className="flex flex-col gap-3">
        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-text)" }}>
          Pronunciation scoring
        </label>
        <div className="grid grid-cols-2 gap-3">
          {DIFFICULTIES.map((d) => {
            const active = difficulty === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className="flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-150"
                style={{
                  borderColor: active ? "var(--color-accent)" : "var(--line-divider)",
                  background: active ? "var(--accent)12" : "var(--card-bg)",
                  boxShadow: active ? "0 0 0 1px var(--color-accent)" : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "var(--deep-text)" }}>{d.label}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `color-mix(in oklch, ${d.tagColor} 14%, transparent)`, color: d.tagColor }}
                  >
                    {d.tag}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted-text)" }}>{d.description}</p>
                {active && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-accent)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>Selected</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <button
        onClick={() => onStart(scenario, level, difficulty)}
        disabled={loading}
        className="w-full py-4 rounded-2xl font-semibold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "var(--color-accent)", color: "var(--color-text-on-accent)" }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Generating script…
          </span>
        ) : (
          "Start Interview →"
        )}
      </button>

    </div>
  );
}
