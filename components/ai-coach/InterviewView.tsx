"use client";

import { useState } from "react";
import { Sparkles, BookOpen, Briefcase } from "lucide-react";
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
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
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

  const modeHint =
    activeMode === "curated"
      ? "Fixed script — repeat until you nail it"
      : "Fresh AI questions each run";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 px-5 pt-5 pb-4 border-b border-border-subtle flex flex-col items-center text-center gap-4">
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative size-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "0 8px 24px -8px color-mix(in srgb, var(--primary) 50%, transparent)",
            }}
          >
            <Briefcase size={22} strokeWidth={2} className="text-white" />
          </div>
          <div className="space-y-1.5 max-w-[280px]">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)] m-0 leading-snug">
              Mock interview
            </h2>
            <p className="text-sm text-[var(--text-secondary)] m-0 leading-relaxed">
              Pick a scenario and level — I&apos;ll play the interviewer.
            </p>
            <p className="text-xs text-[var(--text-tertiary)] m-0 pt-0.5">
              {modeHint}
            </p>
          </div>
        </div>

        <div className="w-full flex gap-1 p-1 rounded-xl bg-[var(--surface-sunken)]">
          {([
            { id: "generate", label: "Generate", Icon: Sparkles },
            { id: "curated",  label: "Curated",  Icon: BookOpen  },
          ] as { id: Mode; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => {
            const disabled = id === "curated" && !canUseCurated;
            const active   = activeMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => !disabled && setMode(id)}
                disabled={disabled}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-[background,color] duration-150 ${
                  active
                    ? "bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-sm"
                    : disabled
                      ? "text-[var(--text-disabled)] cursor-not-allowed"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <Icon size={15} strokeWidth={2} />
                {label}
              </button>
            );
          })}
        </div>
      </header>

      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y [scrollbar-width:thin] [scrollbar-color:var(--border-subtle)_transparent]"
        aria-label="Interview setup"
      >
        <InterviewConfig
          scenario={scenario}
          level={level}
          difficulty={difficulty}
          onScenarioChange={(s) => { setScenario(s); if (!CURATED_SCENARIOS.has(s)) setMode("generate"); }}
          onLevelChange={setLevel}
          onDifficultyChange={setDifficulty}
        />
      </div>

      {/* Fixed footer */}
      <footer className="shrink-0 px-5 py-4 border-t border-border-subtle bg-surface-base">
        {phase === "error" && errorMsg && (
          <p className="text-sm text-center mb-2 text-error">{errorMsg}</p>
        )}
        <button
          type="button"
          onClick={handleStart}
          disabled={phase === "loading"}
          className="w-full py-3.5 rounded-2xl border-none text-base font-bold cursor-pointer transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--on-primary)",
          }}
        >
          {phase === "loading"
            ? activeMode === "curated" ? "Loading…" : "Generating…"
            : "Start interview →"}
        </button>
      </footer>
    </div>
  );
}
