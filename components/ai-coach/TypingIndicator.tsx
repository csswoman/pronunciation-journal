"use client";

import AIAvatar from "./AIAvatar";

// Planned structure:
// <TypingIndicator>
//   <ThinkingPill>
//     <AIAvatar state="thinking" />
//     <ThinkingLabel />
//   </ThinkingPill>
// </TypingIndicator>

export default function TypingIndicator() {
  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-full border border-border-subtle bg-surface-raised/80 px-2.5 py-1.5 shadow-sm backdrop-blur-sm"
      role="status"
      aria-label="AI Coach is thinking"
    >
      <AIAvatar state="thinking" />
      <span className="pr-1.5 text-body-sm font-medium tracking-tight text-fg-muted">
        Thinking…
      </span>
    </div>
  );
}
