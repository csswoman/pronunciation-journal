interface ChatHeaderProps {
  hasMessages: boolean;
  onReset: () => void;
}

export default function ChatHeader({ hasMessages, onReset }: ChatHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
      style={{ borderColor: "var(--line-divider)" }}
    >
      {hasMessages ? (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-sm transition-colors px-3 py-1.5 rounded-lg"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-tertiary)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          New session
        </button>
      ) : (
        <p className="text-sm font-medium px-1" style={{ color: "var(--text-tertiary)" }}>
          AI Coach
        </p>
      )}
    </div>
  );
}
