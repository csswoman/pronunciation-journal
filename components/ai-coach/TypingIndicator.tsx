import AIAvatar from "./AIAvatar";

export default function TypingIndicator() {
  return (
    <div className="flex items-end justify-start gap-2.5 max-w-[88%]">
      <div className="flex-shrink-0">
        <AIAvatar state="thinking" />
      </div>
      <div className="px-3.5 py-2.5 rounded-lg rounded-tl-sm bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
        <div role="status" aria-label="AI Coach is typing">
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:0ms]" />
            <span className="size-1.5 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:150ms]" />
            <span className="size-1.5 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:300ms]" />
          </span>
        </div>
      </div>
    </div>
  );
}
