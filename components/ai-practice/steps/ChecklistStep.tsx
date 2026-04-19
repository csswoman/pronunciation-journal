"use client";

import { useState } from "react";
import { NavButtons } from "./NavButtons";

export function ChecklistStep({
  items,
  onComplete,
  onPrev,
}: {
  items: string[];
  onComplete: () => void;
  onPrev?: () => void;
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const allDone = checked.size === items.length;

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="w-full max-w-lg flex flex-col gap-6">
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i}>
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all text-sm"
              style={{
                borderColor: checked.has(i) ? "var(--primary)" : "var(--line-divider)",
                backgroundColor: checked.has(i) ? "var(--btn-regular-bg-active)" : "var(--card-bg)",
                color: checked.has(i) ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <span
                className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center mt-0.5 transition-all"
                style={{
                  borderColor: checked.has(i) ? "var(--primary)" : "var(--line-divider)",
                  backgroundColor: checked.has(i) ? "var(--primary)" : "transparent",
                }}
              >
                {checked.has(i) && (
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {item}
            </button>
          </li>
        ))}
      </ul>

      {allDone && <NavButtons onPrev={onPrev} onNext={onComplete} nextLabel="All set! →" />}
    </div>
  );
}
