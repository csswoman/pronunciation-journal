"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface ExerciseBlockProps {
  instruction: string;
  items: string[];
}

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path
      d="M2 6l3 3 5-5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ExerciseBlock({ instruction, items }: ExerciseBlockProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  function toggle(idx: number) {
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  return (
    <div className="mini-lessons__block">
      <p className="mini-lessons__block-label">{instruction}</p>
      <div className="mini-lessons__exercise-list">
        {items.map((item, idx) => {
          const isChecked = checked[idx] ?? false;
          return (
            <button
              key={idx}
              type="button"
              className={cn(
                "mini-lessons__exercise-item",
                isChecked && "mini-lessons__exercise-item--checked"
              )}
              onClick={() => toggle(idx)}
              aria-pressed={isChecked}
            >
              <span className="mini-lessons__exercise-marker" aria-hidden>
                <span className="mini-lessons__exercise-number">
                  {idx + 1}
                </span>
                <span className="mini-lessons__exercise-check">
                  <CheckIcon />
                </span>
              </span>
              <span className="mini-lessons__exercise-text">{item}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
