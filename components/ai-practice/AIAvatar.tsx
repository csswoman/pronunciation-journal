import { Sparkles } from "lucide-react";

export default function AIAvatar({ className = "mt-0.5" }: { className?: string }) {
  return (
    <div
      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${className}`}
      style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}
    >
      <Sparkles size={13} strokeWidth={1.8} />
    </div>
  );
}
