"use client";

import { Zap } from "@/components/icons";
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
      className="mx-4 my-3 space-y-3 rounded-2xl border border-[var(--line-divider)] bg-[var(--btn-regular-bg)] p-4"
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--primary)_12%,transparent)]"
        >
          <Zap size={14} className="text-[var(--primary)]" />
        </span>
        <p className="text-sm font-semibold text-fg">
          {hasConversation ? "Session ended" : "AI unavailable right now"}
        </p>
      </div>

      {hasConversation && hasScore && (
        <div
          className="flex items-center justify-between rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-3"
        >
          <div>
            <p className="text-xs font-medium text-fg-muted">
              Exercises completed
            </p>
            <p className="text-lg font-bold mt-0.5 text-fg">
              {correct} / {total}
            </p>
          </div>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-base font-bold text-[var(--primary)]"
            style={{ background: `conic-gradient(var(--primary) ${pct * 3.6}deg, var(--btn-regular-bg) 0deg)` }}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card-bg)] text-sm font-bold text-[var(--primary)]"
            >
              {pct}%
            </span>
          </div>
        </div>
      )}

      <p className="text-body-sm leading-relaxed text-fg-muted">
        The daily AI quota has been reached. Your conversation is saved — you can continue when the quota resets (usually within 24 hours).
      </p>

      <button
        onClick={onNewSession}
        className="w-full rounded-xl bg-[color-mix(in_oklch,var(--primary)_14%,transparent)] py-2 text-xs font-semibold text-[var(--primary)] transition-opacity hover:opacity-80"
      >
        Start new session
      </button>
    </div>
  );
}
