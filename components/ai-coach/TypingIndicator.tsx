import AIAvatar from "./AIAvatar";

export default function TypingIndicator() {
  return (
    <div className="flex max-w-[min(88%,36rem)] items-end justify-start gap-2.5">
      <AIAvatar state="thinking" />
      <div
        className="rounded-md rounded-bl-sm border border-border-subtle bg-surface-raised px-3.5 py-2.5"
        role="status"
        aria-label="AI Coach is typing"
      >
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms] motion-reduce:animate-none" />
          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms] motion-reduce:animate-none" />
          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms] motion-reduce:animate-none" />
        </span>
      </div>
    </div>
  );
}
