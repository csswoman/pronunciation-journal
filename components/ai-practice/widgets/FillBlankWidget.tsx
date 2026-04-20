"use client";

import { useState, useRef } from "react";
import type { FillBlankArgs } from "@/lib/ai-practice/tools/registry";
import type { ExerciseResult } from "@/lib/ai-practice/types";

interface Props {
  args: FillBlankArgs;
  status: "pending" | "rendered" | "answered" | "error";
  onAnswer: (result: ExerciseResult) => void;
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[.,!?;:'"]/g, "");
}

export default function FillBlankWidget({ args, status, onAnswer }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const answered = status === "answered";

  const correct =
    submitted &&
    (normalize(value) === normalize(args.answer) ||
      (args.acceptableAnswers ?? []).some(a => normalize(value) === normalize(a)));

  function handleSubmit() {
    if (!value.trim() || answered) return;
    setSubmitted(true);
    const isCorrect =
      normalize(value) === normalize(args.answer) ||
      (args.acceptableAnswers ?? []).some(a => normalize(value) === normalize(a));
    onAnswer({ correct: isCorrect, topic: args.topic, gradedBy: "client" });
  }

  const parts = args.sentence.split("___");

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)" }}
    >
      {args.hint && (
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Hint: {args.hint}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1 text-sm" style={{ color: "var(--text-primary)" }}>
        <span>{parts[0]}</span>
        <input
          ref={inputRef}
          value={answered ? (submitted ? value : args.answer) : value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          disabled={answered}
          placeholder="…"
          className="border-b outline-none bg-transparent text-center min-w-[80px] px-1"
          style={{
            borderColor: !submitted
              ? "var(--primary)"
              : correct
              ? "var(--success, #22c55e)"
              : "#ef4444",
            color: "var(--text-primary)",
          }}
        />
        {parts[1] && <span>{parts[1]}</span>}
      </div>

      {submitted && (
        <p
          className="text-xs"
          style={{ color: correct ? "var(--success, #22c55e)" : "#ef4444" }}
        >
          {correct ? "Correct!" : `Answer: ${args.answer}`}
        </p>
      )}

      {!answered && (
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="text-xs px-3 py-1 rounded-lg transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-fg, #fff)" }}
        >
          Check
        </button>
      )}
    </div>
  );
}
