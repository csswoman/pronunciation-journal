import AIAvatar from "./AIAvatar";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2.5">
      <AIAvatar />
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-md border"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--line-divider)",
        }}
      >
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: "var(--text-tertiary)" }} />
          <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: "var(--text-tertiary)" }} />
          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--text-tertiary)" }} />
        </div>
      </div>
    </div>
  );
}
