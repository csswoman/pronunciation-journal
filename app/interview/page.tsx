"use client";

import { useState } from "react";
import ScenarioPicker, { type Scenario, type Level, type ExerciseDifficulty } from "@/components/interview/ScenarioPicker";
import InterviewSession, { type InterviewTurn } from "@/components/interview/InterviewSession";

interface ScriptResponse {
  title: string;
  turns: InterviewTurn[];
}

export default function InterviewPage() {
  const [script, setScript] = useState<ScriptResponse | null>(null);
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty>("guided");
  const [level, setLevel] = useState<Level>("intermediate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async (scenario: Scenario, lvl: Level, diff: ExerciseDifficulty) => {
    setLoading(true);
    setError(null);
    setDifficulty(diff);
    setLevel(lvl);
    try {
      const res = await fetch("/api/gemini/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, level: lvl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      const data: ScriptResponse = await res.json();
      if (!data.turns?.length) throw new Error("Invalid script received");
      setScript(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => setScript(null);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-4 items-center text-center">
        <p className="text-2xl">⚠️</p>
        <p className="text-sm" style={{ color: "var(--muted-text)" }}>{error}</p>
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (script) {
    return (
      <div className="h-[calc(100vh-120px)]">
        <InterviewSession
          title={script.title}
          turns={script.turns}
          difficulty={difficulty}
          level={level}
          onReset={handleReset}
        />
      </div>
    );
  }

  return <ScenarioPicker onStart={handleStart} loading={loading} />;
}
