"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import type { LessonLevel, LessonCategory } from "@/lib/ai-prompts";

const LEVELS: { value: LessonLevel; label: string }[] = [
  { value: "A1", label: "A1 — Beginner" },
  { value: "A2", label: "A2 — Elementary" },
  { value: "B1", label: "B1 — Intermediate" },
  { value: "B2", label: "B2 — Upper-Intermediate" },
  { value: "C1", label: "C1 — Advanced" },
  { value: "C2", label: "C2 — Mastery" },
];

const CATEGORIES: { value: LessonCategory; label: string }[] = [
  { value: "grammar", label: "Grammar" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "pronunciation", label: "Pronunciation" },
  { value: "writing", label: "Writing" },
  { value: "speaking", label: "Speaking" },
  { value: "reading", label: "Reading" },
];

interface LessonAIPanelProps {
  hasContent: boolean;
  onGenerated: (title: string, content: string) => void;
}

export default function LessonAIPanel({ hasContent, onGenerated }: LessonAIPanelProps) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<LessonLevel>("B1");
  const [category, setCategory] = useState<LessonCategory>("grammar");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (topic.trim().length < 3) {
      setError("Describe the topic in a few more words.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/gemini/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), category, level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      onGenerated(data.title, data.content);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not generate the lesson");
    } finally {
      setGenerating(false);
    }
  };

  const selectClass =
    "w-full px-3 py-2 rounded-lg border border-[var(--line-divider)] bg-[var(--card-bg)] text-sm focus:outline-none focus:border-[var(--primary)] text-fg";
  const labelClass =
    "block text-xs font-semibold mb-1.5 uppercase tracking-wider text-fg-muted";

  return (
    <div className="rounded-xl border border-[var(--primary)] bg-[color-mix(in_oklch,var(--primary)_6%,var(--card-bg))] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5L13 3z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-semibold text-fg">Generate with AI</p>
          <p className="text-xs text-fg-muted">Draft a full lesson from a topic — then review and edit.</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-fg-subtle transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[var(--line-divider)] pt-3">
          <div>
            <label className={labelClass}>What should the lesson be about?</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              placeholder="e.g. Using the present perfect to talk about life experiences"
              className="w-full px-3 py-2 rounded-lg border border-[var(--line-divider)] bg-[var(--card-bg)] text-sm resize-none focus:outline-none focus:border-[var(--primary)] text-fg"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className={labelClass}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as LessonCategory)} className={selectClass}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className={labelClass}>Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as LessonLevel)} className={selectClass}>
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={generate}
            disabled={generating}
            className="self-start px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary disabled:opacity-50 flex items-center gap-2"
          >
            {generating && (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {generating ? "Writing…" : "Generate lesson"}
          </Button>

          {hasContent && (
            <p className="text-xs text-warning">
              Heads up: generating will replace the current title and content.
            </p>
          )}
          {error && (
            <div className="rounded-lg p-2.5 bg-error-soft text-error text-sm">{error}</div>
          )}
        </div>
      )}
    </div>
  );
}
