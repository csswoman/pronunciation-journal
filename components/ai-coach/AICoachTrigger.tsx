"use client";

import { useAICoachStore } from "@/lib/stores/aiCoachStore";

export default function AICoachTrigger() {
  const { isOpen, toggle } = useAICoachStore();

  return (
    <button
      onClick={toggle}
      aria-label={isOpen ? "Close AI Coach" : "Open AI Coach"}
      title="AI Coach"
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-200 lg:bottom-8 lg:right-8"
      style={{
        backgroundColor: isOpen
          ? "var(--primary)"
          : "color-mix(in oklch, var(--primary) 88%, transparent)",
        color: "white",
        boxShadow: isOpen
          ? "0 0 0 4px color-mix(in oklch, var(--primary) 25%, transparent), 0 4px 16px color-mix(in oklch, var(--primary) 35%, transparent)"
          : "0 4px 16px color-mix(in oklch, var(--primary) 30%, transparent)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 0 0 4px color-mix(in oklch, var(--primary) 25%, transparent), 0 6px 20px color-mix(in oklch, var(--primary) 45%, transparent)";
        e.currentTarget.style.transform = "scale(1.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isOpen
          ? "0 0 0 4px color-mix(in oklch, var(--primary) 25%, transparent), 0 4px 16px color-mix(in oklch, var(--primary) 35%, transparent)"
          : "0 4px 16px color-mix(in oklch, var(--primary) 30%, transparent)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {isOpen ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      ) : (
        <span aria-hidden>✦</span>
      )}
    </button>
  );
}
