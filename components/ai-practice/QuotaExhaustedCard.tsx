"use client";

import { Zap } from "lucide-react";
import type { AIMessage } from "@/lib/ai-practice/types";
import type { ExerciseResult } from "@/lib/ai-practice/types";

interface QuotaExhaustedCardProps {
  messages: AIMessage[];
  onNewSession: () => void;
}

function computeScore(messages: AIMessage[]): { total: number; correct: number } {
  let total = 0;
  let correct = 0;
  for (const m of messages) {
    if (m.role === "tool" && m.result && typeof (m.result as ExerciseResult).correct === "boolean") {
      total++;
      if ((m.result as ExerciseResult).correct) correct++;
    }
  }
  return { total, correct };
}

export default function QuotaExhaustedCard({ messages, onNewSession }: QuotaExhaustedCardProps) {
  const hasConversation = messages.some(m => m.role === "model" || m.role === "user");
  const { total, correct } = computeScore(messages);
  const hasScore = total > 0;
  const pct = hasScore ? Math.round((correct / total) * 100) : 0;

  return (
    <div
      className="mx-4 my-3 rounded-2xl border p-4 space-y-3"
      style={{
        borderColor: "var(--line-divider)",
        backgroundColor: "var(--btn-regular-bg)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex items-center justify-center w-7 h-7 rounded-full"
          style={{ backgroundColor: "color-mix(in oklch, var(--primary) 12%, transparent)" }}
        >
          <Zap size={14} style={{ color: "var(--primary)" }} />
        </span>
        <p className="text-sm font-semibold" style={{ color: "var(--deep-text)" }}>
          {hasConversation ? "Session ended" : "AI unavailable right now"}
        </p>
      </div>

      {hasConversation && hasScore && (
        <div
          className="rounded-xl p-3 flex items-center justify-between"
          style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--line-divider)" }}
        >
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Exercises completed
            </p>
            <p className="text-lg font-bold mt-0.5" style={{ color: "var(--deep-text)" }}>
              {correct} / {total}
            </p>
          </div>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold"
            style={{
              background: `conic-gradient(var(--primary) ${pct * 3.6}deg, var(--btn-regular-bg) 0deg)`,
              color: "var(--primary)",
            }}
          >
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: "var(--card-bg)", color: "var(--primary)" }}
            >
              {pct}%
            </span>
          </div>
        </div>
      )}

      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        The daily AI quota has been reached. Your conversation is saved — you can continue when the quota resets (usually within 24 hours).
      </p>

      <button
        onClick={onNewSession}
        className="w-full py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
        style={{
          backgroundColor: "color-mix(in oklch, var(--primary) 14%, transparent)",
          color: "var(--primary)",
        }}
      >
        Start new session
      </button>
    </div>
  );
}
