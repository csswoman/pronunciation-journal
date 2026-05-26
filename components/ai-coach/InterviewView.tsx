"use client";

import { useState } from "react";
import { Sparkles, BookOpen } from "lucide-react";
import InterviewConfig, { type Scenario, type Level, type Difficulty, CURATED_SCENARIOS } from "./InterviewConfig";
import InterviewSession, { type InterviewTurn } from "@/components/interview/InterviewSession";
import type { ExerciseDifficulty } from "@/components/interview/CandidateRecorder";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScriptResponse {
  title: string;
  turns: InterviewTurn[];
}

type Phase = "config" | "loading" | "session" | "error";
type Mode = "generate" | "curated";

// ── Component ─────────────────────────────────────────────────────────────────

export default function InterviewView() {
  const [scenario, setScenario] = useState<Scenario>("hr");
  const [level, setLevel]       = useState<Level>("intermediate");
  const [difficulty, setDifficulty] = useState<Difficulty>("guided");
  const [mode, setMode]         = useState<Mode>("generate");

  const [phase, setPhase]   = useState<Phase>("config");
  const [script, setScript] = useState<ScriptResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canUseCurated = CURATED_SCENARIOS.has(scenario);
  const activeMode = canUseCurated ? mode : "generate";

  async function handleStart() {
    setPhase("loading");
    setErrorMsg(null);
    try {
      let data: ScriptResponse;

      if (activeMode === "curated") {
        const res = await fetch(`/interviews/${scenario}-${level}.json`);
        if (!res.ok) throw new Error(`Curated script not found (${res.status})`);
        data = await res.json();
      } else {
        const res = await fetch("/api/gemini/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenario, level }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Error ${res.status}`);
        }
        data = await res.json();
      }

      if (!data.turns?.length) throw new Error("Invalid script received");
      setScript(data);
      setPhase("session");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  }

  function handleReset() {
    setScript(null);
    setPhase("config");
    setErrorMsg(null);
  }

  if (phase === "session" && script) {
    return (
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <InterviewSession
          title={script.title}
          turns={script.turns}
          difficulty={difficulty as ExerciseDifficulty}
          level={level}
          onReset={handleReset}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">

        {/* Mode toggle */}
        <div className="px-6 pt-4 pb-1">
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-sunken)]">
            {([
              { id: "generate", label: "Generate", Icon: Sparkles },
              { id: "curated",  label: "Curated",  Icon: BookOpen  },
            ] as { id: Mode; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => {
              const disabled = id === "curated" && !canUseCurated;
              const active   = activeMode === id;
              return (
                <button
                  key={id}
                  onClick={() => !disabled && setMode(id)}
                  disabled={disabled}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-body-sm font-semibold transition-[background,color] duration-150 ${
                    active
                      ? "bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-sm"
                      : disabled
                        ? "text-[var(--text-disabled)] cursor-not-allowed"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  <Icon size={14} strokeWidth={2} />
                  {label}
                </button>
              );
            })}
          </div>
          {activeMode === "curated" && (
            <p className="text-caption text-[var(--text-tertiary)] mt-2 text-center">
              Fixed script — practice the same interview until you nail it
            </p>
          )}
        </div>

        <InterviewConfig
          scenario={scenario}
          level={level}
          difficulty={difficulty}
          onScenarioChange={(s) => { setScenario(s); if (!CURATED_SCENARIOS.has(s)) setMode("generate"); }}
          onLevelChange={setLevel}
          onDifficultyChange={setDifficulty}
        />
      </div>

      <div className="px-4 pt-2 pb-4 shrink-0">
        {phase === "error" && errorMsg && (
          <p className="text-body-sm text-center mb-2 text-error">{errorMsg}</p>
        )}
        <button
          onClick={handleStart}
          disabled={phase === "loading"}
          className="w-full py-3 rounded-2xl bg-[var(--primary)] border-none text-body-lg font-semibold text-[var(--on-primary)] cursor-pointer transition-[opacity,transform] duration-150 hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {phase === "loading"
            ? activeMode === "curated" ? "Loading…" : "Generating…"
            : "Start Interview →"}
        </button>
      </div>
    </div>
  );
}
