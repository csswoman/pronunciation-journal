import AIAvatar from "./AIAvatar";

export default function TypingIndicator() {
  return (
    <div className="flex items-end justify-start gap-3">
      <div className="flex-shrink-0 w-7 h-7">
        <AIAvatar state="thinking" />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{
          background: "linear-gradient(135deg, oklch(0.21 0.018 var(--hue)), oklch(0.18 0.012 var(--hue)))",
          borderLeft: "3px solid var(--primary)",
          boxShadow: "0 1px 3px oklch(0 0 0 / 0.3), inset 0 0 0 1px oklch(1 0 0 / 0.04)",
        }}
      >
        <span
          className="text-base tracking-[0.3em]"
          style={{ color: "var(--primary)", opacity: 0.8 }}
        >
          •••
        </span>
      </div>
    </div>
  );
}
