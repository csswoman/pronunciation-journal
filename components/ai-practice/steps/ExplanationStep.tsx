"use client";

import { NavButtons } from "./NavButtons";

export function ExplanationStep({
  content,
  onComplete,
  onPrev,
}: {
  content: string;
  onComplete: () => void;
  onPrev?: () => void;
}) {
  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div
        className="w-full max-w-lg p-6 rounded-2xl border text-sm leading-relaxed"
        style={{
          backgroundColor: "var(--btn-regular-bg)",
          borderColor: "var(--line-divider)",
          color: "var(--text-secondary)",
        }}
      >
        {content}
      </div>
      <NavButtons onPrev={onPrev} onNext={onComplete} nextLabel="Got it →" />
    </div>
  );
}
