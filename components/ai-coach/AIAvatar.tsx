interface AIAvatarProps {
  state?: "idle" | "thinking";
}

export default function AIAvatar({ state = "idle" }: AIAvatarProps) {
  return (
    <div
      className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[var(--gradient-primary)] shadow-[0_4px_12px_-4px_color-mix(in_srgb,var(--primary)_55%,transparent)]"
      aria-hidden
    >
      <span
        className={`text-white text-sm leading-none ${state === "thinking" ? "animate-pulse" : ""}`}
      >
        ✦
      </span>
      <span className="absolute inset-0 rounded-md shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.25)]" />
    </div>
  );
}
