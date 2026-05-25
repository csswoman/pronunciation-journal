"use client";

import { cn } from "@/lib/cn";

type MatrixCategory = "vowel" | "consonant" | "diphthong";

const TABS: { id: MatrixCategory; label: string }[] = [
  { id: "vowel", label: "Vowels" },
  { id: "consonant", label: "Consonants" },
  { id: "diphthong", label: "Diphthongs" },
];

function KeyHint({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex min-w-[24px] h-6 items-center justify-center rounded-md border px-1.5 text-tiny font-semibold"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--line-divider)",
        color: "var(--text-secondary)",
      }}
    >
      {children}
    </kbd>
  );
}

export default function IPACategoryTabs({
  active,
  onChange,
  counts,
}: {
  active: MatrixCategory;
  onChange: (id: MatrixCategory) => void;
  counts: Record<MatrixCategory, number>;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-1">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                isActive ? "" : "hover:bg-[var(--btn-regular-bg)]"
              )}
              style={{
                backgroundColor: isActive ? "var(--btn-regular-bg)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <span className={isActive ? "font-semibold" : ""}>
                {tab.label}
              </span>
              <span
                className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-tiny font-semibold"
                style={{
                  backgroundColor: isActive
                    ? "var(--card-bg)"
                    : "var(--btn-regular-bg)",
                  color: "var(--text-secondary)",
                }}
              >
                {counts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="hidden md:flex items-center gap-2 text-xs text-fg-muted">
        <KeyHint>←</KeyHint>
        <KeyHint>→</KeyHint>
        <span>navigate</span>
        <span className="opacity-50">·</span>
        <KeyHint>Space</KeyHint>
        <span>play</span>
      </div>
    </div>
  );
}
