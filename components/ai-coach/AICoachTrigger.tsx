"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { useAICoachStore } from "@/lib/stores/aiCoachStore";

interface AICoachTriggerProps {
  variant?: "fab" | "nav";
  className?: string;
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function TriggerIcon({ isOpen }: { isOpen: boolean }) {
  return isOpen ? <CloseIcon /> : <span aria-hidden className="text-lg font-bold">✦</span>;
}

export default function AICoachTrigger({ variant = "fab", className }: AICoachTriggerProps) {
  const { isOpen, toggle } = useAICoachStore();
  const [hovered, setHovered] = useState(false);

  const shadow = hovered
    ? "0 0 0 4px color-mix(in oklch, var(--primary) 25%, transparent), 0 6px 20px color-mix(in oklch, var(--primary) 45%, transparent)"
    : isOpen
      ? "0 0 0 4px color-mix(in oklch, var(--primary) 25%, transparent), 0 4px 16px color-mix(in oklch, var(--primary) 35%, transparent)"
      : "0 4px 16px color-mix(in oklch, var(--primary) 30%, transparent)";

  const navShadow = isOpen
    ? "0 0 0 4px color-mix(in oklch, var(--primary) 25%, transparent), 0 6px 18px color-mix(in oklch, var(--primary) 40%, transparent)"
    : "0 4px 14px color-mix(in oklch, var(--primary) 35%, transparent)";

  if (variant === "nav") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "Close AI Coach" : "Open AI Coach"}
        title="AI Coach"
        className={cn(
          "flex shrink-0 items-center justify-center w-14 h-14 -mt-5 rounded-full text-white transition-all duration-200 active:scale-95",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] motion-reduce:transition-none",
          className,
        )}
        style={{
          backgroundColor: "var(--primary)",
          boxShadow: navShadow,
        }}
      >
        <TriggerIcon isOpen={isOpen} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isOpen ? "Close AI Coach" : "Open AI Coach"}
      title="AI Coach"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "fixed bottom-6 right-6 z-40 w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-200 lg:bottom-8 lg:right-8",
        className,
      )}
      style={{
        backgroundColor: isOpen
          ? "var(--primary)"
          : "color-mix(in oklch, var(--primary) 88%, transparent)",
        color: "white",
        boxShadow: shadow,
        transform: hovered ? "scale(1.06)" : "scale(1)",
      }}
    >
      <TriggerIcon isOpen={isOpen} />
    </button>
  );
}
