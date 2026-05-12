"use client";

import { useState } from "react";
import InterviewConfig, { type Scenario, type Level, type Difficulty } from "./InterviewConfig";
import InterviewSession, { type InterviewTurn } from "@/components/interview/InterviewSession";
import type { ExerciseDifficulty } from "@/components/interview/CandidateRecorder";

interface ScriptResponse {
  title: string;
  turns: InterviewTurn[];
}

type Phase = "config" | "loading" | "session" | "error";

export default function InterviewView() {
  const [scenario, setScenario] = useState<Scenario>("hr");
  const [level, setLevel]       = useState<Level>("intermediate");
  const [difficulty, setDifficulty] = useState<Difficulty>("guided");

  const [phase, setPhase]   = useState<Phase>("config");
  const [script, setScript] = useState<ScriptResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleStart() {
    setPhase("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/gemini/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, level }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      const data: ScriptResponse = await res.json();
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
        <InterviewConfig
          scenario={scenario}
          level={level}
          difficulty={difficulty}
          onScenarioChange={setScenario}
          onLevelChange={setLevel}
          onDifficultyChange={setDifficulty}
        />
      </div>

      <div className="px-4 pt-2 pb-4 shrink-0">
        {phase === "error" && errorMsg && (
          <p className="text-tiny text-center mb-2 text-error">
            {errorMsg}
          </p>
        )}
        <button
          onClick={handleStart}
          disabled={phase === "loading"}
          className="w-full py-3 rounded-2xl bg-[var(--primary)] border-none text-sm font-semibold text-[var(--on-primary)] cursor-pointer transition-[opacity,transform] duration-150 hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {phase === "loading" ? "Generating…" : "Start Interview →"}
        </button>
      </div>
    </div>
  );
}
