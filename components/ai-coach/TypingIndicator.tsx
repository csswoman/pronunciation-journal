import AIAvatar from "./AIAvatar";

export default function TypingIndicator() {
  return (
    <div className="flex items-end justify-start gap-2.5 max-w-[88%]">
      <div className="flex-shrink-0">
        <AIAvatar state="thinking" />
      </div>
      <div className="px-3.5 py-2.5 rounded-[14px] rounded-tl-[6px] bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
        <div role="status" aria-label="AI Coach is typing">
        <span className="inline-flex gap-1 items-center">
          <span
            className="size-1.5 rounded-full bg-[var(--primary)] animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="size-1.5 rounded-full bg-[var(--primary)] animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="size-1.5 rounded-full bg-[var(--primary)] animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </span>
        </div>
      </div>
    </div>
  );
}
