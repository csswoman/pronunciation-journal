interface AIAvatarProps {
  state?: "idle" | "thinking";
}

export default function AIAvatar({ state = "idle" }: AIAvatarProps) {
  return (
    <div
      className="relative w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
      style={{
        background: "var(--gradient-primary)",
        boxShadow:
          "0 4px 12px -4px color-mix(in srgb, var(--primary) 55%, transparent)",
      }}
      aria-hidden
    >
      <span
        className={`text-white text-sm leading-none ${state === "thinking" ? "animate-pulse" : ""}`}
      >
        ✦
      </span>
      <span
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: "inset 0 1px 0 0 rgb(255 255 255 / 0.25)" }}
      />
    </div>
  );
}
