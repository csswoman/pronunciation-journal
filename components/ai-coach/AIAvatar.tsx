import { Sparkles } from "lucide-react";

interface AIAvatarProps {
  state?: "idle" | "thinking";
}

export default function AIAvatar({ state = "idle" }: AIAvatarProps) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        background: state === "thinking"
          ? "linear-gradient(135deg, color-mix(in oklch, var(--primary) 30%, oklch(0.20 0.015 var(--hue))), color-mix(in oklch, var(--primary) 20%, oklch(0.16 0.010 var(--hue))))"
          : "linear-gradient(135deg, color-mix(in oklch, var(--primary) 22%, oklch(0.22 0.012 var(--hue))), oklch(0.18 0.010 var(--hue)))",
        boxShadow: "0 0 10px color-mix(in oklch, var(--primary) 30%, transparent), inset 0 0 0 1px oklch(1 0 0 / 0.08)",
        color: "var(--primary)",
      }}
    >
      <Sparkles
        size={12}
        strokeWidth={2}
        className={state === "thinking" ? "animate-pulse" : undefined}
      />
    </div>
  );
}
